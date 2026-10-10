import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  TriangleAlert,
  Briefcase,
  ScanSearch,
  UploadCloud,
  Plus,
  Sparkles,
  FileBarChart2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getDashboardStats, seedDemoShowcase } from '../api/api'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import ComplianceRing from '../components/ComplianceRing'
import StatusBadge from '../components/StatusBadge'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setError(false)
    setLoading(true)
    getDashboardStats()
      .then((stats) => {
        setData(stats)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  async function handleSeedDemo() {
    setSeeding(true)
    try {
      await seedDemoShowcase()
      load()
    } catch (err) {
      alert(err.message || 'Demo seeding failed.')
    } finally {
      setSeeding(false)
    }
  }

  if (error) return <ErrorState onRetry={load} />
  if (loading || !data) return <LoadingState />

  const isBrandNewUser = (data.totalCases || 0) === 0

  // Format trend data
  const trend = (data.trend && data.trend.length > 0 ? data.trend : [0]).map((val, idx) => ({
    name: `Run ${idx + 1}`,
    score: val,
  }))

  const riskDist = data.riskDistribution || { Critical: 0, High: 0, Medium: 0, Low: 0 }

  return (
    <>
      <PageHeader
        eyebrow="Overview / Real-time Assurance"
        title="Procurement Assurance Dashboard"
        subtitle="Live intelligence across active GeM tender cases, clause evaluations, and audit verification posture."
        action={
          <div className="flex items-center gap-2">
            {isBrandNewUser && (
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="btn-secondary text-xs"
              >
                <Sparkles size={14} className="text-emerald-600" />
                {seeding ? 'Seeding Demo...' : 'Load GeM Sample Case'}
              </button>
            )}
            <Link to="/cases/new" className="btn-primary text-xs">
              <Plus size={14} /> Create Bid Case
            </Link>
          </div>
        }
      />

      {/* Top 4 Real Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Bid Cases"
          value={data.totalCases || 0}
          detail={`${data.activeCases || 0} currently active`}
        />
        <StatCard
          label="Bids Analyzed"
          value={data.analyzed || 0}
          detail="Clause verification completed"
          color="sky"
        />
        <StatCard
          label="Average Compliance"
          value={`${Math.round(data.averageCompliance || 0)}%`}
          detail={data.averageCompliance >= 80 ? 'Optimal assurance level' : 'Action items pending'}
          color="amber"
        />
        <StatCard
          label="Critical Risk Alerts"
          value={data.criticalAlerts || 0}
          detail={data.criticalAlerts > 0 ? 'Requires human review' : 'No critical exceptions'}
          color="red"
        />
      </div>

      {isBrandNewUser ? (
        <div className="mt-8">
          <EmptyState
            icon={FolderOpen}
            title="Welcome to BIDGUARD AI Workspace"
            description="Your workspace is initialized and ready. Create your first bid case or load the pre-configured GeM sample case to preview real clause analysis and evidence mapping."
            action={
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleSeedDemo}
                  disabled={seeding}
                  className="btn-secondary text-xs w-full sm:w-auto"
                >
                  <Sparkles size={15} className="text-emerald-600" />
                  {seeding ? 'Initializing Demo...' : 'Load Sample GeM Showcase Case'}
                </button>
                <Link to="/cases/new" className="btn-primary text-xs w-full sm:w-auto">
                  <Plus size={15} /> Create Bid Case From Scratch
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <>
          {/* Middle Charts & Health Section */}
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            {/* Compliance Trend Chart */}
            <div className="panel p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="eyebrow">Performance Trajectory</p>
                  <h2 className="mt-1 font-display text-lg font-bold text-[#0b2042]">
                    Historical Compliance Trend
                  </h2>
                </div>
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  Avg: {Math.round(data.averageCompliance || 0)}%
                </span>
              </div>

              <div className="mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#24D39A" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#24D39A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fill="url(#fillScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Distribution Breakdown */}
            <div className="panel p-6 flex flex-col justify-between">
              <div>
                <p className="eyebrow">Active Risk Posture</p>
                <h2 className="mt-1 font-display text-lg font-bold text-[#0b2042]">Risk Distribution</h2>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Overall Portfolio Score</span>
                  <ComplianceRing score={Math.round(data.averageCompliance || 0)} />
                </div>
              </div>

              <div className="mt-6 space-y-3.5 text-xs">
                {[
                  ['Critical', riskDist.Critical || 0, 'text-red-600 bg-red-50'],
                  ['High', riskDist.High || 0, 'text-orange-600 bg-orange-50'],
                  ['Medium', riskDist.Medium || 0, 'text-amber-600 bg-amber-50'],
                  ['Low', riskDist.Low || 0, 'text-emerald-700 bg-emerald-50'],
                ].map(([lbl, num, cls]) => (
                  <div key={lbl} className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5">
                    <span className="font-medium text-slate-600">{lbl} Exceptions</span>
                    <strong className={`rounded-lg px-2 py-0.5 text-xs font-bold ${cls}`}>{num}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Bid Cases Table */}
          <div className="panel mt-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <p className="eyebrow">Priority Queue</p>
                <h2 className="mt-1 font-display text-lg font-bold text-[#0b2042]">Recent Bid Cases</h2>
              </div>
              <Link to="/cases" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition">
                View all cases &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    {['Case ID', 'Bid Title', 'Department', 'Status', 'Score', 'Risk', 'Updated'].map((x) => (
                      <th key={x} className="px-5 py-3.5 font-semibold">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.recentCases || []).map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/analysis?case=${item.id}`)}
                      className="cursor-pointer hover:bg-slate-50/70 transition"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-xs text-[#0b2042]">{item.id}</td>
                      <td className="px-5 py-4 font-semibold text-xs text-slate-800">{item.title}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{item.department}</td>
                      <td className="px-5 py-4">
                        <StatusBadge label={item.status} />
                      </td>
                      <td className="px-5 py-4 font-bold text-xs text-[#0b2042]">
                        {item.score > 0 ? `${item.score}%` : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge label={item.risk} />
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">{item.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
