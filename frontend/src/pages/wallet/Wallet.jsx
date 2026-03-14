import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../api/client'

const fmt = (n) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n || 0)

const TX_STATUS = {
  awaiting_confirmation: { label: 'Awaiting Confirmation', cls: 'badge-amber' },
  confirmed:             { label: 'Confirmed',             cls: 'badge-green' },
  remitted:              { label: 'Remitted',              cls: 'badge-blue' },
  disputed:              { label: 'Disputed',              cls: 'badge-red' },
}

const CHANNEL_ICONS = { card: '💳', bank_transfer: '🏦', ussd: '📲' }

export default function Wallet() {
  const [wallet, setWallet]           = useState(null)
  const [transactions, setTransactions] = useState([])
  const [pending, setPending]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [showAddBank, setShowAddBank] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = async () => {
    setLoading(true)
    try {
      const [w, tx, pend] = await Promise.all([
        api.get('/wallet'),
        api.get('/wallet/transactions'),
        api.get('/wallet/pending-confirmations'),
      ])
      setWallet(w.data)
      setTransactions(tx.data)
      setPending(pend.data)
    } catch { toast.error('Failed to load wallet') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const addBankAccount = async (data) => {
    try {
      await api.post('/wallet/bank-account', data)
      toast.success('Bank account added')
      setShowAddBank(false)
      reset()
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading wallet…</div>

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-xl font-bold text-slate-900">Wallet & Commissions</h1>

      {/* Pending action banner */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-amber-800">Action Required: {pending.length} payment{pending.length > 1 ? 's' : ''} awaiting commission confirmation</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Total pending: <strong>{fmt(pending.reduce((s, t) => s + Number(t.commission_amount), 0))}</strong>
              {' '}— Go to Quotes to confirm.
            </p>
          </div>
        </div>
      )}

      {/* Balance cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available Balance',      value: fmt(wallet?.available_balance),         sub: 'Ready to withdraw',     highlight: true },
          { label: 'Pending Commission',      value: fmt(wallet?.pending_balance),           sub: 'Awaiting confirmation' },
          { label: 'GWP This Month',          value: fmt(wallet?.gwp_this_month),            sub: 'Gross Written Premium' },
          { label: 'Commission This Month',   value: fmt(wallet?.commission_this_month),     sub: 'Confirmed earnings' },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} className={`card p-5 ${highlight ? 'bg-brand-600 border-brand-600' : ''}`}>
            <p className={`text-xs font-medium mb-1 ${highlight ? 'text-brand-200' : 'text-slate-500'}`}>{label}</p>
            <p className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-slate-900'}`}>{value}</p>
            {sub && <p className={`text-xs mt-1 ${highlight ? 'text-brand-200' : 'text-slate-400'}`}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* All-time totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs text-slate-500 mb-1">Total GWP (All Time)</p>
          <p className="text-xl font-bold text-slate-900">{fmt(wallet?.total_gwp_all_time)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 mb-1">Total Commissions (All Time)</p>
          <p className="text-xl font-bold text-slate-900">{fmt(wallet?.total_commissions_all_time)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bank accounts */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">Bank Accounts</h2>
            <button onClick={() => setShowAddBank(!showAddBank)} className="btn-secondary text-xs py-1.5">
              + Add Account
            </button>
          </div>

          {showAddBank && (
            <form onSubmit={handleSubmit(addBankAccount)} className="px-5 py-4 border-b border-slate-100 space-y-3 bg-slate-50">
              <div>
                <label className="label">Bank Name *</label>
                <input {...register('bank_name', { required: true })} className="input" placeholder="Zenith Bank" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Account Number *</label>
                  <input {...register('account_number', { required: true })} className="input" placeholder="0123456789" />
                </div>
                <div>
                  <label className="label">Account Name *</label>
                  <input {...register('account_name', { required: true })} className="input" placeholder="Apex Brokers Ltd" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowAddBank(false); reset() }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Account</button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-50">
            {(wallet?.bank_accounts || []).length === 0 && !showAddBank && (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No bank accounts added yet.</p>
            )}
            {(wallet?.bank_accounts || []).map((acc, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-lg">🏦</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{acc.account_name}</p>
                    <p className="text-xs text-slate-400">{acc.bank_name} · {acc.account_number}</p>
                  </div>
                </div>
                {acc.is_default && <span className="badge-green">Default</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {transactions.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No transactions yet.</p>
            )}
            {transactions.slice(0, 20).map(tx => {
              const sc = TX_STATUS[tx.status] || { label: tx.status, cls: 'badge-slate' }
              return (
                <div key={tx.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{CHANNEL_ICONS[tx.payment_channel] || '💵'}</span>
                      <p className="text-sm font-medium text-slate-900">{tx.client_name || '—'}</p>
                    </div>
                    <span className={sc.cls}>{sc.label}</span>
                  </div>
                  <div className="flex items-center justify-between pl-6">
                    <div>
                      <p className="text-xs text-slate-500 capitalize">{tx.product_type} · {tx.plan_name}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{fmt(tx.premium_amount)}</p>
                      <p className="text-xs text-brand-600 font-medium">+{fmt(tx.commission_amount)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
