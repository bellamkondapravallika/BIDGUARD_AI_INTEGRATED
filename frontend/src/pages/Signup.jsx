import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ShieldCheck, UserPlus, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const navigate = useNavigate()
  const { signupUser } = useAuth()

  const [form, setForm] = useState({
    name: '',
    organization: '',
    department: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await signupUser(form.name, form.organization, form.email, form.password, form.confirmPassword)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#040B1B] text-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left Brand Panel */}
      <div className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(#24D39A 1px, transparent 1px), linear-gradient(90deg, #24D39A 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#24D39A] text-[#040B1B]">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-wide">BIDGUARD AI</div>
            <div className="text-[10px] uppercase tracking-[.22em] text-emerald-300">
              Procurement Assurance Platform
            </div>
          </div>
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
            Account Registration
          </span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-tight">
            Build an audit-ready procurement governance workflow.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            Create your authorized procurement workspace for deterministic clause evaluation, evidence tracing, and real-time risk alerts.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              ['Zero Trust', 'Encrypted tokens'],
              ['Multi-tenant', 'Data isolation'],
              ['Immutable', 'Audit logs'],
            ].map(([title, desc]) => (
              <div key={title} className="border-l-2 border-emerald-400/50 pl-3">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <p className="mt-2 text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-400 border-t border-white/10 pt-4">
          Government-grade access controls &bull; PostgreSQL 18
        </p>
      </div>

      {/* Right Form Container */}
      <div className="flex items-center justify-center bg-[#f6f9fc] px-5 py-12 text-[#0b2042] sm:px-12">
        <form onSubmit={submit} className="w-full max-w-lg">
          <p className="eyebrow">Procurement Onboarding</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#0b2042]">Create your account</h2>
          <p className="mt-2 text-sm text-slate-500">
            Register your official department account to start analyzing bid cases.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Registration error</p>
                <p className="mt-0.5 text-xs">{error}</p>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Full Name
              </label>
              <input
                required
                name="name"
                value={form.name}
                onChange={updateField}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                placeholder="e.g. Aarav Mehta"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Organization / Ministry
                </label>
                <input
                  required
                  name="organization"
                  value={form.organization}
                  onChange={updateField}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                  placeholder="e.g. Ministry of Electronics"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Department / Cell
                </label>
                <input
                  name="department"
                  value={form.department}
                  onChange={updateField}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                  placeholder="e.g. Procurement Cell"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Official Email
              </label>
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                placeholder="officer@department.gov.in"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <input
                  required
                  minLength={8}
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Confirm Password
                </label>
                <input
                  required
                  minLength={8}
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={updateField}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-7 w-full py-3.5 text-sm shadow-md"
          >
            {loading ? (
              <>Creating Secure Account...</>
            ) : (
              <>
                Create account & open workspace <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
