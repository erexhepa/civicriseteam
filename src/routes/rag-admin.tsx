import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

type TriggerResponse = {
  ok?: boolean
  indexedChunks?: number
  indexedSources?: number
  message?: string
}

type StatusResponse = {
  ok?: boolean
  indexedAt?: string | null
  indexedChunks?: number
  indexedSources?: number
  message?: string
}

async function parseApiResponse<T>(response: Response): Promise<{ payload: T | null; rawText: string }> {
  const rawText = await response.text()
  try {
    return {
      payload: JSON.parse(rawText) as T,
      rawText,
    }
  } catch {
    return {
      payload: null,
      rawText,
    }
  }
}

function RagAdminPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [result, setResult] = useState<TriggerResponse | null>(null)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchIndexStatus = useCallback(async () => {
    setIsLoadingStatus(true)
    try {
      const response = await fetch('/.netlify/functions/rag-index-status')
      const { payload, rawText } = await parseApiResponse<StatusResponse>(response)
      setStatus(payload)
      if (!response.ok) {
        setError(payload?.message || rawText || 'Failed to load index status.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load index status.')
    } finally {
      setIsLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    fetchIndexStatus()
  }, [fetchIndexStatus])

  const triggerReindex = async () => {
    setIsRunning(true)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/crawl-city-sources', {
        method: 'POST',
      })

      const { payload, rawText } = await parseApiResponse<TriggerResponse>(response)
      if (!payload) {
        setError(rawText || 'Unexpected non-JSON response from indexing endpoint.')
        setResult(null)
        return
      }

      setResult(payload)

      if (!response.ok) {
        setError(payload.message || rawText || 'Failed to trigger re-indexing.')
      } else {
        await fetchIndexStatus()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected re-indexing error.')
      setResult(null)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">RAG Admin</h1>
            <p className="text-gray-300 mt-2">Run source indexing on demand to refresh Netlify Blobs knowledge.</p>
          </div>
          <Link
            to="/"
            className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 transition-colors text-sm font-medium"
          >
            Back to Chat
          </Link>
        </header>

        <section className="rounded-lg border border-gray-700 bg-gray-800/60 p-5 space-y-4">
          <div className="text-sm text-gray-200 border border-gray-700 rounded-md p-3 bg-gray-900/50 space-y-1">
            <p className="font-medium text-orange-200">Index Freshness</p>
            {isLoadingStatus ? (
              <p>Loading status...</p>
            ) : (
              <>
                <p>
                  Last indexed at:{' '}
                  {status?.indexedAt ? new Date(status.indexedAt).toLocaleString() : 'Not indexed yet'}
                </p>
                <p>Indexed sources: {status?.indexedSources ?? 0}</p>
                <p>Indexed chunks: {status?.indexedChunks ?? 0}</p>
              </>
            )}

            <button
              type="button"
              onClick={fetchIndexStatus}
              disabled={isLoadingStatus}
              className="mt-2 px-3 py-1.5 rounded border border-orange-500/50 text-orange-200 hover:bg-orange-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoadingStatus ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>

          <button
            type="button"
            onClick={triggerReindex}
            disabled={isRunning}
            className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isRunning ? 'Re-indexing...' : 'Re-index Sources Now'}
          </button>

          {error && (
            <p className="text-sm text-red-300">{error}</p>
          )}

          {result && (
            <div className="text-sm text-gray-200 border border-gray-700 rounded-md p-3 bg-gray-900/50 space-y-1">
              <p>Status: {result.ok ? 'ok' : 'error'}</p>
              {typeof result.indexedSources === 'number' && <p>Indexed sources: {result.indexedSources}</p>}
              {typeof result.indexedChunks === 'number' && <p>Indexed chunks: {result.indexedChunks}</p>}
              {result.message && <p>Message: {result.message}</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/rag-admin')({
  component: RagAdminPage,
})
