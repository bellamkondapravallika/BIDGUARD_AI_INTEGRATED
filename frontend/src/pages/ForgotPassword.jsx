import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react'
import { forgotPassword } from '../api/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    setResetToken('')

    try {
      const data = await forgotPassword(email)
      setMessage(data.message || 'Password reset instructions have been issued.')
      if (data.reset_token) {
        setResetToken(data.reset_token)
      }
    } catch (err) {
      setError(err.message || 'Failed to submit reset request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f9fc] px-4 py-12 text-[#0b2042]">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0b2042] transition mb-6"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <KeyRound size={24} />
        </div>

        <h2 className="mt-4 font-display text-2xl font-bold text-[#0b2042]">Reset password</h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter your registered department email address. We will verify your account and provide a single-use secure reset token.
        </p>

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600" /> Request verified
            </div>
            <p className="mt-1 text-xs">{message}</p>
            {resetToken && (
              <div className="mt-3 rounded-xl border border-emerald-300 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Reset Token (Local/Testing)</p>
                <code className="mt-1 block break-all font-mono text-xs font-bold text-emerald-700">{resetToken}</code>
                <Link
                  to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                >
                  Proceed to set new password <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {!resetToken && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Official Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                placeholder="officer@department.gov.in"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Processing Request...' : 'Issue Reset Instructions'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
