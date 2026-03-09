import { createServerFn } from '@tanstack/react-start'
import { Anthropic } from '@anthropic-ai/sdk'
import { retrieveFromRag } from '../server/rag'

export type AppMode = 'citizen' | 'dispatcher'

export interface Citation {
  sourceName: string
  note?: string
}

export interface IncidentWarning {
  title: string
  area: string
  summary: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  incidentWarning?: IncidentWarning
}

interface AIResponsePayload {
  answer: string
  citations?: Citation[]
  incidentWarning?: IncidentWarning
}

const BASE_GUARDRAILS = `You are Montgomery Civic Copilot.

Rules:
- Stay factual and grounded in verified data only.
- Never fabricate city schedules, incidents, ticket statuses, or policies.
- If verified information is missing, say: "I don't have verified information on that yet, but here's the correct next step."
- Keep responses concise and actionable.
- Use plain language.
- Include structured call-to-action bullets when helpful.

Output strictly as JSON with this exact shape:
{
  "answer": "string",
  "citations": [{ "sourceName": "string", "note": "optional string" }],
  "incidentWarning": { "title": "string", "area": "string", "summary": "string" } | null
}

Use an empty array for citations when no verified source is available.
Use null for incidentWarning when there is no verified active disruption.`

const CITIZEN_SYSTEM_PROMPT = `Citizen-facing mode.
- Help residents with city services and 311 guidance.
- Keep tone warm and resident-friendly.
- If user reports an issue, suggest category and next step for Snap & Submit.`

const DISPATCHER_SYSTEM_PROMPT = `Dispatcher mode.
- Help city workers summarize, triage, and sequence incident clusters.
- Keep tone operational and concise.
- Do not publish incidents, dispatch crews, or alter records.`

function buildSystemPrompt(mode: AppMode): string {
  const modePrompt = mode === 'dispatcher' ? DISPATCHER_SYSTEM_PROMPT : CITIZEN_SYSTEM_PROMPT
  return `${BASE_GUARDRAILS}\n\n${modePrompt}`
}

function parseAIResponse(text: string): AIResponsePayload {
  const normalized = text.trim()
  const blockMatch = normalized.match(/```json\s*([\s\S]*?)```/i)
  const candidate = blockMatch?.[1] ?? normalized

  try {
    const parsed = JSON.parse(candidate) as AIResponsePayload
    return {
      answer: parsed.answer?.trim() || 'I could not produce a verified answer right now.',
      citations: Array.isArray(parsed.citations) ? parsed.citations : [],
      incidentWarning: parsed.incidentWarning ?? undefined,
    }
  } catch {
    return {
      answer: normalized || 'I could not produce a verified answer right now.',
      citations: [],
    }
  }
}

export const genAIResponse = createServerFn({ method: 'GET', response: 'raw' })
  .inputValidator(
    (d: {
      messages: Array<Message>
      mode: AppMode
      residentZip?: string
    }) => d,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error(
        'Missing API key: Please set ANTHROPIC_API_KEY in your environment variables or .env file.'
      )
    }

    const anthropic = new Anthropic({
      apiKey,
      timeout: 30000,
    })

    const formattedMessages = data.messages
      .filter(
        (msg) =>
          msg.content.trim() !== '' &&
          !msg.content.startsWith('Sorry, I encountered an error'),
      )
      .map((msg) => ({
        role: msg.role,
        content: msg.content.trim(),
      }))

    if (formattedMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages to send' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userQuery = formattedMessages[formattedMessages.length - 1]?.content || ''
    const retrievedContext = await retrieveFromRag({
      query: userQuery,
      mode: data.mode,
      residentZip: data.residentZip,
    })
    const contextBlock = retrievedContext
      .map((chunk, index) => `Source ${index + 1}: ${chunk.sourceName}${chunk.note ? ` (${chunk.note})` : ''}\n${chunk.snippet}`)
      .join('\n\n')

    const zipContext = data.residentZip
      ? `User ZIP context: ${data.residentZip}. Add incidentWarning only when verified context supports it.`
      : 'No ZIP context supplied.'
    const ragContext = contextBlock
      ? `Verified retrieved context:\n${contextBlock}`
      : 'Verified retrieved context: none available.'
    const systemPrompt = `${buildSystemPrompt(data.mode)}\n\n${zipContext}\n\n${ragContext}`

    try {
      const completion = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1200,
        system: systemPrompt,
        messages: formattedMessages,
      })

      const rawText = completion.content
        .filter((block) => block.type === 'text')
        .map((block) => ('text' in block ? block.text : ''))
        .join('\n')

      const parsed = parseAIResponse(rawText)
      if ((!parsed.citations || parsed.citations.length === 0) && retrievedContext.length > 0) {
        parsed.citations = retrievedContext.map((chunk) => ({
          sourceName: chunk.sourceName,
          note: chunk.note,
        }))
      }

      return new Response(JSON.stringify(parsed), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Error in genAIResponse:', error)
      
      // Error handling with specific messages
      let errorMessage = 'Failed to get AI response'
      let statusCode = 500
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.'
        } else if (error.message.includes('Connection error') || error.name === 'APIConnectionError') {
          errorMessage = 'Connection to Anthropic API failed. Please check your internet connection and API key.'
          statusCode = 503 // Service Unavailable
        } else if (error.message.includes('authentication')) {
          errorMessage = 'Authentication failed. Please check your Anthropic API key.'
          statusCode = 401 // Unauthorized
        } else {
          errorMessage = error.message
        }
      }
      
      return new Response(JSON.stringify({ 
        answer: errorMessage,
        citations: [],
        details: error instanceof Error ? error.name : undefined,
      }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }) 