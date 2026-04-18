import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import PhoneVerification from '../../components/PhoneVerification'

const CATEGORIES = [
  { value: 'billing',  label: 'Billing issue',        icon: '💳' },
  { value: 'delivery', label: 'Delivery problem',      icon: '📦' },
  { value: 'service',  label: 'Poor customer service', icon: '🎧' },
  { value: 'refund',   label: 'Refund not received',   icon: '💰' },
  { value: 'fraud',    label: 'Fraud or scam',         icon: '🚨' },
  { value: 'other',    label: 'Other',                 icon: '📝' },
]

const DRAFT_KEY = 'fairgo_complaint_draft'

export default function ComplaintFormPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    company_id: searchParams.get('company_id') ?? '',
    title: '', description: '', expected_resolution: '',
    category: '', is_public: true,
  })
  const [companySearch, setCompanySearch]   = useState('')
  const [companies, setCompanies]           = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [errors, setErrors]                 = useState({})
  const [loading, setLoading]               = useState(false)
  const [draftRestored, setDraftRestored]   = useState(false)
  const [phoneVerified, setPhoneVerified]   = useState(!!user?.phone_verified_at)

  /* ── Restore draft saved before auth redirect ── */
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const draft = JSON.parse(raw)
      if (draft.form)            setForm(draft.form)
      if (draft.companySearch)   setCompanySearch(draft.companySearch)
      if (draft.selectedCompany) setSelectedCompany(draft.selectedCompany)
      setDraftRestored(true)
    } catch { /* ignore */ }
  }, [])

  const searchCompanies = async (q) => {
    setCompanySearch(q)
    if (q.length < 2) { setCompanies([]); return }
    try {
      const res = await api.get('/complaints/company-search', { params: { q } })
      setCompanies(res.data)
    } catch { setCompanies([]) }
  }

  const selectCompany = (company) => {
    setSelectedCompany(company)
    setForm((f) => ({ ...f, company_id: String(company.id) }))
    setCompanies([])
    setCompanySearch(company.name)
  }

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})

    /* Guest — save draft and redirect to register */
    if (!user) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, companySearch, selectedCompany }))
      navigate('/register?next=/complaints/new')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/complaints/', form)
      sessionStorage.removeItem(DRAFT_KEY)
      navigate(`/complaints/${res.data.id}`)
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="page-header">Submit a complaint</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your complaint will be publicly visible and the company will be notified.
        </p>
      </div>

      {/* Draft restored banner */}
      {draftRestored && (
        <div className="mb-5 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm text-green-800 font-medium">
            Your complaint details have been restored — just hit Submit to send it.
          </p>
        </div>
      )}

      <div className="card p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-6">

          {/* Company search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={companySearch}
                onChange={(e) => searchCompanies(e.target.value)}
                placeholder="Search by company name…"
                className="input pl-9"
                required={!form.company_id}
              />
              {companies.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-100 rounded-xl shadow-xl mt-1 overflow-hidden">
                  {companies.map((c) => (
                    <li key={c.id} onClick={() => selectCompany(c)}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900">{c.name}</span>
                      {c.industry && <span className="text-xs text-gray-400 capitalize">{c.industry}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedCompany && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{selectedCompany.name}</span> selected
              </div>
            )}
            {errors.company_id && <p className="text-red-500 text-xs mt-1.5">{errors.company_id[0]}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value} type="button"
                  onClick={() => setForm({ ...form, category: c.value })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition text-left ${
                    form.category === c.value
                      ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span className="leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
            {errors.category && <p className="text-red-500 text-xs mt-1.5">{errors.category[0]}</p>}
          </div>

          <Field label="Complaint title" error={errors.title?.[0]}>
            <input name="title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief summary of your complaint"
              className="input" required />
          </Field>

          <Field label="Describe your complaint" error={errors.description?.[0]}
            hint={`${form.description.length}/5000`}>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              placeholder="Provide full details — what happened, when, and what you have already tried…"
              className="input resize-none"
              required maxLength={5000}
            />
          </Field>

          <Field label="What would resolve this for you?" hint="Optional"
            error={errors.expected_resolution?.[0]}>
            <textarea
              value={form.expected_resolution}
              onChange={(e) => setForm({ ...form, expected_resolution: e.target.value })}
              rows={2}
              placeholder="e.g. Full refund, replacement, formal apology…"
              className="input resize-none"
            />
          </Field>

          {/* Visibility toggle */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input type="checkbox" className="sr-only peer"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition peer-checked:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Make this complaint public</p>
              <p className="text-xs text-gray-400 mt-0.5">Public complaints are visible to everyone and affect the company's score.</p>
            </div>
          </label>

          {/* Guest notice */}
          {!user && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs text-amber-800 leading-relaxed">
                You'll be asked to <span className="font-semibold">create a free account</span> before submitting — your complaint details will be saved automatically.
              </p>
            </div>
          )}

          {/* Phone verification gate — disabled locally, re-enable for production */}
          {/* {user && !phoneVerified && (
            <PhoneVerification
              compact
              onVerified={() => setPhoneVerified(true)}
            />
          )} */}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !form.company_id || !form.category}
              className="btn-primary w-full justify-center flex">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Submitting…
                </span>
              ) : user ? 'Submit complaint' : 'Continue to create account →'}
            </button>
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
