import { Loader2 } from 'lucide-react'
export default function LoadingState({ label = 'Loading secure workspace...' }) { return <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-slate-500"><Loader2 className="h-7 w-7 animate-spin text-emerald-500" /><p className="text-sm">{label}</p></div> }
