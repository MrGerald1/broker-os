import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'

const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n || 0)

const STATUS_BADGE = {
  active: <span className="badge-green">Active</span>,
  expiring_soon: <span className="badge-amber">Expiring Soon</span>,
  expired: <span className="badge-slate">Expired</span>,
  payment_pending: <span className="badge-amber">Payment Pending</span>,
  cancelled: <span className="badge-red">Cancelled</span>,
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/clients/${id}/policies`),
    ]).then(([{ data: c }, { data: p }]) => {
      setClient(c)
      setPolicies(p)
    }).catch(() => toast.error('Failed to load client')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
  if (!client) return <div className="text-center py-16 text-slate-400">Client not found</div>

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clients')} className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{client.full_name}</h1>
          <p className="text-sm text-slate-500">{client.company_name || client.email}</p>
        </div>
        <Link to={`/quotes/new?client_id=${client.id}`} className="btn-primary">New Quote</Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Info card */}
        <div className="card p-5 space-y-4 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-lg font-bold">
              {client.full_name[0]}
            </div>
            <div>
              <span className={client.type === 'corporate' ? 'badge-blue' : 'badge-slate'}>
                {client.type === 'corporate' ? '🏢 Corporate' : '👤 Individual'}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Phone', value: client.phone },
              { label: 'Email', value: client.email },
              { label: 'Address', value: client.address },
              client.date_of_birth && { label: 'Date of Birth', value: client.date_of_birth },
              client.company_name && { label: 'Company', value: client.company_name },
              client.cac_number && { label: 'CAC Number', value: client.cac_number },
              client.industry_sector && { label: 'Industry', value: client.industry_sector },
              client.employee_count && { label: 'Employees', value: client.employee_count?.toLocaleString() },
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-400 pt-2 border-t border-slate-50">
            Added {new Date(client.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Policies */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">Policies ({policies.length})</h2>
            <Link to={`/quotes/new?client_id=${client.id}`} className="text-xs text-brand-600 hover:underline">+ New Quote</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {policies.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">
                No policies yet.
                <br />
                <Link to={`/quotes/new?client_id=${client.id}`} className="text-brand-600 hover:underline mt-1 inline-block">
                  Generate a quote →
                </Link>
              </div>
            )}
            {policies.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{p.plan_name}</p>
                    {STATUS_BADGE[p.status]}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <p className="text-xs text-slate-400 capitalize">{p.product_type}</p>
                    {p.end_date && (
                      <p className="text-xs text-slate-400">Expires {new Date(p.end_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{fmt(p.annual_premium)}</p>
                  <p className="text-xs text-slate-400">per annum</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
