import type { Handler } from '@netlify/functions'
import { retrieveFromRag } from '../../src/server/rag'

// Retrieval endpoint used by the LLM layer to fetch verified city context.
export const handler: Handler = async (event) => {
  const query = event.queryStringParameters?.query?.trim()
  const modeParam = event.queryStringParameters?.mode
  const residentZip = event.queryStringParameters?.residentZip?.trim()
  const topKParam = event.queryStringParameters?.topK

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, message: 'Missing query parameter.' }),
    }
  }

  const mode = modeParam === 'dispatcher' ? 'dispatcher' : 'citizen'
  const topK = topKParam ? Number(topKParam) : undefined

  try {
    const chunks = await retrieveFromRag({
      query,
      mode,
      residentZip,
      topK: Number.isFinite(topK as number) ? topK : undefined,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, chunks }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : 'Netlify RAG retrieval failed.',
      }),
    }
  }

}
