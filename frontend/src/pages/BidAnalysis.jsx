import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  BrainCircuit,
  Play,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Table2,
  FileBarChart2,
  Briefcase,
} from 'lucide-react'
import { getBidCases, getBidAnalysis, analyzeBid, seedDemoShowcase } from '../api/api'
import PageHeader from '../components/PageHeader'
import ComplianceRing from '../components/ComplianceRing'
import StatusBadge from '../components/StatusBadge'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

export default function BidAnalysis() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('case') || '')
  const [analysisData, setAnalysisData] = useState(null)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBidCases().then((data) => {
      setCases(data || [])
      if (!selectedCaseId && data && data.length > 0) {
        setSelectedCaseId(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedCaseId) {
      loadAnalysis(selectedCaseId)
    } else {
      setLoading(false)
    }
  }, [selectedCaseId])

  function loadAnalysis(caseId) {
    setLoading(true)
    getBidAnalysis(caseId)
      .then((data) => {
        if (data.hasAnalysis) {
          setAnalysisData(data)
        } else {
          setAnalysisData(null)
        }
      })
      .catch(() => setAnalysisData(null))
      .finally(() => setLoading(false))
  }

  async function handleRunAnalysis() {
    if (!selectedCaseId) return
    setRunning(true)
    try {
      await analyzeBid(selectedCaseId)
      loadAnalysis(selectedCaseId)
    } catch (err) {
      alert(err.message || 'Analysis failed.')
    } finally {
      setRunning(false)
    }
  }

  async function handleSeedDemo() {
    setRunning(true)
    try {
      const res = await seedDemoShowcase()
      setSelectedCaseId(res.case_id)
      loadAnalysis(res.case_id)
    } catch (err) {
      alert(err.message || 'Demo seeding failed.')
    } finally {
      setRunning(false)
    }
  }

  const analysis = analysisData?.analysis
  const findings = analysisData?.findings || []
  const score = analysis?.score || 0
  const risk = analysis?.risk_level || 'Pending'

  return (
    <>
      <PageHeader
        eyebrow={`Case ${selectedCaseId || 'Scope'} / Verification Engine`}
        title="Bid Analysis & Clause Verification"
        subtitle="Automated tender clause mapping against uploaded vendor evidence with transparent risk scoring."
        action={
          selectedCaseId && (
            <div className="flex items-center gap-2">
              <Link to={`/compliance?case=${selectedCaseId}`} className="btn-secondary text-xs">
                <Table2 size={14} /> View Matrix
              </Link>
              <button onClick={handleRunAnalysis} disabled={running} className="btn-primary text-xs">
                <Play size={14} />
                {running ? 'Running Engine...' : analysis ? 'Re-run AI Analysis' : 'Run AI Analysis'}
              </button>
            </div>
          )
        }
      />

      {/* Case Selector */}
      <div className="panel p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Selected Case:</span>
          </div>
          {cases.length > 0 ? (
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#0b2042] outline-none focus:border-emerald-400"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.title}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">No cases found in workspace.</span>
              <button onClick={handleSeedDemo} className="text-xs font-bold text-emerald-700 hover:underline">
                Load Sample GeM Demo Case
              </button>
            </div>
          )}
        </div>
      </div>

      {running ? (
        <div className="panel p-12">
          <LoadingState label="AI compliance engine is extracting text, checking statutory registries, and scoring clauses..." />
        </div>
      ) : loading ? (
        <LoadingState label="Loading analysis results from database..." />
      ) : !analysis ? (
        <EmptyState
          icon={BrainCircuit}
          title="Analysis Not Run Yet"
          description="This bid case has not been analyzed yet. Upload supporting documents and run the compliance engine."
          action={
            <div className="flex items-center justify-center gap-3">
              <Link to={`/upload?case=${selectedCaseId}`} className="btn-secondary text-xs">
                Upload Documents
              </Link>
              <button onClick={handleRunAnalysis} className="btn-primary text-xs">
                <Play size={14} /> Run Analysis Now
              </button>
            </div>
          }
        />
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="panel flex flex-col items-center gap-6 p-7 sm:flex-row">
              <ComplianceRing score={Math.round(score)} />
              <div>
                <p className="eyebrow">Overall Compliance Score</p>
                <div className="mt-2 flex items-center gap-3">
                  <h2 className="font-display text-2xl font-bold text-[#0b2042]">{risk} Risk Posture</h2>
                  <StatusBadge label={risk} />
                </div>
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-800">
                  <Sparkles size={14} className="text-emerald-600 shrink-0" />
                  Engine v{analysis.version} calibrated across {analysis.clauses_analyzed} tender requirements
                </p>
              </div>
            </div>

            <div className="panel grid grid-cols-2 gap-4 p-6">
              {[
                ['Clauses Analyzed', analysis.clauses_analyzed],
                ['Evidence Identified', analysis.evidence_found],
                ['Exceptions & Reviews', analysis.exceptions_count],
                ['Analysis Version', `v${analysis.version}.0`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">{l}</p>
                  <p className="mt-2 font-display text-xl font-bold text-[#0b2042]">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Executive Summary Banner */}
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
            <div className="flex items-start gap-3">
              <BrainCircuit className="mt-0.5 text-emerald-600 shrink-0" size={22} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Decision-Support Executive Summary
                  </p>
                  <span className="rounded bg-emerald-200/60 px-1.5 py-0.5 text-[9px] font-bold text-emerald-900">
                    Traceable Proof
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-emerald-950 font-normal">
                  {analysis.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Findings Table */}
          <div className="panel mt-6 overflow-hidden">
            <div className="border-b border-slate-100 p-5 flex items-center justify-between">
              <div>
                <p className="eyebrow">Clause Verification Matrix</p>
                <h2 className="mt-1 font-display text-lg font-bold text-[#0b2042]">Requirement Findings</h2>
              </div>
              <Link to={`/reports?case=${selectedCaseId}`} className="btn-secondary text-xs">
                <FileBarChart2 size={14} /> Download Report
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    {['Clause ID', 'Requirement', 'Status', 'Confidence', 'Extracted Evidence', 'Recommended Action'].map(
                      (x) => (
                        <th key={x} className="px-5 py-3.5 font-semibold">
                          {x}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {findings.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-xs text-[#0b2042]">
                        {f.requirement_code}
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-semibold text-xs text-[#0b2042]">{f.requirement_title}</p>
                        <p className="text-[11px] text-slate-400">{f.category}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge label={f.status} />
                      </td>
                      <td className="px-5 py-4 font-bold text-xs text-[#0b2042]">
                        {f.confidence}%
                      </td>
                      <td className="px-5 py-4 max-w-sm text-xs text-slate-600 leading-relaxed">
                        <p className="line-clamp-2">{f.evidence_text || f.reason}</p>
                        {f.document_name && (
                          <span className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <FileText size={10} /> {f.document_name}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 max-w-xs">
                        {f.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
