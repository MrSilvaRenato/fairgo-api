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

const PROOF_TYPES = [
  { value: 'asic_extract',          label: 'ASIC Extract' },
  { value: 'business_card',         label: 'Business Card' },
  { value: 'employment_contract',   label: 'Employment Contract' },
  { value: 'director_certificate',  label: 'Director Certificate' },
  { value: 'other',                 label: 'Other' },
]

export default function CompanyRegisterPage() {
  const { user, token } = useAuthStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    abn: '',
    industry: '',
    website: '',
    claimant_name: '',
    claimant_email: '',
    claimant_position: '',
    claimant_phone: '',
    proof_type: '',
    message: '',
  })
  const [proofFile, setProofFile]   = useState(null)
  const [abnData, setAbnData]       = useState(null)
  const [abnError, setAbnError]     = useState('')
  const [abnLoading, setAbnLoading] = useState(false)
  const [errors, setErrors]         = useState({})
  const [loading, setLoading]       = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  useEffect(() => {
    if (token === null) {
      navigate('/register?role=business', { replace: true })
      return
    }
    if (user === null) return
    if (user.company) {
      navigate('/company/dashboard', { replace: true })
    }
  }, [user, token, navigate])

  // Pre-fill claimant details from the logged-in user
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        claimant_name:  f.claimant_name  || user.name  || '',
        claimant_email: f.claimant_email || user.email || '',
      }))
    }
  }, [user])

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const lookupAbn = async () => {
    const abn = form.abn.replace(/\s/g, '')
    if (abn.length !== 11) { setAbnError('ABN must be 11 digits.'); setAbnData(null); return }
    setAbnLoading(true); setAbnError(''); setAbnData(null)
    try {
      const res = await api.get(`/companies/abn/${abn}`)
      setAbnData(res.data)
    } catch {
      setAbnError('ABN not found or invalid.')
    } finally {
      setAbnLoading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault(); setErrors({}); setLoading(true)

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
    if (proofFile) fd.append('proof_document', proofFile)

    try {
      await api.post('/companies/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSubmitted(true)
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors({ _general: err.response.data.message ?? 'You already have a pending application for this ABN.' })
      } else if (err.response?.status === 422) {
        const body = err.response.data
        setErrors(body.errors ?? (body.message ? { _general: body.message } : {}))
      } else {
        setErrors({ _general: 'Something went wrong. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <LogoMark size={52} />
          </div>
          <h1 className="page-header">Application submitted</h1>
        </div>
        <div className="card p-8">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">We've received your application</h2>
          <p className="text-gray-600 text-sm mb-6">
            Our team will review your details within <strong>2 business days</strong> and notify you by email once your business profile is approved.
          </p>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <LogoMark size={52} />
        </div>
        <h1 className="page-header">Register your business</h1>
        <p className="text-gray-500 text-sm mt-1">
          Claim your company profile and start managing customer feedback. Our team reviews every application before granting access.
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

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Your details</p>

            <div className="space-y-4">
              <Field label="Full name" error={errors.claimant_name?.[0]}>
                <input name="claimant_name" value={form.claimant_name} onChange={handle}
                  placeholder="Your full name" className="input" required />
              </Field>

              <Field label="Work email" error={errors.claimant_email?.[0]}>
                <input name="claimant_email" type="email" value={form.claimant_email} onChange={handle}
                  placeholder="you@company.com.au" className="input" required />
              </Field>

              <Field label="Position / role" error={errors.claimant_position?.[0]}>
                <input name="claimant_position" value={form.claimant_position} onChange={handle}
                  placeholder="e.g. Director, Manager, Owner" className="input" required />
              </Field>

              <Field label="Phone number" error={errors.claimant_phone?.[0]}>
                <input name="claimant_phone" type="tel" value={form.claimant_phone} onChange={handle}
                  placeholder="e.g. 04XX XXX XXX" className="input" required />
              </Field>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Business details</p>

            <div className="space-y-4">
              <Field label="Industry" error={errors.industry?.[0]}>
                <select name="industry" value={form.industry} onChange={handle} className="input">
                  <option value="">Select an industry…</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>

              <Field label="Website" error={errors.website?.[0]} hint="Optional">
                <input name="website" value={form.website} onChange={handle}
                  placeholder="e.g. yourcompany.com.au" className="input" />
              </Field>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Proof of authority</p>

            <div className="space-y-4">
              <Field label="Proof type" error={errors.proof_type?.[0]}>
                <select name="proof_type" value={form.proof_type} onChange={handle} className="input" required>
                  <option value="">Select proof type…</option>
                  {PROOF_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>

              <Field label="Supporting document" error={errors.proof_document?.[0]} hint="Optional — PDF, JPG, PNG, DOCX up to 5 MB">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  className="input py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </Field>

              <Field label="Message to our team" error={errors.message?.[0]}
                hint="Min 30 characters — explain your connection to this business">
                <textarea name="message" value={form.message} onChange={handle}
                  rows={4}
                  placeholder="e.g. I am the sole director of this company and registered it with ASIC in 2018…"
                  className="input resize-none" required />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.message.length} / 1000</p>
              </Field>
            </div>
          </div>

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
                  Submitting application…
                </span>
              ) : 'Submit application'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Our team reviews all applications within 2 business days.
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
