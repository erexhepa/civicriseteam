import { createHash } from 'node:crypto'
import { getStore } from '@netlify/blobs'

type AppMode = 'citizen' | 'dispatcher'

export interface RetrievedChunk {
  sourceName: string
  snippet: string
  note?: string
}

interface RagChunk {
  id: string
  sourceName: string
  sourceUrl: string
  text: string
  updatedAt: string
}

interface RagIndexMeta {
  indexedAt: string
  indexed: number
  sourceCount: number
}

export interface RagIndexStatus {
  indexedAt: string | null
  indexedChunks: number
  indexedSources: number
}

const DEFAULT_STORE_NAME = process.env.NETLIFY_RAG_STORE || 'civic-rag'
const DEFAULT_TOP_K = Number(process.env.NETLIFY_RAG_TOP_K || '5')

function getRagStore() {
  return getStore(DEFAULT_STORE_NAME)
}

function normalizeText(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitIntoChunks(sourceName: string, sourceUrl: string, rawText: string): RagChunk[] {
  const text = normalizeText(rawText)
  if (!text) return []

  const maxLen = 1200
  const overlap = 180
  const chunks: RagChunk[] = []

  let start = 0
  while (start < text.length) {
    const end = Math.min(start + maxLen, text.length)
    const slice = text.slice(start, end).trim()
    if (slice.length > 80) {
      const id = createHash('sha256').update(`${sourceUrl}-${start}-${slice}`).digest('hex')
      chunks.push({
        id,
        sourceName,
        sourceUrl,
        text: slice,
        updatedAt: new Date().toISOString(),
      })
    }

    if (end >= text.length) break
    start = Math.max(end - overlap, start + 1)
  }

  return chunks
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
}

function scoreChunk(query: string, chunk: RagChunk, mode: AppMode, residentZip?: string): number {
  const queryTokens = tokenize(query)
  const docTokens = tokenize(chunk.text)
  if (queryTokens.length === 0 || docTokens.length === 0) return 0

  const tokenSet = new Set(docTokens)
  let overlap = 0
  for (const token of queryTokens) {
    if (tokenSet.has(token)) overlap += 1
  }

  let score = overlap / Math.sqrt(queryTokens.length * tokenSet.size)

  if (mode === 'dispatcher' && /incident|cluster|route|dispatch|closure|public works|sanitation/i.test(chunk.text)) {
    score += 0.2
  }

  if (residentZip && new RegExp(`\\b${residentZip}\\b`).test(chunk.text)) {
    score += 0.25
  }

  return score
}

export async function indexSourcesFromUrls(sourceUrls: string[]): Promise<{ indexed: number; sourceCount: number }> {
  const store = getRagStore()
  const uniqueUrls = Array.from(new Set(sourceUrls.map((url) => url.trim()).filter(Boolean)))

  // Clear old chunks so retrieval reflects the latest source snapshots.
  const existing = await store.list({ prefix: 'chunk:' })
  await Promise.all(existing.blobs.map((entry) => store.delete(entry.key)))

  let indexed = 0

  for (const sourceUrl of uniqueUrls) {
    const response = await fetch(sourceUrl)
    if (!response.ok) continue

    const raw = await response.text()
    const sourceName = new URL(sourceUrl).hostname
    const chunks = splitIntoChunks(sourceName, sourceUrl, raw)

    await Promise.all(
      chunks.map((chunk) =>
        store.setJSON(`chunk:${chunk.id}`, chunk, {
          metadata: {
            sourceName: chunk.sourceName,
            sourceUrl: chunk.sourceUrl,
            updatedAt: chunk.updatedAt,
          },
        }),
      ),
    )

    indexed += chunks.length
  }

  await store.setJSON('meta:index', {
    indexedAt: new Date().toISOString(),
    indexed,
    sourceCount: uniqueUrls.length,
  })

  return {
    indexed,
    sourceCount: uniqueUrls.length,
  }
}

export async function retrieveFromRag(options: {
  query: string
  mode: AppMode
  residentZip?: string
  topK?: number
}): Promise<RetrievedChunk[]> {
  const store = getRagStore()
  const topK = options.topK ?? DEFAULT_TOP_K
  const list = await store.list({ prefix: 'chunk:' })

  if (list.blobs.length === 0) {
    return []
  }

  const loaded = await Promise.all(
    list.blobs.map(async (entry) => {
      const chunk = await store.get(entry.key, { type: 'json' }) as RagChunk | null
      return chunk
    }),
  )

  const scored = loaded
    .filter((chunk): chunk is RagChunk => Boolean(chunk && chunk.text))
    .map((chunk) => ({
      chunk,
      score: scoreChunk(options.query, chunk, options.mode, options.residentZip),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return scored.map(({ chunk, score }) => ({
    sourceName: chunk.sourceName,
    snippet: chunk.text,
    note: `score=${score.toFixed(3)}; source=${chunk.sourceUrl}`,
  }))
}

export async function getRagIndexStatus(): Promise<RagIndexStatus> {
  const store = getRagStore()
  const meta = await store.get('meta:index', { type: 'json' }) as RagIndexMeta | null
  const chunkList = await store.list({ prefix: 'chunk:' })

  return {
    indexedAt: meta?.indexedAt ?? null,
    indexedChunks: chunkList.blobs.length,
    indexedSources: meta?.sourceCount ?? 0,
  }
}
