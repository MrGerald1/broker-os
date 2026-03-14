import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'

function debounce(fn, ms) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

export default function ClientList() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const fetchClients = useCallback(
    debounce(async (q, type) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (q) params.set('search', q)
        if (type) params.set('type', type)
        const { data } = await api.get(`/clients?${params}`)
        setClients(data.items)
        setTotal(data.total)
      } catch { toast.error('Failed to load clients') }
      finally { setLoading(false) }
    }, 300),
    []
  )

  useEffect(() => { fetchClients(search, typeFilter) }, [search, typeFilter])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">{total} total clients</p>
        </div>
        <Link to="/clients/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select w-auto">
          <option value="">All types</option>
          <option value="individual">Individual</option>
          <option value="corporate">Corporate</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Added</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading clients…</td></tr>
              )}
              {!loading && clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No clients found.{' '}
                    <Link to="/clients/new" className="text-brand-600 hover:underline">Add your first client →</Link>
                  </td>
                </tr>
              )}
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate(`/clients/${c.id}`)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {c.full_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{c.full_name}</p>
                        {c.company_name && <p className="text-xs text-slate-400">{c.company_name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={c.type === 'corporate' ? 'badge-blue' : 'badge-slate'}>
                      {c.type === 'corporate' ? '🏢 Corporate' : '👤 Individual'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 hidden md:table-cell">{c.phone}</td>
                  <td className="px-4 py-3.5 text-slate-600 hidden lg:table-cell">{c.email}</td>
                  <td className="px-4 py-3.5 text-slate-400 hidden lg:table-cell text-xs">
                    {new Date(c.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      className="text-brand-600 hover:text-brand-700 text-xs font-medium"
                      onClick={(e) => { e.stopPropagation(); navigate(`/clients/${c.id}`) }}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
