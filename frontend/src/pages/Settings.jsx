import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Bell, Shield, Sliders, CheckCircle2, AlertCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getSettings, updateSettings } from '../api/api'

export default function Settings() {
  const [settings, setSettings] = useState({
    email_notifications: true,
    critical_risk_alerts: true,
    dark_mode: false,
    auto_analyze_on_upload: false,
    items_per_page: 10,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getSettings()
      .then((data) => {
        setSettings({
          email_notifications: data.email_notifications,
          critical_risk_alerts: data.critical_risk_alerts,
          dark_mode: data.dark_mode,
          auto_analyze_on_upload: data.auto_analyze_on_upload,
          items_per_page: data.items_per_page,
        })
      })
      .catch((err) => setError(err.message))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    setError('')
    try {
      await updateSettings(settings)
      setSuccess('Settings and notification preferences updated.')
    } catch (err) {
      setError(err.message || 'Failed to update preferences.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Preferences / Workspace"
        title="Settings & Governance"
        subtitle="Configure alert thresholds, automated compliance behaviors, and session security."
      />

      <div className="max-w-4xl space-y-6">
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> {success}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            <AlertCircle size={16} className="text-red-600 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Notifications Panel */}
          <div className="panel p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#0b2042]">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-[#0b2042]">Notification Preferences</h3>
                <p className="text-xs text-slate-400">Control when and how assurance alerts are delivered</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="flex items-center justify-between cursor-pointer rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-[#0b2042]">Email Notifications</p>
                  <p className="text-xs text-slate-500">Receive email summaries on analysis completion and report generation</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                  className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-400"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-[#0b2042]">Critical Risk Alerts</p>
                  <p className="text-xs text-slate-500">Priority push notification when high-risk statutory or OEM failures occur</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.critical_risk_alerts}
                  onChange={(e) => setSettings({ ...settings, critical_risk_alerts: e.target.checked })}
                  className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-400"
                />
              </label>
            </div>
          </div>

          {/* Analysis Automation Panel */}
          <div className="panel p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#0b2042]">
                <Sliders size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-[#0b2042]">Automation & Display</h3>
                <p className="text-xs text-slate-400">Configure engine workflows and workspace presentation</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="flex items-center justify-between cursor-pointer rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-[#0b2042]">Auto-Analyze on Document Upload</p>
                  <p className="text-xs text-slate-500">Immediately run clause verification when documents are uploaded</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_analyze_on_upload}
                  onChange={(e) => setSettings({ ...settings, auto_analyze_on_upload: e.target.checked })}
                  className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-400"
                />
              </label>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-[#0b2042]">Items Per Page</p>
                  <p className="text-xs text-slate-500">Number of rows in audit and compliance tables</p>
                </div>
                <select
                  value={settings.items_per_page}
                  onChange={(e) => setSettings({ ...settings, items_per_page: Number(e.target.value) })}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-400"
                >
                  <option value={5}>5 items</option>
                  <option value={10}>10 items</option>
                  <option value={25}>25 items</option>
                  <option value={50}>50 items</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security & Access Box */}
          <div className="panel p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#0b2042]">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-[#0b2042]">Session Security</h3>
                <p className="text-xs text-slate-400">Authentication protocol and cryptographic posture</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-slate-400 font-medium">Session Token Expiry</p>
                <p className="mt-1 font-semibold text-[#0b2042]">24 Hours (Rolling Refresh)</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-slate-400 font-medium">Credential Protection</p>
                <p className="mt-1 font-semibold text-[#0b2042]">Bcrypt Salted Hash</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button disabled={loading} className="btn-primary">
              {loading ? 'Saving Preferences...' : 'Save All Settings'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
