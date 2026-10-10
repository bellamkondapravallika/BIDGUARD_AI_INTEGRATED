import { FolderOpen } from 'lucide-react'

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no items matching your criteria in this workspace.',
  action,
}) {
  return (
    <div className="panel flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 shadow-inner">
        <Icon size={26} />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-[#0b2042]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
