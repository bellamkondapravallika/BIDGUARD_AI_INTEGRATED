import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LockKeyhole, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { resetPassword } from '../api/api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [token, setToken] = useState(searchParams.get('token') || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, newPassword, confirmPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
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
          <LockKeyhole size={24} />
        </div>

        <h2 className="mt-4 font-display text-2xl font-bold text-[#0b2042]">Set new password</h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter the security reset token and your new chosen password.
        </p>

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-sm text-emerald-900">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2" />
            <p className="font-bold">Password Reset Successfully!</p>
            <p className="mt-1 text-xs text-slate-600">Redirecting to sign-in screen...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Security Reset Token
              </label>
              <input
                required
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-xs outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                placeholder="Paste your reset token"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                New Password
              </label>
              <input
                required
                minLength={8}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Confirm New Password
              </label>
              <input
                required
                minLength={8}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-300 transition focus:border-emerald-500 focus:ring-2"
                placeholder="Re-enter new password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-6 w-full py-3">
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
