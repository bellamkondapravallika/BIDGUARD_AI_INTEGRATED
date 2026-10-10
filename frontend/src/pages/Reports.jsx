import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Download,
  FileBarChart2,
  Plus,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { getBidCases, getReports, generateReport } from '../api/api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

export default function Reports() {
  const [searchParams] = useSearchParams()

  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('case') || '')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  // Report Generation Form
  const [reportType, setReportType] = useState('full_compliance')
  const [fileFormat, setFileFormat] = useState('pdf')
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getBidCases().then((data) => {
      setCases(data || [])
      if (!selectedCaseId && data && data.length > 0) {
        setSelectedCaseId(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    loadReports(selectedCaseId)
  }, [selectedCaseId])

  function loadReports(caseId) {
    setLoading(true)
    getReports(caseId)
      .then((data) => setReports(data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!selectedCaseId) return
    setGenerating(true)
    setError('')
    setSuccess('')

    try {
      const rep = await generateReport(selectedCaseId, {
        report_type: reportType,
        file_format: fileFormat,
      })
      setSuccess(`Report "${rep.name}" generated successfully.`)
      setShowModal(false)
      loadReports(selectedCaseId)
    } catch (err) {
      setError(err.message || 'Failed to generate report.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Outputs / Assurance Governance"
        title="Reports & Audit Exports"
        subtitle="Generate and download audit-ready compliance dossiers, clause matrices, and risk registers in PDF and CSV."
        action={
          <button
            onClick={() => setShowModal(true)}
            disabled={!selectedCaseId}
            className="btn-primary"
          >
            <Plus size={16} /> Generate New Report
          </button>
        }
      />

      {/* Case Selector */}
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
          <span className="text-xs text-slate-400">Total generated: {reports.length} files</span>
        </div>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> {success}
        </div>
      )}

      {/* Reports Table */}
      {loading ? (
        <LoadingState label="Loading generated report records from database..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileBarChart2}
          title="No Reports Generated Yet"
          description="Click 'Generate New Report' to compile an assurance dossier from the latest analysis run."
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary text-xs">
              <Plus size={14} /> Generate Report
            </button>
          }
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  {['Report Document', 'Case ID', 'Date', 'Format', 'Score', 'Status', 'Download'].map((x) => (
                    <th key={x} className="px-5 py-3.5 font-semibold">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="flex items-center gap-3 px-5 py-4 font-semibold text-[#0b2042]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <FileBarChart2 size={18} />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#0b2042]">{r.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formatBytes(r.size)} &bull; Ready for audit
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{r.caseId}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{r.date}</td>
                    <td className="px-5 py-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-700">
                        {r.format}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-xs text-[#0b2042]">{r.score}</td>
                    <td className="px-5 py-4">
                      <StatusBadge label={r.status} />
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={`/api/v1/reports/${r.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition"
                      >
                        <Download size={13} /> Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040B1B]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-[#0b2042]">Generate Assurance Report</h3>
            <p className="mt-1 text-xs text-slate-500">
              Select the report type and desired output format for case {selectedCaseId}.
            </p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                >
                  <option value="full_compliance">Full Bid Compliance & Assurance Report</option>
                  <option value="compliance_matrix">Detailed Clause Verification Matrix</option>
                  <option value="risk_register">Risk Register & Exception Digest</option>
                  <option value="audit_trail">Assurance Audit Trail Log</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Export Format</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {[
                    ['pdf', 'Presentation-ready PDF (ReportLab)'],
                    ['csv', 'Raw Data CSV (Excel Compatible)'],
                  ].map(([fmt, label]) => (
                    <label
                      key={fmt}
                      className={`flex cursor-pointer flex-col rounded-xl border p-3 text-xs transition ${
                        fileFormat === fmt
                          ? 'border-emerald-500 bg-emerald-50/50 text-[#0b2042] font-semibold ring-1 ring-emerald-500'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="uppercase font-bold">{fmt}</span>
                        <input
                          type="radio"
                          name="format"
                          checked={fileFormat === fmt}
                          onChange={() => setFileFormat(fmt)}
                          className="text-emerald-600"
                        />
                      </div>
                      <span className="mt-1 text-[11px] text-slate-400 font-normal">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button disabled={generating} type="submit" className="btn-primary text-xs">
                  {generating ? 'Compiling File...' : 'Generate & Save Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function formatBytes(bytes) {
  if (!bytes) return '14 KB'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
