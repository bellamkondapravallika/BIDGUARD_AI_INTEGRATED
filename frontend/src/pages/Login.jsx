import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ShieldCheck, LockKeyhole, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await loginUser(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#24D39A] text-[#040B1B] shadow-md shadow-emerald-500/20">
            <ShieldCheck size={26} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-wide">BIDGUARD AI</div>
            <div className="text-[10px] uppercase tracking-[.22em] text-emerald-300">
              Procurement Compliance & Assurance
            </div>
          </div>
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
            GeM Tender Verification Intelligence
          </span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-tight text-white">
            Confidence in every public procurement decision.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            Automated clause matching, statutory evidence extraction, and risk analytics for audit-ready GeM tenders.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              ['AI Compliance', 'Clause verification'],
              ['Evidence Mapping', 'Direct document citations'],
              ['Audit Trail', 'Cryptographic governance'],
            ].map(([title, desc]) => (
              <div key={title} className="border-l-2 border-emerald-400/50 pl-3">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <p className="mt-2 text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-4">
          <p>Protected government procurement workspace</p>
          <span className="font-mono text-emerald-400">Release v2.0.0</span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex items-center justify-center bg-[#f6f9fc] px-5 py-12 text-[#0b2042] sm:px-12">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24D39A] text-[#040B1B]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="font-display text-lg font-bold">BIDGUARD AI</p>
              <p className="text-[10px] uppercase tracking-wider text-emerald-700">Procurement Assurance</p>
            </div>
          </div>

          <p className="eyebrow">Enterprise Access</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#0b2042]">Sign in to workspace</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your official credentials to access GeM assurance workflows.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Authentication failed</p>
                <p className="mt-0.5 text-xs">{error}</p>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Official Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0b2042] outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                placeholder="officer@department.gov.in"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0b2042] outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                placeholder="Enter account password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-7 w-full py-3.5 text-sm shadow-md"
          >
            {loading ? (
              <>
                <LockKeyhole size={16} className="animate-spin" /> Verifying Credentials...
              </>
            ) : (
              <>
                Sign in to workspace <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Need an account?{' '}
            <Link to="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Create an account
            </Link>
          </p>

          <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-100/60 p-3 text-center text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Notice:</span> Valid credentials verified against the active PostgreSQL security database.
          </div>
        </form>
      </div>
    </div>
  )
}
