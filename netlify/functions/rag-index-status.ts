import type { Handler } from '@netlify/functions'
import { getRagIndexStatus } from '../../src/server/rag'

export const handler: Handler = async () => {
  try {
    const status = await getRagIndexStatus()
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, ...status }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to load RAG index status.',
      }),
    }
  }
}
