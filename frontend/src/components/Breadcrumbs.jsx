import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const routeLabels = {
  dashboard: 'Dashboard',
  cases: 'Bid Cases',
  new: 'Create Case',
  upload: 'Upload Documents',
  analysis: 'Bid Analysis',
  compliance: 'Compliance Matrix',
  risks: 'Risk Alerts',
  evidence: 'Evidence Drawer',
  reports: 'Reports',
  audit: 'Audit Trail',
  profile: 'User Profile',
  settings: 'Account Settings',
}

export default function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center text-xs font-medium text-slate-400">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-[#0b2042] transition">
        <Home size={13} />
        <span>Workspace</span>
      </Link>
      {segments.map((seg, idx) => {
        const url = `/${segments.slice(0, idx + 1).join('/')}`
        const isLast = idx === segments.length - 1
        const label = routeLabels[seg] || seg

        return (
          <div key={url} className="flex items-center gap-1">
            <ChevronRight size={12} className="mx-1 text-slate-300" />
            {isLast ? (
              <span className="font-semibold text-emerald-800">{label}</span>
            ) : (
              <Link to={url} className="hover:text-[#0b2042] transition">
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
