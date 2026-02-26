import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const fmt = (n) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n || 0)

const fmtNum = (n) => new Intl.NumberFormat('en').format(n || 0)

function StatCard({ label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

const STATUS_BADGE = {
  draft: <span className="badge-slate">Draft</span>,
  sent: <span className="badge-blue">Sent</span>,
  paid: <span className="badge-green">Paid</span>,
  expired: <span className="badge-slate">Expired</span>,
  active: <span className="badge-green">Active</span>,
  expiring_soon: <span className="badge-amber">Expiring Soon</span>,
  payment_pending: <span className="badge-amber">Awaiting Payment</span>,
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats').then(({ data }) => setStats(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading dashboard…</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Good morning, {user?.business_name?.split(' ')[0] || 'Broker'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Here's what's happening with your portfolio today</p>
        </div>
        <Link to="/quotes/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Quote
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="GWP This Month"
          value={fmt(stats?.gwp_this_month)}
          sub="Gross Written Premium"
          color="brand"
        />
        <StatCard
          label="Commission This Month"
          value={fmt(stats?.commission_this_month)}
          sub="Confirmed earnings"
          color="blue"
        />
        <StatCard
          label="Pending Commission"
          value={fmt(stats?.pending_commission)}
          sub="Awaiting your confirmation"
          color="amber"
        />
        <StatCard
          label="Active Policies"
          value={fmtNum(stats?.total_active_policies)}
          sub={`${stats?.expiring_soon_count || 0} expiring soon`}
          color="slate"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients" value={fmtNum(stats?.total_clients)} color="slate" />
        <StatCard label="Total Quotes" value={fmtNum(stats?.total_quotes)} color="slate" />
        <StatCard label="Quotes This Month" value={fmtNum(stats?.quotes_this_month)} color="slate" />
        <StatCard label="Expiring ≤30 Days" value={fmtNum(stats?.expiring_soon_count)} color="amber" />
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent quotes */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">Recent Quotes</h2>
            <Link to="/quotes" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {stats?.recent_quotes?.length === 0 && (
              <div className="p-5 text-sm text-slate-400 text-center">No quotes yet. <Link to="/quotes/new" className="text-brand-600">Create one →</Link></div>
            )}
            {stats?.recent_quotes?.map((q) => (
              <div key={q.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 capitalize">{q.product_type} Insurance</p>
                  <p className="text-xs text-slate-400">{new Date(q.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
                </div>
                {STATUS_BADGE[q.status] || <span className="badge-slate">{q.status}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'New Quote', to: '/quotes/new', desc: 'Generate multi-insurer quote', icon: '📄' },
              { label: 'Add Client', to: '/clients/new', desc: 'Register new client', icon: '👤' },
              { label: 'View Wallet', to: '/wallet', desc: 'Check commissions', icon: '💳' },
              { label: 'Policies', to: '/policies', desc: 'Manage active policies', icon: '🛡️' },
            ].map(({ label, to, desc, icon }) => (
              <Link
                key={to}
                to={to}
                className="p-3 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-colors group"
              >
                <span className="text-2xl">{icon}</span>
                <p className="text-sm font-medium text-slate-800 mt-2 group-hover:text-brand-700">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>

          {/* Coming soon teaser */}
          <div className="mt-4 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 p-4 text-white">
            <p className="text-xs font-medium text-brand-200 mb-1">Coming Soon</p>
            <p className="text-sm font-semibold">Broker Website Builder</p>
            <p className="text-xs text-brand-200 mt-0.5 mb-3">Launch your branded insurance website in minutes. Clients get quotes and buy policies 24/7.</p>
            <button className="text-xs bg-white text-brand-700 font-semibold px-3 py-1.5 rounded-md hover:bg-brand-50 transition-colors">
              Join Waitlist
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
