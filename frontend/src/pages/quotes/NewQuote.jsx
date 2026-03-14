import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../api/client'

const PRODUCTS = [
  { value: 'auto',   label: 'Auto Insurance',   icon: '🚗', desc: 'Motor Third Party & Comprehensive' },
  { value: 'health', label: 'Health Insurance',  icon: '🏥', desc: 'Individual & Group Health Plans' },
  { value: 'life',   label: 'Life Insurance',    icon: '🛡️', desc: 'Term Life, Whole Life & Group Life' },
  { value: 'travel', label: 'Travel Insurance',  icon: '✈️', desc: 'Single trip & multi-trip' },
  { value: 'device', label: 'Device Insurance',  icon: '📱', desc: 'Smartphone & laptop cover' },
]

const AUTO_COVERAGES = [
  { value: 'third_party',           label: 'Third Party Only',           desc: '₦15,000 fixed (private) — NAICOM minimum' },
  { value: 'third_party_fire_theft', label: 'Third Party, Fire & Theft', desc: 'TP + Fire + Theft cover' },
  { value: 'comprehensive',          label: 'Comprehensive',              desc: 'Min 5% of sum insured — full cover' },
]

const VEHICLE_USAGES = [
  { value: 'private',          label: 'Private Motor',              tp: 15000 },
  { value: 'own_goods',        label: 'Own Goods',                  tp: 20000 },
  { value: 'staff_bus',        label: 'Staff Bus',                  tp: 20000 },
  { value: 'commercial_truck', label: 'Commercial Truck / Heavy',   tp: 100000 },
  { value: 'special_type',     label: 'Special Type Vehicle',       tp: 20000 },
  { value: 'tricycle',         label: 'Tricycle (Keke NAPEP)',       tp: 5000 },
  { value: 'motorcycle',       label: 'Motorcycle (Okada)',          tp: 3000 },
]

const VEHICLE_MAKES = ['Toyota','Honda','Hyundai','Kia','Mercedes-Benz','BMW','Ford','Volkswagen','Nissan','Mazda','Mitsubishi','Lexus','Land Rover','Peugeot','Innoson','Other']

const HEALTH_TIERS = [
  { value: 'basic',     label: 'Basic',     desc: 'Outpatient, basic labs — ₦58K–₦90K/yr' },
  { value: 'standard',  label: 'Standard',  desc: 'Basic + maternity & surgery — ₦120K–₦200K/yr' },
  { value: 'premium',   label: 'Premium',   desc: 'Full cover + evacuation — ₦250K–₦450K/yr' },
  { value: 'executive', label: 'Executive', desc: 'Unlimited specialist + mental health — ₦500K+' },
]

const TRAVEL_REGIONS = [
  { value: 'west_africa', label: 'West Africa' },
  { value: 'africa',      label: 'Rest of Africa' },
  { value: 'europe',      label: 'Europe' },
  { value: 'usa_canada',  label: 'USA / Canada' },
  { value: 'asia',        label: 'Asia' },
  { value: 'worldwide',   label: 'Worldwide' },
]

const STEPS = ['Select Client', 'Choose Product', 'Enter Details', 'Quote Results']

