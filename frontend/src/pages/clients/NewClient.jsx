import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../api/client'

const FREE_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'ymail.com']

export default function NewClient() {
  const navigate = useNavigate()
  const [clientType, setClientType] = useState('individual')
  const [loading, setLoading] = useState(false)
  const [emailPrompt, setEmailPrompt] = useState(false)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ defaultValues: { directors: [] } })

  const emailVal = watch('email')

  const checkEmail = (val) => {
    if (!val) return
    const domain = val.split('@')[1] || ''
    if (domain && !FREE_DOMAINS.includes(domain.toLowerCase())) {
      setEmailPrompt(true)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = { ...data, type: clientType }
      const { data: client } = await api.post('/clients', payload)
      toast.success('Client created successfully')
      navigate(`/clients/${client.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clients')} className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-slate-900">New Client</h1>
      </div>

      <div className="card p-6 space-y-5">
        {/* Type selector */}
        <div>
          <label className="label">Client Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'individual', label: '👤 Individual', desc: 'Personal insurance' },
              { value: 'corporate', label: '🏢 Corporate', desc: 'Business / company' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setClientType(value); setEmailPrompt(false) }}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  clientType === value ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                }`}
              >
                <p className={`text-sm font-medium ${clientType === value ? 'text-brand-700' : 'text-slate-800'}`}>{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input {...register('full_name', { required: 'Required' })} className="input" placeholder={clientType === 'corporate' ? 'Company contact person' : 'Adebayo Okafor'} />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="label">Phone *</label>
              <input {...register('phone', { required: 'Required', pattern: { value: /^0[789][01]\d{8}$/, message: '11-digit NG number' } })} className="input" placeholder="08012345678" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                {...register('email', { required: 'Required' })}
                type="email"
                className="input"
                placeholder="client@email.com"
                onBlur={(e) => checkEmail(e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {/* Corporate domain prompt */}
          {emailPrompt && clientType === 'individual' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              This looks like a corporate email. Is this for a company policy?
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => { setClientType('corporate'); setEmailPrompt(false) }} className="btn-primary py-1 px-3 text-xs">
                  Yes, switch to Corporate
                </button>
                <button type="button" onClick={() => setEmailPrompt(false)} className="btn-secondary py-1 px-3 text-xs">
                  No, keep as Individual
                </button>
              </div>
            </div>
          )}

          {clientType === 'individual' && (
            <>
              <div>
                <label className="label">Date of Birth</label>
                <input {...register('date_of_birth')} type="date" className="input" />
              </div>
              <div>
                <label className="label">Address</label>
                <input {...register('address')} className="input" placeholder="15 Bourdillon Road, Ikoyi, Lagos" />
              </div>
            </>
          )}

          {clientType === 'corporate' && (
            <>
              <div>
                <label className="label">Company Name *</label>
                <input {...register('company_name', { required: 'Required for corporate' })} className="input" placeholder="Acme Industries Ltd" />
                {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">CAC Number</label>
                  <input {...register('cac_number')} className="input" placeholder="RC-123456" />
                </div>
                <div>
                  <label className="label">Industry Sector</label>
                  <select {...register('industry_sector')} className="select">
                    <option value="">Select sector</option>
                    {['Manufacturing', 'Logistics', 'Finance', 'Healthcare', 'Oil & Gas', 'Education', 'Government', 'Technology', 'Other'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Number of Employees</label>
                <input {...register('employee_count', { valueAsNumber: true })} type="number" className="input" placeholder="50" />
              </div>
              <div>
                <label className="label">Business Address</label>
                <input {...register('address')} className="input" placeholder="Plot 1, Industrial Layout, Lagos" />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/clients')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
