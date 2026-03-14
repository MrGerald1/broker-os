import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'

const fmt = (n) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n || 0)

const STATUS_CONFIG = {
  draft:     { label: 'Draft',    cls: 'badge-slate' },
  sent:      { label: 'Sent',     cls: 'badge-blue' },
  paid:      { label: 'Paid',     cls: 'badge-green' },
  expired:   { label: 'Expired', cls: 'badge-slate' },
  cancelled: { label: 'Cancelled', cls: 'badge-red' },
}

const PRODUCT_ICONS = { auto: '🚗', health: '🏥', life: '🛡️', travel: '✈️', device: '📱' }

export default function QuoteList() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [confirming, setConfirming] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const { data } = await api.get(`/quotes?${params}&limit=100`)
      setQuotes(data.items)
      setTotal(data.total)
    } catch { toast.error('Failed to load quotes') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const confirmPayment = async (q) => {
    setConfirming(q.id)
    try {
      await api.post(`/quotes/${q.id}/confirm-payment`)
      toast.success('Payment confirmed! Please confirm your commission.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally {
      setConfirming(null)
    }
  }

  const confirmCommission = async (q) => {
    setConfirming(q.id + '_comm')
    try {
      await api.post(`/quotes/${q.id}/confirm-commission`)
      toast.success('Commission confirmed! Policy is now active.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally {
      setConfirming(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quotes</h1>
          <p className="text-sm text-slate-500">{total} total</p>
        </div>
        <Link to="/quotes/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          New Quote
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'draft', 'sent', 'paid', 'expired'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}
          >
            {s ? STATUS_CONFIG[s]?.label || s : 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Quotes</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading…</td></tr>
              )}
              {!loading && quotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No quotes yet.{' '}
                    <Link to="/quotes/new" className="text-brand-600 hover:underline">Generate your first quote →</Link>
                  </td>
                </tr>
              )}
              {quotes.map(q => {
                const sc = STATUS_CONFIG[q.status] || { label: q.status, cls: 'badge-slate' }
                const topQuote = q.quotes_returned?.[0]
                return (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{q.client_name || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5 capitalize">
                        {PRODUCT_ICONS[q.product_type]} {q.product_type}
                        {q.coverage_type && <span className="text-xs text-slate-400">· {q.coverage_type.replace(/_/g, ' ')}</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={sc.cls}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {topQuote ? (
                        <div>
                          <p className="text-xs font-medium text-slate-800">Best: {fmt(topQuote.annual_premium)}</p>
                          <p className="text-xs text-slate-400">{q.quotes_returned?.length} insurers</p>
                        </div>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-slate-400">
                      {new Date(q.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2 flex-wrap">
                        {q.status === 'sent' && (
                          <button
                            onClick={() => confirmPayment(q)}
                            disabled={confirming === q.id}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            {confirming === q.id ? '…' : 'Mark Paid'}
                          </button>
                        )}
                        {q.status === 'paid' && (
                          <button
                            onClick={() => confirmCommission(q)}
                            disabled={confirming === q.id + '_comm'}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            {confirming === q.id + '_comm' ? '…' : 'Confirm Commission'}
                          </button>
                        )}
                        {q.status === 'draft' && q.quotes_returned?.length > 0 && (
                          <Link to={`/quotes/new`} className="btn-secondary text-xs py-1.5 px-3">View →</Link>
                        )}
                      </div>
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
