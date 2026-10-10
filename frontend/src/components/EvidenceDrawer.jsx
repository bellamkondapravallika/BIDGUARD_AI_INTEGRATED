import { X, ExternalLink, FileText, ShieldCheck } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function EvidenceDrawer({ item, onClose }) {
  if (!item) return null

  return (
    <>
      <div
        aria-label="Close evidence drawer"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#040B1B]/40 backdrop-blur-sm transition-opacity"
      />
      <section className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <FileText size={22} />
              </div>
              <div>
                <p className="eyebrow">Document Evidence Record</p>
                <h2 className="mt-1 font-display text-base font-bold text-[#0b2042] line-clamp-1">{item.name}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ['Evidence Category', item.type || 'Statutory'],
              ['Citation Page', `Page ${item.page || 1}`],
              ['AI Confidence', `${item.confidence || 95}%`],
              ['Verification Status', item.status || 'Verified'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-1 text-xs font-semibold text-[#0b2042]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <p className="eyebrow">Related Tender Clause</p>
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs font-semibold text-[#0b2042]">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>{item.clause}</span>
            </div>
          </div>

          <div className="mt-6">
            <p className="eyebrow">Extracted Verbatim Proof</p>
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700">
              {item.text || 'No text extracted for this record.'}
            </div>
          </div>

          {item.recommendation && (
            <div className="mt-6">
              <p className="eyebrow">Recommended Assurance Action</p>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">{item.recommendation}</p>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="btn-primary w-full py-2.5 text-xs"
          >
            Close Evidence Drawer
          </button>
        </div>
      </section>
    </>
  )
}
