import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  Download,
  FolderSearch,
  Briefcase,
  FileBarChart2,
  Table2,
} from 'lucide-react'
import { getBidCases, getComplianceMatrix, generateReport } from '../api/api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import EvidenceDrawer from '../components/EvidenceDrawer'

export default function ComplianceMatrix() {
  const [searchParams] = useSearchParams()

  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('case') || '')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [mandatoryOnly, setMandatoryOnly] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getBidCases().then((data) => {
      setCases(data || [])
      if (!selectedCaseId && data && data.length > 0) {
        setSelectedCaseId(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    loadMatrix(selectedCaseId)
  }, [selectedCaseId])

  function loadMatrix(caseId) {
    setLoading(true)
    getComplianceMatrix(caseId)
      .then((data) => setRows(data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }

  async function handleExport(format) {
    if (!selectedCaseId) return
    setExporting(true)
    try {
      const rep = await generateReport(selectedCaseId, {
        report_type: 'compliance_matrix',
        file_format: format,
      })
      window.open(`/api/v1/reports/${rep.id}/download`, '_blank')
    } catch (err) {
      alert(err.message || 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  // Filtering
  const filtered = rows.filter((r) => {
    const matchesQuery = `${r.requirement} ${r.id} ${r.evidence} ${r.action}`
      .toLowerCase()
      .includes(query.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || r.result === statusFilter
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter
    const matchesMandatory = !mandatoryOnly || r.mandatory === true

    return matchesQuery && matchesStatus && matchesCategory && matchesMandatory
  })

  // Summary statistics
  const total = rows.length
  const passCount = rows.filter((r) => r.result === 'PASS').length
  const reviewCount = rows.filter((r) => r.result === 'REVIEW').length
  const failCount = rows.filter((r) => r.result === 'FAIL').length
  const compliancePct = total > 0 ? Math.round((passCount / total) * 100) : 0

  return (
    <>
      <PageHeader
        eyebrow={`Case ${selectedCaseId || 'Matrix'} / Verification Grid`}
        title="Compliance Matrix"
        subtitle="Itemized clause-by-clause verification table with audit citations, confidence scores, and drill-down evidence."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting || rows.length === 0}
              className="btn-secondary text-xs"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting || rows.length === 0}
              className="btn-primary text-xs"
            >
              <Download size={14} /> Export PDF
            </button>
          </div>
        }
      />

      {/* Case Selector and KPI Bar */}
      <div className="panel p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Case:</span>
            {cases.length > 0 && (
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0b2042] outline-none focus:border-emerald-400"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 font-medium">Compliance: <strong className="text-emerald-700">{compliancePct}%</strong></span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-semibold">{passCount} Pass</span>
            <span className="text-amber-700 font-semibold">{reviewCount} Review</span>
            <span className="text-red-700 font-semibold">{failCount} Fail</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="panel p-4 mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-400 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clauses, requirements, or evidence..."
              className="w-full bg-transparent text-sm text-[#0b2042] outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="ALL">All Results</option>
              <option value="PASS">Compliant (PASS)</option>
              <option value="REVIEW">Review (REVIEW)</option>
              <option value="FAIL">Non-Compliant (FAIL)</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="ALL">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Financial">Financial</option>
              <option value="Legal & Statutory">Legal & Statutory</option>
              <option value="OEM / Authorization">OEM / Authorization</option>
              <option value="Experience">Experience</option>
            </select>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={mandatoryOnly}
                onChange={(e) => setMandatoryOnly(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-400"
              />
              Mandatory Only
            </label>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      {loading ? (
        <LoadingState label="Loading compliance matrix clauses..." />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Table2}
          title="No Compliance Data"
          description="Run AI Analysis on this bid case to populate the compliance verification matrix."
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  {['Clause ID', 'Requirement', 'Status', 'Extracted Evidence', 'Confidence', 'Recommended Action', ''].map(
                    (x) => (
                      <th key={x} className="px-5 py-3.5 font-semibold">
                        {x}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-xs text-[#0b2042]">
                      {r.id}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-semibold text-xs text-[#0b2042]">{r.requirement}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400">{r.category}</span>
                        {r.mandatory && (
                          <span className="rounded bg-red-50 text-red-700 px-1 py-0.2 text-[9px] font-bold">
                            Mandatory
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={r.result} />
                    </td>
                    <td className="px-5 py-4 max-w-sm text-xs text-slate-600 leading-relaxed">
                      <p className="line-clamp-2">{r.evidence}</p>
                      {r.document && (
                        <p className="text-[10px] font-mono text-emerald-700 mt-1">
                          Source: {r.document} (p. {r.page})
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-bold text-xs text-[#0b2042]">
                      {r.confidence}%
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 max-w-xs">
                      {r.action}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() =>
                          setSelectedEvidence({
                            name: r.document || `${r.id}_proof.pdf`,
                            type: r.category,
                            page: r.page || 1,
                            status: r.result === 'PASS' ? 'Verified' : 'Needs review',
                            confidence: r.confidence,
                            text: r.evidence,
                            clause: r.requirement,
                          })
                        }
                        title="View evidence detail"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-700 transition"
                      >
                        <FolderSearch size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="p-8 text-center text-xs text-slate-400">No clauses match the current filters.</p>
          )}
        </div>
      )}

      {/* Evidence Drawer Modal */}
      <EvidenceDrawer item={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
    </>
  )
}
