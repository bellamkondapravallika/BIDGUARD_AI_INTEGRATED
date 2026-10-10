import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  CheckCheck,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/api'

export default function Topbar({ onMenu }) {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'PO'

  useEffect(() => {
    loadNotifications()
    const timer = setInterval(loadNotifications, 30000)
    return () => clearInterval(timer)
  }, [])

  // Close popups on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function loadNotifications() {
    getNotifications()
      .then((data) => setNotifications(data || []))
      .catch(() => {})
  }

  async function handleMarkRead(id, e) {
    e.stopPropagation()
    try {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch {}
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {}
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/cases?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-8">
      {/* Left: Mobile Menu & Global Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2 text-slate-400 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition">
          <Search size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search cases, tender numbers, and clauses"
            placeholder="Search cases, GeM bids, clauses..."
            className="w-56 bg-transparent text-sm text-[#0b2042] outline-none placeholder:text-slate-400"
          />
        </form>
      </div>

      {/* Right: Actions, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative rounded-xl border border-slate-200/80 p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-[#0b2042]"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-[#0b2042]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.link) navigate(n.link)
                        setShowNotifications(false)
                      }}
                      className={`cursor-pointer rounded-xl p-3 text-left transition ${
                        n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/50 hover:bg-emerald-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-xs text-[#0b2042]">{n.title}</p>
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkRead(n.id, e)}
                            title="Mark read"
                            className="text-slate-400 hover:text-emerald-600"
                          >
                            <span className="block h-2 w-2 rounded-full bg-emerald-500" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        {n.link && (
                          <span className="flex items-center gap-0.5 text-emerald-700 font-medium">
                            View <ExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden h-7 w-px bg-slate-200 sm:block" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b2042] text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#0b2042] leading-tight">
                {user?.full_name || 'Procurement Officer'}
              </p>
              <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                {user?.organization || 'Central Workspace'}
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-[#0b2042]">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <ShieldCheck size={11} /> {user?.role || 'Procurement Officer'}
                </span>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <User size={15} className="text-slate-400" /> User Profile
              </Link>

              <Link
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Settings size={15} className="text-slate-400" /> Account Settings
              </Link>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  logoutUser()
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
