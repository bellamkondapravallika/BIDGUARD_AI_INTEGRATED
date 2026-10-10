import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Trash2,
  ExternalLink,
  UploadCloud,
  ScanSearch,
  FileBarChart2,
  Sparkles,
} from 'lucide-react'
import { getBidCases, deleteBidCase, seedDemoShowcase } from '../api/api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

export default function BidCases() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    loadCases()
  }, [statusFilter, categoryFilter])

  function loadCases() {
    setLoading(true)
    getBidCases({ search, status: statusFilter, category: categoryFilter })
      .then((data) => setCases(data || []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }

  function handleSearch(e) {
    e.preventDefault()
    loadCases()
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Are you sure you want to delete case ${id} ("${title}")? This action cannot be undone.`)) {
      return
    }
    try {
      await deleteBidCase(id)
      setCases((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete bid case.')
    }
  }

  async function handleSeedDemo() {
    setSeeding(true)
    try {
      await seedDemoShowcase()
      await loadCases()
    } catch (err) {
      alert(err.message || 'Failed to load demo case.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Portfolio / GeM Cases"
        title="Bid Cases"
        subtitle="Manage and audit tender compliance scopes, procurement records, and assurance evaluations."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="btn-secondary text-xs"
            >
              <Sparkles size={14} className="text-emerald-600" />
              {seeding ? 'Seeding Demo...' : 'Load GeM Sample Case'}
            </button>
            <Link to="/cases/new" className="btn-primary text-xs">
              <Plus size={15} /> Create Bid Case
            </Link>
          </div>
        }
      />

      {/* Filter and Search Controls */}
      <div className="panel p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-400 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, GeM ref, or department..."
              className="w-full bg-transparent text-sm text-[#0b2042] outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="">All Statuses</option>
              <option value="In review">In Review</option>
              <option value="Action needed">Action Needed</option>
              <option value="Compliant">Compliant</option>
              <option value="Draft">Draft</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="">All Categories</option>
              <option value="Enterprise IT">Enterprise IT</option>
              <option value="Signaling & Power">Signaling & Power</option>
              <option value="Renewable Energy">Renewable Energy</option>
              <option value="Office Automation">Office Automation</option>
            </select>

            <button type="submit" className="btn-secondary text-xs px-3">
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Cases Table */}
      {loading ? (
        <LoadingState label="Fetching authorized bid cases from database..." />
      ) : cases.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No bid cases found"
          description="You haven't created any bid cases yet, or none match your search filters."
          action={
            <div className="flex items-center justify-center gap-3">
              <button onClick={handleSeedDemo} disabled={seeding} className="btn-secondary text-xs">
                <Sparkles size={14} className="text-emerald-600" /> Load Sample Case
              </button>
              <Link to="/cases/new" className="btn-primary text-xs">
                <Plus size={15} /> Create First Bid Case
              </Link>
            </div>
          }
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  {['Case ID', 'Tender Title', 'Department / Entity', 'Estimated Value', 'Status', 'Score', 'Risk', 'Actions'].map((x) => (
                    <th key={x} className="px-5 py-3.5 font-semibold">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-[#0b2042]">{c.id}</span>
                      <p className="text-[11px] text-slate-400">{c.reference_number}</p>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-semibold text-[#0b2042] truncate">{c.title}</p>
                      <p className="text-xs text-slate-400">{c.category}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <p className="font-medium text-[#0b2042]">{c.department}</p>
                      <p className="text-slate-400 truncate max-w-[180px]">{c.procuring_organization}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-xs text-[#0b2042]">
                      ₹{c.estimated_value?.toLocaleString() || '0'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={c.status} />
                    </td>
                    <td className="px-5 py-4 font-bold text-[#0b2042]">
                      {c.compliance_score > 0 ? `${roundVal(c.compliance_score)}%` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={c.risk_level || 'Pending'} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/upload?case=${c.id}`}
                          title="Upload documents"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700 transition"
                        >
                          <UploadCloud size={16} />
                        </Link>
                        <Link
                          to={`/analysis?case=${c.id}`}
                          title="View analysis"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-700 transition"
                        >
                          <ScanSearch size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id, c.title)}
                          title="Delete case"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function roundVal(num) {
  return Math.round(Number(num) || 0)
}
