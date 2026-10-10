const styles = {
  // Compliant / Green
  pass: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200',
  compliant: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200',
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200',
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200',
  ready: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200',
  processed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200',
  uploaded: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200',

  // Amber / Review
  review: 'bg-amber-50 text-amber-700 ring-amber-600/20 border-amber-200',
  'needs review': 'bg-amber-50 text-amber-700 ring-amber-600/20 border-amber-200',
  'in review': 'bg-amber-50 text-amber-700 ring-amber-600/20 border-amber-200',
  'action needed': 'bg-orange-50 text-orange-700 ring-orange-600/20 border-orange-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-600/20 border-amber-200',
  pending: 'bg-slate-100 text-slate-700 ring-slate-600/10 border-slate-200',
  analyzing: 'bg-sky-50 text-sky-700 ring-sky-600/20 border-sky-200',
  open: 'bg-sky-50 text-sky-700 ring-sky-600/20 border-sky-200',
  draft: 'bg-slate-100 text-slate-600 ring-slate-600/10 border-slate-200',

  // Red / Critical / Fail
  fail: 'bg-red-50 text-red-700 ring-red-600/20 border-red-200',
  'non-compliant': 'bg-red-50 text-red-700 ring-red-600/20 border-red-200',
  critical: 'bg-red-50 text-red-700 ring-red-600/20 border-red-200',
  high: 'bg-orange-50 text-orange-700 ring-orange-600/20 border-orange-200',
  failed: 'bg-red-50 text-red-700 ring-red-600/20 border-red-200',
  dismissed: 'bg-slate-100 text-slate-500 ring-slate-600/10 border-slate-200',
}

export default function StatusBadge({ label }) {
  const key = String(label || 'Pending').toLowerCase().trim()
  const cls = styles[key] || 'bg-slate-100 text-slate-700 ring-slate-600/10 border-slate-200'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}
