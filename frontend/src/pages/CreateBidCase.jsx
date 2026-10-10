import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBidCase } from '../api/api'
import PageHeader from '../components/PageHeader'
import { AlertCircle } from 'lucide-react'

export default function CreateBidCase() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    department: '',
    reference: '',
    category: 'Enterprise IT',
    procuring_organization: 'Ministry of Electronics & Information Technology',
    estimated_value: 12500000,
    currency: 'INR',
    submission_deadline: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title,
        reference_number: form.reference,
        procuring_organization: form.procuring_organization,
        department: form.department,
        description: form.description,
        category: form.category,
        estimated_value: Number(form.estimated_value) || 0,
        currency: form.currency || 'INR',
        submission_deadline: form.submission_deadline ? new Date(form.submission_deadline).toISOString() : null,
      }
      const created = await createBidCase(payload)
      navigate(`/upload?case=${created.id}`)
    } catch (err) {
      setError(err.message || 'Failed to create bid case.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Case Management / New"
        title="Create a Bid Case"
        subtitle="Establish the compliance scope, statutory criteria, and baseline procurement parameters."
      />

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 max-w-4xl">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={submit} className="panel max-w-4xl p-6 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Bid / Tender Title *
            </label>
            <input
              required
              name="title"
              value={form.title}
              onChange={change}
              placeholder="e.g. Enterprise Network Security Appliances"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              GeM Bid Reference Number *
            </label>
            <input
              required
              name="reference"
              value={form.reference}
              onChange={change}
              placeholder="e.g. GEM/2026/B/8912345"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Procuring Ministry / Entity *
            </label>
            <input
              required
              name="procuring_organization"
              value={form.procuring_organization}
              onChange={change}
              placeholder="e.g. Ministry of Electronics & IT"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Department / Sub-Directorate *
            </label>
            <input
              required
              name="department"
              value={form.department}
              onChange={change}
              placeholder="e.g. Directorate of Network Operations"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Procurement Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={change}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
            >
              <option value="Enterprise IT">Enterprise IT</option>
              <option value="Audio Visual Systems">Audio Visual Systems</option>
              <option value="Renewable Energy">Renewable Energy</option>
              <option value="Signaling & Power">Signaling & Power</option>
              <option value="Office Automation">Office Automation</option>
              <option value="Consulting Services">Consulting Services</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Estimated Tender Value (INR)
            </label>
            <input
              type="number"
              name="estimated_value"
              value={form.estimated_value}
              onChange={change}
              placeholder="10000000"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Submission Deadline
            </label>
            <input
              type="datetime-local"
              name="submission_deadline"
              value={form.submission_deadline}
              onChange={change}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Tender Description & Compliance Objective *
          </label>
          <textarea
            required
            name="description"
            value={form.description}
            onChange={change}
            rows="4"
            placeholder="Specify technical scope, mandatory qualifications, and statutory assurance requirements..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
          />
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button disabled={saving} className="btn-primary">
            {saving ? 'Creating Case in Database...' : 'Create Case & Continue to Upload'}
          </button>
        </div>
      </form>
    </>
  )
}
