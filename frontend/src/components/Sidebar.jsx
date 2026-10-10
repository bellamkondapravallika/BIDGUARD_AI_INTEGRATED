import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus2,
  Briefcase,
  UploadCloud,
  ScanSearch,
  Table2,
  TriangleAlert,
  FolderSearch,
  FileBarChart2,
  History,
  Settings,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/cases/new', 'Create Bid Case', FilePlus2],
  ['/cases', 'Bid Cases', Briefcase],
  ['/upload', 'Upload Documents', UploadCloud],
  ['/analysis', 'Bid Analysis', ScanSearch],
  ['/compliance', 'Compliance Matrix', Table2],
  ['/risks', 'Risk Alerts', TriangleAlert],
  ['/evidence', 'Evidence Drawer', FolderSearch],
  ['/reports', 'Reports', FileBarChart2],
  ['/audit', 'Audit Trail', History],
  ['/settings', 'Settings', Settings],
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'PO'

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[275px] flex-col bg-[#040B1B] px-4 py-5 text-white transition-transform lg:static lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3">
        <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24D39A] text-[#040B1B] shadow-sm shadow-emerald-400/20">
            <ShieldCheck size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-lg font-bold tracking-wide">BIDGUARD</span>
              <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">AI</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Procurement Assurance</p>
          </div>
        </NavLink>
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <div className="my-5 border-t border-white/10" />

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-500/15 font-semibold text-[#24D39A] shadow-inner ring-1 ring-emerald-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer Profile Card */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3.5">
        <NavLink to="/profile" onClick={onClose} className="group flex items-center gap-3 transition">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-300 font-display font-bold text-[#040B1B]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white group-hover:text-emerald-300">
              {user?.full_name || 'Procurement Officer'}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.organization || 'Government of India'}</p>
          </div>
        </NavLink>
        <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <Sparkles size={11} /> Secured Session
          </span>
          <span className="uppercase tracking-wider">v2.0.0</span>
        </div>
      </div>
    </aside>
  )
}
