import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState('broker')
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const result = await signup({ ...data, account_type: accountType })
      toast.success('Account created! Check your email for the OTP.')
      navigate('/verify-otp', { state: { email: data.email, demo_otp: result.demo_otp } })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-xl leading-none">BrokerOS</p>
              <p className="text-slate-400 text-xs">by Skydd</p>
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Join 100+ Nigerian brokers on BrokerOS</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {/* Account type selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'broker', label: 'Insurance Broker', desc: 'NCRIB licensed firm' },
              { value: 'agent', label: 'Insurance Agent', desc: 'Individual agent' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccountType(value)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  accountType === value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className={`text-sm font-medium ${accountType === value ? 'text-brand-700' : 'text-slate-800'}`}>{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {accountType === 'broker' && (
              <>
                <div>
                  <label className="label">Business Name</label>
                  <input {...register('business_name', { required: 'Business name required' })} className="input" placeholder="Apex Insurance Brokers Ltd" />
                  {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name.message}</p>}
                </div>
                <div>
                  <label className="label">NCRIB License Number</label>
                  <input {...register('ncrib_license_number', { required: 'NCRIB number required' })} className="input" placeholder="NCRIB/B/2024/0001" />
                  {errors.ncrib_license_number && <p className="text-red-500 text-xs mt-1">{errors.ncrib_license_number.message}</p>}
                  <p className="text-xs text-slate-400 mt-1">Your license will be verified within 24 hours</p>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Email</label>
                <input {...register('email', { required: 'Required' })} type="email" className="input" placeholder="admin@yourbroker.ng" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Phone</label>
                <input {...register('phone', { required: 'Required' })} className="input" placeholder="08012345678" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <input {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} type="password" className="input" placeholder="Min. 8 characters" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {accountType === 'broker' && (
              <div>
                <label className="label">Business Address</label>
                <input {...register('business_address')} className="input" placeholder="45 Marina Street, Lagos Island" />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
