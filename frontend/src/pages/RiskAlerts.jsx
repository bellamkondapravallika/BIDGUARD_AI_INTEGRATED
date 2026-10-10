import { useEffect, useState } from 'react'
import {
  TriangleAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react'
import { getRiskAlerts, updateRiskStatus } from '../api/api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

export default function RiskAlerts() {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedRisk, setSelectedRisk] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [newStatus, setNewStatus] = useState('In Review')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadRisks()
  }, [severityFilter, statusFilter])

  function loadRisks() {
    setLoading(true)
    getRiskAlerts({ severity: severityFilter, status: statusFilter })
      .then((data) => setRisks(data || []))
      .catch(() => setRisks([]))
      .finally(() => setLoading(false))
  }

  async function handleStatusUpdate(e) {
    e.preventDefault()
    if (!selectedRisk) return
    setUpdating(true)
    try {
      await updateRiskStatus(selectedRisk.id, {
        status: newStatus,
        reviewer_notes: reviewNotes,
      })
      setSelectedRisk(null)
      setReviewNotes('')
      loadRisks()
    } catch (err) {
      alert(err.message || 'Failed to update risk status.')
    } finally {
      setUpdating(false)
    }
  }

  // Calculate severity counters from loaded records
  const criticalCount = risks.filter((r) => r.severity === 'CRITICAL').length
  const highCount = risks.filter((r) => r.severity === 'HIGH').length
  const mediumCount = risks.filter((r) => r.severity === 'MEDIUM').length
  const lowCount = risks.filter((r) => r.severity === 'LOW').length

  return (
    <>
      <PageHeader
        eyebrow="Exceptions / Risk Register"
        title="Risk Alerts & Exception Intelligence"
        subtitle="Prioritized non-compliance exceptions and ambiguous claims requiring formal procurement review."
      />

      {/* Severity Metric Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Critical', criticalCount, 'text-red-600', 'border-red-200 bg-red-50/40'],
          ['High', highCount, 'text-orange-500', 'border-orange-200 bg-orange-50/40'],
          ['Medium', mediumCount, 'text-amber-500', 'border-amber-200 bg-amber-50/40'],
          ['Low', lowCount, 'text-emerald-600', 'border-emerald-200 bg-emerald-50/40'],
        ].map(([label, count, color, bg]) => (
          <div key={label} className={`panel p-4 border ${bg}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label} Exceptions</p>
            <p className={`mt-2 font-display text-3xl font-bold ${color}`}>{count}</p>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="panel p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Filter Alerts:</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="">All Workflow Statuses</option>
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Risk Cards Grid */}
      {loading ? (
        <LoadingState label="Loading active risk alerts from database..." />
      ) : risks.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No Open Risk Alerts"
          description="All evaluated requirements satisfy statutory thresholds, or no risks match your active filters."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {risks.map((r) => (
            <div key={r.id} className="panel p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge label={r.severity} />
                    <span className="font-mono text-xs font-bold text-slate-500">{r.caseId}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{r.age}</span>
                </div>

                <h3 className="mt-3 font-display text-base font-bold text-[#0b2042]">{r.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{r.description}</p>

                {r.evidence && (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Observed Evidence</p>
                    <p className="mt-1 text-xs text-slate-700">{r.evidence}</p>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Recommended Action</p>
                  <p className="mt-1 text-xs font-medium text-emerald-950">{r.action}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Status:</span>
                  <StatusBadge label={r.status || 'Open'} />
                </div>
                <button
                  onClick={() => {
                    setSelectedRisk(r)
                    setNewStatus(r.status === 'Open' ? 'In Review' : 'Resolved')
                    setReviewNotes(r.reviewerNotes || '')
                  }}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Manage Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040B1B]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-[#0b2042]">Update Risk Alert Status</h3>
            <p className="mt-1 text-xs text-slate-500">
              {selectedRisk.title} &bull; Case {selectedRisk.caseId}
            </p>

            <form onSubmit={handleStatusUpdate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Workflow Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                >
                  <option value="Open">Open</option>
                  <option value="In Review">In Review</option>
                  <option value="Resolved">Resolved (Acceptable Mitigation)</option>
                  <option value="Dismissed">Dismissed (False Positive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Reviewer Notes</label>
                <textarea
                  rows="3"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record justification, mitigation documents received, or waiver reference..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedRisk(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button disabled={updating} type="submit" className="btn-primary text-xs">
                  {updating ? 'Saving Status...' : 'Save Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
