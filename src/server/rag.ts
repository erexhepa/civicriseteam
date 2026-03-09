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

interface XmlRecord {
  title?: string
  body: string
  updatedAt?: string
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
const INDEX_FETCH_TIMEOUT_MS = Number(process.env.NETLIFY_RAG_FETCH_TIMEOUT_MS || '15000')
const MAX_XML_RECORDS_PER_SOURCE = Number(process.env.NETLIFY_RAG_MAX_XML_RECORDS || '150')
const MAX_CHUNKS_PER_SOURCE = Number(process.env.NETLIFY_RAG_MAX_CHUNKS_PER_SOURCE || '500')

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

function isLikelyXml(rawText: string, contentType: string | null): boolean {
  if (contentType && /xml|rss|atom/i.test(contentType)) {
    return true
  }

  const start = rawText.slice(0, 300).toLowerCase()
  return start.includes('<?xml') || start.includes('<rss') || start.includes('<feed')
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function getFirstTagValue(block: string, tags: string[]): string | undefined {
  for (const tag of tags) {
    const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
    const match = block.match(regex)
    if (match?.[1]) {
      const value = normalizeText(decodeXmlEntities(match[1]))
      if (value) {
        return value
      }
    }
  }

  return undefined
}

function extractXmlBlocks(rawText: string, tag: 'item' | 'entry'): string[] {
  const blocks: string[] = []
  const lower = rawText.toLowerCase()
  const openNeedle = `<${tag}`
  const closeNeedle = `</${tag}>`

  let cursor = 0
  while (cursor < rawText.length) {
    const start = lower.indexOf(openNeedle, cursor)
    if (start === -1) break

    const openEnd = lower.indexOf('>', start)
    if (openEnd === -1) break

    const close = lower.indexOf(closeNeedle, openEnd + 1)
    if (close === -1) break

    const end = close + closeNeedle.length
    blocks.push(rawText.slice(start, end))
    cursor = end
  }

  return blocks
}

function parseXmlRecords(rawText: string): XmlRecord[] {
  const records: XmlRecord[] = []
  const itemBlocks = extractXmlBlocks(rawText, 'item')
  const entryBlocks = itemBlocks.length > 0 ? [] : extractXmlBlocks(rawText, 'entry')
  const entryMatches = itemBlocks.length > 0 ? itemBlocks : entryBlocks

  if (entryMatches.length === 0) {
    const normalized = normalizeText(decodeXmlEntities(rawText))
    if (normalized.length > 80) {
      records.push({ body: normalized })
    }
    return records
  }

  for (const entry of entryMatches) {
    const title = getFirstTagValue(entry, ['title'])
    const body =
      getFirstTagValue(entry, ['description', 'summary', 'content:encoded', 'content']) ||
      normalizeText(decodeXmlEntities(entry))
    const updatedAt = getFirstTagValue(entry, ['updated', 'pubDate', 'lastBuildDate', 'dc:date'])

    if (body.length > 40) {
      records.push({ title, body, updatedAt })
    }
  }

  return records
}

function splitIntoChunks(sourceName: string, sourceUrl: string, rawText: string, updatedAt?: string): RagChunk[] {
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
        updatedAt: updatedAt || new Date().toISOString(),
      })
    }

    if (end >= text.length) break
    start = Math.max(end - overlap, start + 1)
  }

  return chunks
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
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

  // Reset store to avoid large parallel deletions that can fail in serverless runtimes.
  await store.deleteAll()

  let indexed = 0

  for (const sourceUrl of uniqueUrls) {
    let response: Response
    try {
      response = await fetchWithTimeout(sourceUrl, INDEX_FETCH_TIMEOUT_MS)
    } catch {
      continue
    }

    if (!response.ok) continue

    const raw = await response.text()
    const contentType = response.headers.get('content-type')
    const sourceName = new URL(sourceUrl).hostname
    const chunks = isLikelyXml(raw, contentType)
      ? parseXmlRecords(raw).slice(0, MAX_XML_RECORDS_PER_SOURCE).flatMap((record, index) => {
          const combined = record.title ? `${record.title}\n${record.body}` : record.body
          return splitIntoChunks(
            sourceName,
            `${sourceUrl}#entry-${index + 1}`,
            combined,
            record.updatedAt,
          )
        })
      : splitIntoChunks(sourceName, sourceUrl, raw)

    const boundedChunks = chunks.slice(0, MAX_CHUNKS_PER_SOURCE)

    for (const chunk of boundedChunks) {
      try {
        await store.setJSON(`chunk:${chunk.id}`, chunk, {
          metadata: {
            sourceName: chunk.sourceName,
            sourceUrl: chunk.sourceUrl,
            updatedAt: chunk.updatedAt,
          },
        })
      } catch {
        // Skip invalid chunk writes and continue indexing remaining entries.
      }
    }

    indexed += boundedChunks.length
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
