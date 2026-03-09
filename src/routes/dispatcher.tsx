import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAppState } from '../store'
import { getIncidentForZip } from '../utils'

function DispatcherPage() {
  const { appMode, setAppMode, residentZip } = useAppState()
  const incident = getIncidentForZip(residentZip)

  useEffect(() => {
    if (appMode !== 'dispatcher') {
      setAppMode('dispatcher')
    }
  }, [appMode, setAppMode])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dispatcher Operations Workspace</h1>
            <p className="text-gray-300 mt-2">Operational triage view for Montgomery service disruptions and 311 workload support.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/rag-admin" className="px-4 py-2 rounded border border-orange-500/60 text-orange-200 hover:bg-orange-500/10 transition-colors text-sm font-medium">
              RAG Admin
            </Link>
            <Link to="/" className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 transition-colors text-sm font-medium">
              Open Citizen Chat
            </Link>
          </div>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          <article className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-300">Active ZIP Context</h2>
            <p className="mt-2 text-2xl font-bold">{residentZip || 'Not set'}</p>
            <p className="mt-2 text-sm text-gray-300">Set ZIP in Settings from the chat page to enable geofenced alert context.</p>
          </article>

          <article className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-300">Verified Incident Signal</h2>
            <p className="mt-2 text-lg font-semibold">{incident?.title || 'No active disruption for selected ZIP'}</p>
            <p className="mt-2 text-sm text-gray-300">{incident?.summary || 'Use this panel for quick disruption validation before resident messaging.'}</p>
          </article>

          <article className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-300">Close-the-Loop Drafting</h2>
            <p className="mt-2 text-sm text-gray-300">Use dispatcher mode in chat to draft resident-facing completion notes. The assistant only proposes text and does not update ticket systems.</p>
          </article>
        </section>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/dispatcher')({
  component: DispatcherPage,
})
