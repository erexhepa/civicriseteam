import type { Handler } from '@netlify/functions'
import { indexSourcesFromUrls } from '../../src/server/rag'

// Scheduled entry point for indexing official city sources into Netlify Blobs.
export const handler: Handler = async () => {
  const sourceConfig = process.env.NETLIFY_RAG_SOURCE_URLS || ''
  const sourceUrls = sourceConfig
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (sourceUrls.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        ok: false,
        message: 'Missing NETLIFY_RAG_SOURCE_URLS. Provide a comma-separated list of crawl URLs.',
      }),
    }
  }

  try {
    const result = await indexSourcesFromUrls(sourceUrls)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        indexedChunks: result.indexed,
        indexedSources: result.sourceCount,
      }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : 'Unexpected crawler failure',
      }),
    }
  }
}
