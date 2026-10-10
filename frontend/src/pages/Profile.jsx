import { useEffect, useState } from 'react'
import { User, ShieldCheck, KeyRound, Building, Phone, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile, changePassword } from '../api/api'
import PageHeader from '../components/PageHeader'

export default function Profile() {
  const { refreshUser } = useAuth()

  const [profile, setProfile] = useState({
    full_name: '',
    organization: '',
    department: '',
    job_title: '',
    phone_number: '',
    email: '',
    role: '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [pwdError, setPwdError] = useState('')

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile({
          full_name: data.full_name || '',
          organization: data.organization || '',
          department: data.department || '',
          job_title: data.job_title || '',
          phone_number: data.phone_number || '',
          email: data.email || '',
          role: data.role || 'Procurement Officer',
        })
      })
      .catch((err) => setProfileError(err.message))
  }, [])

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileLoading(true)
    setProfileSuccess('')
    setProfileError('')

    try {
      await updateProfile({
        full_name: profile.full_name,
        organization: profile.organization,
        department: profile.department,
        job_title: profile.job_title,
        phone_number: profile.phone_number,
      })
      await refreshUser()
      setProfileSuccess('Profile details successfully updated and persisted to database.')
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPwdLoading(true)
    setPwdSuccess('')
    setPwdError('')

    if (pwdForm.new_password.length < 8) {
      setPwdError('New password must be at least 8 characters.')
      setPwdLoading(false)
      return
    }

    if (pwdForm.new_password !== pwdForm.confirm_password) {
      setPwdError('New passwords do not match.')
      setPwdLoading(false)
      return
    }

    try {
      await changePassword(pwdForm.current_password, pwdForm.new_password, pwdForm.confirm_password)
      setPwdSuccess('Password changed successfully.')
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setPwdError(err.message || 'Failed to change password.')
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account / Identity"
        title="User Profile"
        subtitle="Manage your procurement credentials, official entity details, and security passwords."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Profile Information Form */}
        <div className="panel p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[#0b2042]">
              <User size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#0b2042]">Personal & Department Information</h2>
              <p className="text-xs text-slate-400">Authenticated user information</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Full Name</label>
              <input
                required
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Official Email</label>
                <input
                  disabled
                  value={profile.email}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Role / Designation</label>
                <input
                  disabled
                  value={profile.role}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Organization / Ministry</label>
                <input
                  required
                  value={profile.organization}
                  onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Department / Cell</label>
                <input
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Job Title</label>
                <input
                  value={profile.job_title}
                  placeholder="e.g. Senior Procurement Officer"
                  onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Phone Number</label>
                <input
                  value={profile.phone_number}
                  placeholder="+91 98765 43210"
                  onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button disabled={profileLoading} className="btn-primary">
                {profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Panel */}
        <div className="panel p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[#0b2042]">
              <KeyRound size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#0b2042]">Change Password</h2>
              <p className="text-xs text-slate-400">Update workspace security credentials</p>
            </div>
          </div>

          {pwdSuccess && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              {pwdSuccess}
            </div>
          )}

          {pwdError && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              {pwdError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Current Password</label>
              <input
                required
                type="password"
                value={pwdForm.current_password}
                onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">New Password</label>
              <input
                required
                minLength={8}
                type="password"
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Confirm New Password</label>
              <input
                required
                minLength={8}
                type="password"
                value={pwdForm.confirm_password}
                onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                placeholder="Re-enter new password"
              />
            </div>

            <button disabled={pwdLoading} className="btn-primary mt-4 w-full">
              {pwdLoading ? 'Verifying & Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
