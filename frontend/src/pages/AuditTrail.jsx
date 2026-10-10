import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react'
import { getAuditTrail } from '../api/api'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

export default function AuditTrail() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('')
  const [actionQuery, setActionQuery] = useState('')

  useEffect(() => {
    loadAudit()
  }, [entityFilter])

  function loadAudit() {
    setLoading(true)
    getAuditTrail({ entity_type: entityFilter, action: actionQuery })
      .then((data) => setEvents(data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }

  function handleSearch(e) {
    e.preventDefault()
    loadAudit()
  }

  return (
    <>
      <PageHeader
        eyebrow="Governance / Immutability"
        title="Audit Trail & System Logs"
        subtitle="Cryptographically backed governance trail recording user actions, uploads, analyses, and report exports."
      />

      {/* Filter Toolbar */}
      <div className="panel p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-400 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition">
            <Search size={16} />
            <input
              value={actionQuery}
              onChange={(e) => setActionQuery(e.target.value)}
              placeholder="Search action keyword or actor name..."
              className="w-full bg-transparent text-sm text-[#0b2042] outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="">All Entities</option>
              <option value="BidCase">Bid Cases</option>
              <option value="Document">Documents</option>
              <option value="AnalysisRun">Analysis Engine</option>
              <option value="RiskAlert">Risk Alerts</option>
              <option value="Report">Reports</option>
              <option value="User">Authentication</option>
            </select>

            <button type="submit" className="btn-secondary text-xs px-3">
              Filter
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <LoadingState label="Retrieving audit logs from database..." />
      ) : events.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Audit Records Found"
          description="Actions performed in the workspace will be permanently logged here."
        />
      ) : (
        <div className="panel p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[#0b2042]">
                <History size={22} />
              </span>
              <div>
                <h2 className="font-display font-bold text-base text-[#0b2042]">Workspace Activity Stream</h2>
                <p className="text-xs text-slate-400">Total recorded events: {events.length}</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <ShieldCheck size={14} className="text-emerald-600" /> Tamper Protected
            </span>
          </div>

          <div className="relative ml-3 border-l-2 border-slate-200 pl-8 space-y-8">
            {events.map((event) => {
              const isFailure = event.outcome === 'FAILURE'
              return (
                <div key={event.id} className="relative group">
                  {/* Indicator Dot */}
                  <span
                    className={`absolute -left-[41px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white ${
                      isFailure ? 'bg-red-500' : 'bg-emerald-400'
                    }`}
                  >
                    {isFailure ? (
                      <AlertCircle size={12} className="text-white" />
                    ) : (
                      <CheckCircle2 size={12} className="text-white" />
                    )}
                  </span>

                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {event.actor}
                        </span>
                        <span className="text-xs font-mono text-slate-400 font-semibold">
                          #{event.id} &bull; {event.entityType}
                        </span>
                      </div>

                      <h3 className="mt-1.5 font-display font-bold text-sm text-[#0b2042]">
                        {event.action}
                      </h3>

                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {event.result}
                      </p>

                      {event.caseId && event.caseId !== 'System' && (
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          Scope: {event.caseId}
                        </p>
                      )}
                    </div>

                    <time className="shrink-0 text-xs font-mono text-slate-400 sm:text-right mt-1 sm:mt-0">
                      {event.time}
                    </time>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
