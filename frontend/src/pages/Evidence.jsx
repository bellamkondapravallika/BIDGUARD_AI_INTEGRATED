import { useEffect, useState } from 'react'
import { FileText, ChevronRight, FolderSearch, Briefcase, ExternalLink } from 'lucide-react'
import { getEvidence, getBidCases } from '../api/api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import EvidenceDrawer from '../components/EvidenceDrawer'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

export default function Evidence() {
  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getBidCases().then((data) => {
      setCases(data || [])
      if (data && data.length > 0) {
        setSelectedCaseId(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    loadEvidence(selectedCaseId)
  }, [selectedCaseId])

  function loadEvidence(caseId) {
    setLoading(true)
    getEvidence(caseId)
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  return (
    <>
      <PageHeader
        eyebrow="Evidence / Source of Truth"
        title="Evidence Drawer & Document Citations"
        subtitle="Inspect extracted evidence, verbatim clauses, and trace every compliance finding back to its source file."
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
          <span className="text-xs text-slate-400">{items.length} citations indexed</span>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Indexing document citations and extracted paragraphs..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title="No Extracted Evidence"
          description="Upload documents and execute AI Analysis on this case to extract textual citations."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <button
              key={item.id || item.clause}
              onClick={() => setSelected(item)}
              className="panel text-left p-6 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-xl bg-slate-100 p-2.5 text-[#0b2042] shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display font-bold text-sm text-[#0b2042]">{item.name}</h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.type} &bull; Page {item.page}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 shrink-0" />
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Matched Requirement</p>
                  <p className="mt-1 text-xs font-semibold text-[#0b2042] line-clamp-1">{item.clause}</p>
                </div>

                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-600 font-normal">
                  "{item.text}"
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                <StatusBadge label={item.status} />
                <span className="text-xs font-bold text-slate-500">{item.confidence}% AI Confidence</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Reusable Evidence Drawer */}
      <EvidenceDrawer item={selected} onClose={() => setSelected(null)} />
    </>
  )
}