export default function NewQuote() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preClientId = searchParams.get('client_id')

  const [step, setStep]                   = useState(1)
  const [clients, setClients]             = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedCoverage, setSelectedCoverage] = useState(null)
  const [vehicleUsage, setVehicleUsage]   = useState('private')
  const [quoteData, setQuoteData]         = useState(null)
  const [generating, setGenerating]       = useState(false)
  const [clientSearch, setClientSearch]   = useState('')
  const [sending, setSending]             = useState(null)

  const { register, handleSubmit } = useForm()

  useEffect(() => {
    api.get('/clients?limit=200').then(({ data }) => {
      setClients(data.items)
      if (preClientId) {
        const found = data.items.find(c => c.id === preClientId)
        if (found) { setSelectedClient(found); setStep(2) }
      }
    })
  }, [preClientId])

  const filtered = clients.filter(c =>
    !clientSearch ||
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  )

  const buildDetails = (fd) => {
    if (selectedProduct === 'auto') return {
      vehicle_usage: vehicleUsage,
      vin: fd.vin,
      make: fd.make || 'Toyota',
      model: fd.model || 'Camry',
      year: parseInt(fd.year) || 2020,
      registration_number: fd.registration_number,
      sum_insured: parseInt((fd.sum_insured || '0').replace(/,/g, '')),
      driver_name: fd.driver_name || selectedClient?.full_name,
      driver_license_number: fd.driver_license_number,
      years_driving_experience: fd.years_driving_experience || '1-5',
      claims_last_3_years: fd.claims_last_3_years || 'none',
    }
    if (selectedProduct === 'health') return {
      plan_tier: fd.plan_tier || 'standard',
      enrollee_count: parseInt(fd.enrollee_count) || 1,
      pre_existing_conditions: fd.pre_existing_conditions === 'yes',
      maternity_required: fd.maternity_required === 'yes',
    }
    if (selectedProduct === 'life') return {
      plan_type: fd.life_plan_type || 'term',
      sum_assured: parseInt((fd.sum_assured || '10000000').replace(/,/g, '')),
      term_years: parseInt(fd.term_years) || 10,
      smoker: fd.smoker === 'yes',
      age: parseInt(fd.age) || 35,
    }
    if (selectedProduct === 'travel') {
      const dep = new Date(fd.departure_date || Date.now())
      const ret = new Date(fd.return_date || Date.now() + 7 * 86400000)
      const days = Math.max(1, Math.round((ret - dep) / 86400000))
      return {
        destination_region: fd.destination_region || 'europe',
        trip_type: fd.trip_type || 'single',
        departure_date: fd.departure_date,
        return_date: fd.return_date,
        trip_days: days,
        traveller_count: parseInt(fd.traveller_count) || 1,
        trip_purpose: fd.trip_purpose || 'leisure',
        coverage_level: fd.coverage_level || 'comprehensive',
      }
    }
    if (selectedProduct === 'device') return {
      device_type: fd.device_type || 'smartphone',
      make: fd.device_make,
      model: fd.device_model,
      sum_insured: parseInt((fd.device_sum_insured || '0').replace(/,/g, '')),
      serial_number: fd.serial_number,
      coverage_type: fd.device_coverage || 'accidental_and_theft',
    }
    return {}
  }

  const generateQuotes = async (fd) => {
    setGenerating(true)
    try {
      const { data } = await api.post('/quotes', {
        client_id: selectedClient.id,
        product_type: selectedProduct,
        coverage_type: selectedCoverage,
        vehicle_usage: selectedProduct === 'auto' ? vehicleUsage : undefined,
        product_details: buildDetails(fd),
      })
      setQuoteData(data)
      setStep(4)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate quotes')
    } finally {
      setGenerating(false)
    }
  }

  const sendQuote = async (idx) => {
    setSending(idx)
    try {
      const q = quoteData.quotes_returned[idx]
      await api.post(`/quotes/${quoteData.id}/select`, { insurer_id: q.insurer_id, quote_index: idx })
      toast.success('Quote sent to client! Payment link generated.')
      navigate('/quotes')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send quote')
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/quotes')} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-xl font-bold text-slate-900">New Quote</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = step > n, active = step === n
          return (
            <div key={label} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${done ? 'bg-brand-500 text-white' : active ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-slate-200 text-slate-500'}`}>
                  {done ? '✓' : n}
                </div>
                <span className={`text-xs hidden sm:block truncate ${active ? 'text-brand-700 font-semibold' : done ? 'text-brand-500' : 'text-slate-400'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${done ? 'bg-brand-400' : 'bg-slate-200'}`}/>}
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Select Client ── */}
      {step === 1 && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Who is this quote for?</h2>
          <input className="input" placeholder="Search by name, email, phone…" value={clientSearch} onChange={e => setClientSearch(e.target.value)} autoFocus />
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {filtered.map(c => (
              <button key={c.id} type="button"
                onClick={() => { setSelectedClient(c); setStep(2) }}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-brand-300 hover:bg-brand-50 text-left transition-colors group"
              >
                <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                  {c.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{c.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{c.email} · <span className="capitalize">{c.type}</span></p>
                </div>
                <span className="text-brand-500 text-xs group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">
                No clients found.{' '}
                <button onClick={() => navigate('/clients/new')} className="text-brand-600 hover:underline">Add client first →</button>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Select Product ── */}
      {step === 2 && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Select Insurance Product</h2>
            <span className="text-sm text-slate-500">For: <strong>{selectedClient?.full_name}</strong></span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRODUCTS.map(({ value, label, icon, desc }) => (
              <button key={value} type="button"
                onClick={() => { setSelectedProduct(value); setSelectedCoverage(null); setStep(3) }}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 text-left transition-colors group"
              >
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700 leading-tight">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="btn-secondary text-xs">← Back</button>
        </div>
      )}

      {/* ── Step 3: Product Details ── */}
      {step === 3 && (
        <form onSubmit={handleSubmit(generateQuotes)} className="card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              {PRODUCTS.find(p => p.value === selectedProduct)?.icon} {' '}
              {PRODUCTS.find(p => p.value === selectedProduct)?.label} Details
            </h2>
            <span className="text-sm text-slate-500">{selectedClient?.full_name}</span>
          </div>

          {/* AUTO */}
          {selectedProduct === 'auto' && (
            <div className="space-y-4">
              <div>
                <label className="label">Coverage Type *</label>
                <div className="space-y-2">
                  {AUTO_COVERAGES.map(({ value, label, desc }) => (
                    <label key={value} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedCoverage === value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="cov" value={value} checked={selectedCoverage === value} onChange={() => setSelectedCoverage(value)} className="mt-0.5 accent-brand-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Vehicle Usage *</label>
                <select className="select" value={vehicleUsage} onChange={e => setVehicleUsage(e.target.value)}>
                  {VEHICLE_USAGES.map(({ value, label, tp }) => (
                    <option key={value} value={value}>{label} — TP ₦{tp.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Make</label>
                  <select {...register('make')} className="select">{VEHICLE_MAKES.map(m => <option key={m}>{m}</option>)}</select>
                </div>
                <div>
                  <label className="label">Model</label>
                  <input {...register('model')} className="input" placeholder="Camry" />
                </div>
                <div>
                  <label className="label">Year</label>
                  <select {...register('year')} className="select">
                    {Array.from({length: 35}, (_, i) => 2025 - i).map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Plate Number</label>
                  <input {...register('registration_number')} className="input" placeholder="ABC-123-XY" />
                </div>
                <div>
                  <label className="label">VIN (optional)</label>
                  <input {...register('vin')} className="input" placeholder="17-char VIN" />
                  <p className="text-xs text-slate-400 mt-1">Auto-decoded via NHTSA API in production</p>
                </div>
                {selectedCoverage === 'comprehensive' && (
                  <div>
                    <label className="label">Sum Insured — Market Value (₦) *</label>
                    <input {...register('sum_insured', { required: selectedCoverage === 'comprehensive' })} className="input" placeholder="16,000,000" />
                    <p className="text-xs text-slate-400 mt-1">Suggested from Carlots.ng in production</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Driver Licence No.</label>
                  <input {...register('driver_license_number')} className="input" placeholder="FRN123456789" />
                </div>
                <div>
                  <label className="label">Driving Experience</label>
                  <select {...register('years_driving_experience')} className="select">
                    <option value="1-5">1–5 years</option>
                    <option value="6-10">6–10 years</option>
                    <option value="11-20">11–20 years</option>
                    <option value="20+">20+ years</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Claims in last 3 years</label>
                <select {...register('claims_last_3_years')} className="select">
                  <option value="none">None</option>
                  <option value="one">1 claim</option>
                  <option value="two">2 claims</option>
                  <option value="three_plus">3+ claims</option>
                </select>
              </div>
            </div>
          )}

          {/* HEALTH */}
          {selectedProduct === 'health' && (
            <div className="space-y-4">
              <div>
                <label className="label">Plan Tier *</label>
                <div className="grid grid-cols-2 gap-2">
                  {HEALTH_TIERS.map(({ value, label, desc }) => (
                    <label key={value} className="flex items-start gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 transition-colors">
                      <input {...register('plan_tier', { required: true })} type="radio" value={value} className="mt-0.5 accent-brand-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Number of Enrollees</label>
                  <input {...register('enrollee_count')} type="number" defaultValue={1} min={1} className="input" />
                </div>
                <div>
                  <label className="label">Pre-existing Conditions?</label>
                  <select {...register('pre_existing_conditions')} className="select">
                    <option value="no">No</option>
                    <option value="yes">Yes (disclosed)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Maternity Cover Required?</label>
                <select {...register('maternity_required')} className="select">
                  <option value="no">No</option>
                  <option value="yes">Yes (premium loading applies)</option>
                </select>
              </div>
            </div>
          )}

          {/* LIFE */}
          {selectedProduct === 'life' && (
            <div className="space-y-4">
              <div>
                <label className="label">Plan Type</label>
                <select {...register('life_plan_type')} className="select">
                  <option value="term">Term Life — Pure death benefit</option>
                  <option value="whole_life">Whole Life — With savings component</option>
                  <option value="endowment">Endowment — Savings + death cover</option>
                  <option value="group_life">Group Life (Statutory) — Min 3× salary</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sum Assured (₦)</label>
                  <input {...register('sum_assured')} className="input" placeholder="10,000,000" />
                </div>
                <div>
                  <label className="label">Policy Term (years)</label>
                  <input {...register('term_years')} type="number" defaultValue={10} min={1} max={30} className="input" />
                </div>
                <div>
                  <label className="label">Client Age</label>
                  <input {...register('age')} type="number" defaultValue={35} min={18} max={70} className="input" />
                </div>
                <div>
                  <label className="label">Smoker?</label>
                  <select {...register('smoker')} className="select">
                    <option value="no">Non-smoker</option>
                    <option value="yes">Smoker (loading applies)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TRAVEL */}
          {selectedProduct === 'travel' && (
            <div className="space-y-4">
              <div>
                <label className="label">Destination Region *</label>
                <select {...register('destination_region', { required: true })} className="select">
                  {TRAVEL_REGIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Trip Type</label>
                  <select {...register('trip_type')} className="select">
                    <option value="single">Single Trip</option>
                    <option value="multi_annual">Multi-Trip Annual</option>
                  </select>
                </div>
                <div>
                  <label className="label">No. of Travellers</label>
                  <input {...register('traveller_count')} type="number" defaultValue={1} min={1} className="input" />
                </div>
                <div>
                  <label className="label">Departure Date *</label>
                  <input {...register('departure_date', { required: true })} type="date" className="input" />
                </div>
                <div>
                  <label className="label">Return Date *</label>
                  <input {...register('return_date', { required: true })} type="date" className="input" />
                </div>
                <div>
                  <label className="label">Trip Purpose</label>
                  <select {...register('trip_purpose')} className="select">
                    <option value="leisure">Leisure</option>
                    <option value="business">Business</option>
                    <option value="medical">Medical</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="label">Coverage Level</label>
                  <select {...register('coverage_level')} className="select">
                    <option value="medical_only">Medical Only</option>
                    <option value="medical_plus_luggage">Medical + Luggage</option>
                    <option value="comprehensive">Comprehensive</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DEVICE */}
          {selectedProduct === 'device' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                Device insurance in Nigeria is primarily offered by Heirs Insurance Nigeria. Only 1 insurer may be shown.
              </div>
              <div>
                <label className="label">Device Type</label>
                <select {...register('device_type')} className="select">
                  <option value="smartphone">Smartphone</option>
                  <option value="laptop">Laptop / Computer</option>
                  <option value="tablet">Tablet</option>
                  <option value="smartwatch">Smartwatch</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Make</label>
                  <input {...register('device_make')} className="input" placeholder="Apple" />
                </div>
                <div>
                  <label className="label">Model</label>
                  <input {...register('device_model')} className="input" placeholder="iPhone 15 Pro" />
                </div>
                <div>
                  <label className="label">Current Replacement Value (₦) *</label>
                  <input {...register('device_sum_insured', { required: true })} className="input" placeholder="1,200,000" />
                </div>
                <div>
                  <label className="label">Serial / IMEI</label>
                  <input {...register('serial_number')} className="input" placeholder="IMEI or serial" />
                </div>
              </div>
              <div>
                <label className="label">Coverage Type</label>
                <select {...register('device_coverage')} className="select">
                  <option value="accidental_and_theft">Accidental Damage + Theft (recommended)</option>
                  <option value="accidental_only">Accidental Damage Only</option>
                  <option value="theft_only">Theft Only</option>
                  <option value="extended_warranty">Extended Warranty</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">← Back</button>
            <button
              type="submit"
              disabled={generating || (selectedProduct === 'auto' && !selectedCoverage)}
              className="btn-primary flex-1"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
                    <path d="M4 12a8 8 0 018-8" strokeLinecap="round"/>
                  </svg>
                  Fetching quotes from insurers…
                </span>
              ) : '⚡ Generate Quotes'}
            </button>
          </div>
        </form>
      )}

      {/* ── Step 4: Quote Results ── */}
      {step === 4 && quoteData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">
                {quoteData.quotes_returned?.length} Quotes Found
              </h2>
              <p className="text-sm text-slate-500">
                For <strong>{selectedClient?.full_name}</strong> · Sorted by lowest premium
              </p>
            </div>
            <button onClick={() => setStep(3)} className="btn-secondary text-xs">← Modify</button>
          </div>

          {quoteData.quotes_returned?.length === 0 && (
            <div className="card p-8 text-center text-slate-400">
              No insurers available for this product configuration.
            </div>
          )}

          {quoteData.quotes_returned?.map((q, idx) => (
            <div key={idx} className={`card p-5 transition-shadow hover:shadow-md ${idx === 0 ? 'ring-2 ring-brand-400' : ''}`}>
              {idx === 0 && <div className="mb-3"><span className="badge-green">🏆 Lowest Premium</span></div>}

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <p className="font-semibold text-slate-900 text-base">{q.insurer_name}</p>
                    <span className={q.source === 'api' ? 'badge-green' : 'badge-slate'}>
                      {q.source === 'api' ? '🔴 Live' : '📋 Manual'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{q.plan_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Coverage limit: <strong>₦{q.coverage_limit?.toLocaleString()}</strong>
                    {q.response_time_ms ? ` · ${q.response_time_ms}ms` : ''}
                  </p>

                  {q.key_benefits?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {q.key_benefits.map((b, i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✓ {b}</span>
                      ))}
                    </div>
                  )}
                  {q.top_exclusions?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {q.top_exclusions.slice(0, 3).map((e, i) => (
                        <span key={i} className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full">✗ {e}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sm:text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-slate-900">₦{q.annual_premium?.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mb-2">per annum</p>

                  <div className="bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 mb-3 sm:text-right">
                    <p className="text-[11px] text-slate-500">Your Commission</p>
                    <p className="text-sm font-bold text-brand-700">
                      {(q.commission_rate * 100).toFixed(0)}% = ₦{q.commission_amount?.toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => sendQuote(idx)}
                    disabled={sending === idx}
                    className={`w-full sm:w-auto ${idx === 0 ? 'btn-primary' : 'btn-secondary'} text-sm`}
                  >
                    {sending === idx ? 'Sending…' : 'Select & Send Quote →'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
