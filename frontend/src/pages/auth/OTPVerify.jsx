import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'

export default function OTPVerify() {
  const { verifyOtp } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const email = state?.email || ''
  const demoOtp = state?.demo_otp || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const inputRefs = useRef([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
    if (next.every((d) => d) && next.join('').length === 6) {
      handleSubmit(next.join(''))
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handleSubmit = async (code) => {
    const otpVal = code || otp.join('')
    if (otpVal.length !== 6) return toast.error('Enter 6-digit OTP')
    setLoading(true)
    try {
      await verifyOtp(email, otpVal)
      toast.success('Email verified! Welcome to BrokerOS.')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setResending(true)
    try {
      const { data } = await api.post(`/auth/resend-otp?email=${encodeURIComponent(email)}`)
      toast.success('New OTP sent')
      setCountdown(60)
    } catch (err) {
      toast.error('Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-1">Verify your email</h2>
          <p className="text-slate-500 text-sm mb-6">
            We sent a 6-digit code to <strong className="text-slate-700">{email}</strong>
          </p>

          {demoOtp && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-5 text-sm text-amber-700">
              Demo OTP: <strong>{demoOtp}</strong>
            </div>
          )}

          <div className="flex gap-2.5 justify-center mb-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-13 text-center text-xl font-bold border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 transition-colors"
                style={{ height: '3.25rem' }}
              />
            ))}
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={loading || otp.join('').length !== 6}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Verifying…' : 'Verify Email'}
          </button>

          <div className="mt-4 text-sm text-slate-500">
            {countdown > 0 ? (
              <span>Resend OTP in {countdown}s</span>
            ) : (
              <button onClick={resend} disabled={resending} className="text-brand-600 hover:underline font-medium">
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
