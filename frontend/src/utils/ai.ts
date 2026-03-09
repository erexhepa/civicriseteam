export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/** Thrown when the backend chat endpoint returns a non-ok response (e.g. 503). */
export class ChatApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string
  ) {
    super(message)
    this.name = 'ChatApiError'
  }
}

const getApiBase = (): string => {
  const url = import.meta.env.VITE_API_URL
  return typeof url === 'string' && url.trim() ? url.trim().replace(/\/$/, '') : 'http://localhost:8000'
}

/**
 * Calls the Python backend chat stream endpoint. Returns the raw Response
 * so the consumer can read the NDJSON stream (content_block_delta with delta.text).
 * Pass authToken so the backend can identify the current user (required for protected endpoint).
 */
export async function genAIResponse(params: {
  data: {
    messages: Array<Message>
    systemPrompt?: { value: string; enabled: boolean }
  }
  authToken?: string | null
}): Promise<Response> {
  const { messages, systemPrompt } = params.data
  const base = getApiBase()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (params.authToken) {
    headers['Authorization'] = `Bearer ${params.authToken}`
  }
  const res = await fetch(`${base}/api/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
      systemPrompt: systemPrompt ?? undefined,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText })) as { detail?: string; error?: string }
    const message = err.detail ?? err.error ?? res.statusText ?? 'Failed to get AI response'
    throw new ChatApiError(message, res.status, err.detail)
  }
  return res
}
