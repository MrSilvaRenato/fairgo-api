import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'

function LogoMark({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="var(--color-eucalyptus)" />
      <path d="M12 26c6-2 10-6 14-14-1 9-5 14-14 14Z" fill="var(--color-ochre-2)" opacity="0.95" />
      <path d="M12 26c6-2 10-6 14-14-1 9-5 14-14 14Z" fill="var(--color-paper)" opacity="0.9" transform="translate(-2,-2)" />
      <path d="M8 30h24" stroke="var(--color-paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

const INDUSTRIES = [
  'Automotive', 'Banking & Finance', 'Education', 'Energy & Utilities',
  'Food & Beverage', 'Government', 'Health & Medical', 'Insurance',
  'Internet & Technology', 'Real Estate', 'Retail', 'Telecommunications',
  'Transport & Logistics', 'Travel & Tourism', 'Other',
]

export default function CompanyRegisterPage() {
  const { user, token, fetchUser } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', abn: '', industry: '', description: '', website: '' })

  // Auth guard: must be logged in to register a company.
  // token===null means definitely not logged in.
  // token exists but user===null means fetchUser still in flight — wait.
  useEffect(() => {
    if (token === null) {
      // Not logged in — send to step 1 (personal account creation)
      navigate('/register?role=business', { replace: true })
      return
    }
    if (user === null) return // token present, still loading user
    // Already has a company — skip straight to dashboard
    if (user.company) {
      navigate('/company/dashboard', { replace: true })
    }
  }, [user, token, navigate])
  const [abnData, setAbnData] = useState(null)
  const [abnError, setAbnError] = useState('')
  const [abnLoading, setAbnLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const lookupAbn = async () => {
    const abn = form.abn.replace(/\s/g, '')
    if (abn.length !== 11) { setAbnError('ABN must be 11 digits.'); setAbnData(null); return }
    setAbnLoading(true); setAbnError(''); setAbnData(null)
    try {
      const res = await api.get(`/companies/abn/${abn}`)
      setAbnData(res.data)
      if (!form.name) setForm((f) => ({ ...f, name: res.data.name ?? '' }))
    } catch {
      setAbnError('ABN not found or invalid.')
    } finally {
      setAbnLoading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault(); setErrors({}); setLoading(true)
    try {
      await api.post('/companies/', form)
      await fetchUser()
      navigate('/company/dashboard')
    } catch (err) {
      if (err.response?.status === 422) {
        const body = err.response.data
        // Already registered — sync user and go to dashboard
        if (body.message === 'You have already registered a company.') {
          await fetchUser()
          navigate('/company/dashboard')
          return
        }
        setErrors(body.errors ?? {})
        if (body.message && !body.errors) setErrors({ _general: body.message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <LogoMark size={52} />
        </div>
        <h1 className="page-header">Register your business</h1>
        <p className="text-gray-500 text-sm mt-1">
          Claim your company profile and start managing customer complaints.
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-5">
          {/* ABN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ABN <span className="text-gray-400 font-normal">(Australian Business Number)</span>
            </label>
            <div className="flex gap-2">
              <input
                name="abn" value={form.abn} onChange={handle}
                placeholder="e.g. 51 824 753 556"
                className="input flex-1"
                required
              />
              <button
                type="button" onClick={lookupAbn} disabled={abnLoading}
                className="btn-secondary shrink-0 whitespace-nowrap"
              >
                {abnLoading ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Looking up…
                  </span>
                ) : 'Look up ABN'}
              </button>
            </div>
            {abnError && <p className="text-red-500 text-xs mt-1.5">{abnError}</p>}
            {errors.abn && <p className="text-red-500 text-xs mt-1.5">{errors.abn[0]}</p>}
            {abnData && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800 text-sm">
                    {abnData.name ?? 'ABN verified'} · <span className="font-normal">Status: {abnData.status}</span>
                  </p>
                  <p className="text-green-700 text-xs mt-0.5">
                    {[abnData.type, abnData.state && abnData.postcode ? `${abnData.state} ${abnData.postcode}` : (abnData.state || abnData.postcode)].filter(Boolean).join(' · ')}
                    {' · '}Verified against the Australian Business Register
                  </p>
                </div>
              </div>
            )}
          </div>

          <Field label="Business name" error={errors.name?.[0]}>
            <input name="name" value={form.name} onChange={handle}
              placeholder="Your company name" className="input" required />
          </Field>

          <Field label="Industry" error={errors.industry?.[0]}>
            <select name="industry" value={form.industry} onChange={handle} className="input">
              <option value="">Select an industry…</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>

          <Field label="Website" error={errors.website?.[0]} hint="Optional — used to display your logo automatically">
            <input name="website" value={form.website} onChange={handle}
              placeholder="e.g. yourcompany.com.au"
              className="input" />
          </Field>

          <Field label="Short description" error={errors.description?.[0]}
            hint="Optional — tell customers what your business does">
            <textarea name="description" value={form.description} onChange={handle}
              rows={3} placeholder="e.g. We provide broadband and mobile services across Australia."
              className="input resize-none" />
          </Field>

          {errors._general && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {errors._general}
            </div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Registering…
                </span>
              ) : 'Register company'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              By registering, you agree to respond to complaints in good faith.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  )
}
