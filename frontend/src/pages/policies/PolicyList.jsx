import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'

const fmt = (n) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n || 0)

const STATUS_CONFIG = {
  active:          { label: 'Active',           cls: 'badge-green' },
  expiring_soon:   { label: 'Expiring Soon',    cls: 'badge-amber' },
  expired:         { label: 'Expired',          cls: 'badge-slate' },
  payment_pending: { label: 'Payment Pending',  cls: 'badge-amber' },
  quote_pending:   { label: 'Quote Pending',    cls: 'badge-blue' },
  cancelled:       { label: 'Cancelled',        cls: 'badge-red' },
  claimed:         { label: 'Claimed',          cls: 'badge-slate' },
}

const PRODUCT_ICONS = { auto: '🚗', health: '🏥', life: '🛡️', travel: '✈️', device: '📱' }

export default function PolicyList() {
  const [policies, setPolicies] = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (productFilter) params.set('product_type', productFilter)
      const { data } = await api.get(`/policies?${params}&limit=100`)
      setPolicies(data.items)
      setTotal(data.total)
    } catch { toast.error('Failed to load policies') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter, productFilter])

  const daysUntilExpiry = (end) => {
    if (!end) return null
    const diff = new Date(end) - new Date()
    return Math.round(diff / 86400000)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Policies</h1>
          <p className="text-sm text-slate-500">{total} total policies</p>
        </div>
        <Link to="/quotes/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          New Quote
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5">
          {['', 'active', 'expiring_soon', 'payment_pending', 'expired'].map(s => {
            const cfg = STATUS_CONFIG[s]
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}
              >
                {s ? cfg?.label : 'All Status'}
              </button>
            )
          })}
        </div>
        <select
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
          className="select w-auto text-xs"
        >
          <option value="">All Products</option>
          {['auto','health','life','travel','device'].map(p => (
            <option key={p} value={p}>{PRODUCT_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Premium</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Commission</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading…</td></tr>
              )}
              {!loading && policies.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No policies yet.{' '}
                    <Link to="/quotes/new" className="text-brand-600 hover:underline">Create a quote to start →</Link>
                  </td>
                </tr>
              )}
              {policies.map(p => {
                const sc = STATUS_CONFIG[p.status] || { label: p.status, cls: 'badge-slate' }
                const days = daysUntilExpiry(p.end_date)
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{p.client_name || '—'}</p>
                      <p className="text-xs text-slate-400">{p.insurer_name}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span>{PRODUCT_ICONS[p.product_type]}</span>
                        <div>
                          <p className="text-slate-800 font-medium leading-tight">{p.plan_name}</p>
                          <p className="text-xs text-slate-400 capitalize">{p.product_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={sc.cls}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="font-medium text-slate-900">{fmt(p.annual_premium)}</p>
                      <p className="text-xs text-slate-400">per annum</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="font-medium text-brand-700">{fmt(p.commission_amount)}</p>
                      <p className="text-xs text-slate-400">{(p.commission_rate * 100).toFixed(0)}%</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {p.end_date ? (
                        <div>
                          <p className="text-xs text-slate-700">{new Date(p.end_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          {days !== null && days <= 30 && days >= 0 && (
                            <p className="text-xs text-amber-600 font-medium">{days} days left</p>
                          )}
                          {days !== null && days < 0 && (
                            <p className="text-xs text-red-500">Expired {Math.abs(days)}d ago</p>
                          )}
                        </div>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
