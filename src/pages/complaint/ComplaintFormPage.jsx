import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import PhoneVerification from '../../components/PhoneVerification'
import EmailVerifyBanner from '../../components/EmailVerifyBanner'

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
    incident_date: '', reference_number: '', amount_involved: '',
    contact_attempted: false,
  })
  const [companySearch, setCompanySearch]   = useState('')
  const [companies, setCompanies]           = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [showUnregistered, setShowUnregistered] = useState(false)
  const [unregName, setUnregName]           = useState('')
  const [unregAbn, setUnregAbn]             = useState('')
  const [abnResult, setAbnResult]           = useState(null)   // { valid, entity_name, error }
  const [abnChecking, setAbnChecking]       = useState(false)
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
    setShowUnregistered(false)
    setAbnResult(null)
    if (q.length < 2) { setCompanies([]); return }
    try {
      const res = await api.get('/complaints/company-search', { params: { q } })
      setCompanies(res.data)
    } catch { setCompanies([]) }
  }

  const selectCompany = (company) => {
    setSelectedCompany(company)
    setForm((f) => ({ ...f, company_id: String(company.id), company_name: '', company_abn: '' }))
    setCompanies([])
    setCompanySearch(company.name)
    setShowUnregistered(false)
    setAbnResult(null)
  }

  const openUnregistered = () => {
    setShowUnregistered(true)
    setUnregName(companySearch)
    setCompanies([])
    setSelectedCompany(null)
    setForm((f) => ({ ...f, company_id: '' }))
  }

  const checkAbn = async () => {
    const abn = unregAbn.replace(/\s+/g, '')
    if (abn.length < 11) { setAbnResult({ valid: false, error: 'ABN must be 11 digits.' }); return }
    setAbnChecking(true)
    setAbnResult(null)
    try {
      const res = await api.get(`/abn/check/${abn}`)
      setAbnResult(res.data)
      if (res.data.valid) {
        setForm((f) => ({ ...f, company_id: '', company_name: unregName, company_abn: abn }))
      } else {
        setForm((f) => ({ ...f, company_name: '', company_abn: '' }))
      }
    } catch {
      setAbnResult({ valid: false, error: 'ABN lookup service unavailable. Please try again.' })
    } finally {
      setAbnChecking(false)
    }
  }

  const [modAlert, setModAlert] = useState(null) // 'flagged' | 'edited' | null
  const [submittedId, setSubmittedId] = useState(null)

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
      const payload = { ...form }
      if (!payload.company_id && unregName && unregAbn) {
        payload.company_name = unregName
        payload.company_abn  = unregAbn.replace(/\s+/g, '')
        delete payload.company_id
      }
      const res = await api.post('/complaints/', payload)
      sessionStorage.removeItem(DRAFT_KEY)
      const status = res.data.moderation_status
      if (status === 'flagged' || status === 'edited') {
        setModAlert(status)
        setSubmittedId(res.data.id)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
    } finally {
      setLoading(false)
    }
  }

  /* ── Business account gate ── */
  if (user && user.role !== 'consumer') {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-3xl">🏢</span>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-[color:var(--color-ink)]">
              Business accounts can't file complaints
            </h2>
            <p className="text-sm text-[color:var(--color-muted)] mt-2 leading-relaxed">
              You're logged in as a <strong>business representative</strong>. Complaints can only be submitted
              by consumers using a personal account.
            </p>
          </div>
          <div className="text-left bg-[color:var(--color-paper-2)] rounded-xl p-4 text-sm text-[color:var(--color-ink-2)] space-y-1.5">
            <p>✅ To file a personal complaint, <strong>create a separate consumer account</strong> using a personal email address.</p>
            <p>✅ Your business dashboard remains unaffected.</p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <a href="/register" className="btn btn-primary justify-center">
              Create a consumer account
            </a>
            <a href="/company/dashboard" className="btn btn-secondary justify-center">
              Back to my business dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  /* ── Email not verified gate ── */
  if (user && !user.email_verified_at) {
    return <EmailUnverifiedGate />
  }

  /* ── Moderation hold screen ── */
  if (modAlert) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card p-8 text-center space-y-5">
          <div className="text-5xl">⏳</div>
          <div>
            <h2 className="font-display text-xl font-semibold text-[color:var(--color-ink)]">
              Your complaint is under review
            </h2>
            <p className="text-sm text-[color:var(--color-muted)] mt-1">Complaint #{submittedId}</p>
          </div>

          <div className="text-left px-4 py-4 rounded-2xl space-y-3 text-sm"
            style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)' }}>
            <p className="font-semibold text-[color:var(--color-ink)]">
              ⚠️ We have detected content that requires review before publishing.
            </p>
            <p className="text-[color:var(--color-ink-2)] leading-relaxed">
              {modAlert === 'flagged'
                ? 'Our system identified potential profanity, defamatory language, or content that may breach our community guidelines. Your complaint has been submitted but will not be visible publicly until a Aus Fair Go moderator reviews and approves it.'
                : 'Some content in your complaint was automatically edited to comply with our guidelines (e.g. offensive language was removed). Your complaint is pending final review before being published.'}
            </p>
            <div className="pt-1 border-t" style={{ borderColor: 'var(--color-line)' }}>
              <p className="text-[color:var(--color-muted)] text-xs leading-relaxed">
                <strong className="text-[color:var(--color-ink-2)]">What happens next:</strong> A Aus Fair Go moderator will review your complaint. If it complies with our{' '}
                <a href="/how-it-works" className="underline hover:text-[color:var(--color-eucalyptus)]">community guidelines</a>,
                it will be published and the company notified. If it breaches our policy, it will be removed and you will be notified.
                Most reviews are completed within 24 hours.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border transition"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-2)' }}>
              View in my dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-[color:var(--color-paper)]"
              style={{ background: 'var(--color-eucalyptus)' }}>
              Go to my dashboard
            </button>
          </div>
        </div>
      </div>
    )
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
            <label className="block text-sm font-medium text-[color:var(--color-ink)] mb-1.5">
              Company <span className="text-[color:var(--color-clay)]">*</span>
            </label>

            {!showUnregistered ? (
              <>
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={companySearch}
                    onChange={(e) => searchCompanies(e.target.value)}
                    placeholder="Search by company name…"
                    className="input pl-9"
                  />
                  {companies.length > 0 && (
                    <ul className="absolute z-10 w-full bg-[color:var(--color-card)] border hairline rounded-xl shadow-xl mt-1 overflow-hidden">
                      {companies.map((c) => (
                        <li key={c.id} onClick={() => selectCompany(c)}
                          className="px-4 py-3 cursor-pointer hover:bg-[color:var(--color-paper-2)] transition flex items-center justify-between">
                          <span className="font-medium text-sm text-[color:var(--color-ink)]">{c.name}</span>
                          {c.industry && <span className="text-xs text-[color:var(--color-muted)] capitalize">{c.industry}</span>}
                        </li>
                      ))}
                      {/* Not found option at the bottom of the dropdown */}
                      <li
                        onClick={openUnregistered}
                        className="px-4 py-3 cursor-pointer border-t hairline hover:bg-[#FDF6E8] transition flex items-center gap-2"
                        style={{ borderColor: 'var(--color-ochre)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-ochre)' }}>
                          🏢 "{companySearch}" is not listed — file anyway
                        </span>
                      </li>
                    </ul>
                  )}
                  {/* Show not-found prompt when search has no results */}
                  {companySearch.length >= 2 && companies.length === 0 && !selectedCompany && (
                    <div className="mt-2 rounded-xl border p-3 flex items-center justify-between gap-3"
                      style={{ borderColor: 'var(--color-ochre)', background: '#FDF6E8' }}>
                      <p className="text-sm text-[color:var(--color-ink-2)]">
                        <span className="font-medium text-[color:var(--color-ink)]">"{companySearch}"</span> not found in our database.
                      </p>
                      <button type="button" onClick={openUnregistered}
                        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                        style={{ background: 'var(--color-ochre)', color: 'var(--color-ink)' }}>
                        File anyway
                      </button>
                    </div>
                  )}
                </div>
                {selectedCompany && (
                  <div className="mt-2 flex items-center gap-2 text-sm px-3 py-2 rounded-xl"
                    style={{ color: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)' }}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">{selectedCompany.name}</span> selected
                  </div>
                )}
              </>
            ) : (
              /* ── Unregistered company panel ── */
              <div className="rounded-2xl border p-4 space-y-4"
                style={{ borderColor: 'var(--color-ochre)', background: '#FDF6E8' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                    🏢 Company not in our database
                  </p>
                  <button type="button" onClick={() => { setShowUnregistered(false); setAbnResult(null); setForm(f => ({ ...f, company_id: '', company_name: '', company_abn: '' })) }}
                    className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition">
                    ← Back to search
                  </button>
                </div>
                <p className="text-xs text-[color:var(--color-ink-2)] leading-relaxed">
                  Please provide the company's name and ABN so we can verify they are a registered Australian business before your complaint is filed.
                </p>

                {/* Company name */}
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--color-ink)] mb-1">
                    Company name <span className="text-[color:var(--color-clay)]">*</span>
                  </label>
                  <input
                    value={unregName}
                    onChange={(e) => { setUnregName(e.target.value); setAbnResult(null); setForm(f => ({ ...f, company_name: '', company_abn: '' })) }}
                    placeholder="e.g. Acme Pty Ltd"
                    className="input text-sm"
                  />
                </div>

                {/* ABN + check button */}
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--color-ink)] mb-1">
                    ABN (Australian Business Number) <span className="text-[color:var(--color-clay)]">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={unregAbn}
                      onChange={(e) => { setUnregAbn(e.target.value); setAbnResult(null); setForm(f => ({ ...f, company_name: '', company_abn: '' })) }}
                      placeholder="e.g. 51 824 753 556"
                      className="input text-sm flex-1"
                      maxLength={14}
                    />
                    <button
                      type="button"
                      onClick={checkAbn}
                      disabled={abnChecking || unregAbn.replace(/\s+/g, '').length < 11}
                      className="btn btn-secondary shrink-0 text-sm">
                      {abnChecking ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Checking…
                        </span>
                      ) : 'Verify ABN'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[color:var(--color-muted)] mt-1">
                    Find an ABN at <a href="https://abr.business.gov.au" target="_blank" rel="noopener noreferrer" className="underline">abr.business.gov.au</a>
                  </p>
                </div>

                {/* ABN result */}
                {abnResult && (
                  abnResult.valid ? (
                    <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
                      style={{ background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}>
                      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <span className="font-semibold">ABN verified.</span>
                        {abnResult.entity_name && !abnResult.stub && (
                          <span className="ml-1 text-[color:var(--color-ink-2)]">Registered as: <strong className="text-[color:var(--color-ink)]">{abnResult.entity_name}</strong></span>
                        )}
                        <p className="text-xs mt-0.5 text-[color:var(--color-ink-2)]">
                          Your complaint will be filed and Aus Fair Go will be notified to add this company to the database.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
                      style={{ background: 'var(--color-clay-soft)', color: 'var(--color-clay)' }}>
                      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <div>
                        <span className="font-semibold">ABN of this company is wrong.</span>
                        <p className="text-xs mt-0.5">
                          {abnResult.error ?? 'This ABN could not be verified against the Australian Business Register. Please check the number and try again.'}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {errors.company_id && <p className="text-[color:var(--color-clay)] text-xs mt-1.5">{errors.company_id[0]}</p>}
            {errors.company_abn && <p className="text-[color:var(--color-clay)] text-xs mt-1.5">{errors.company_abn[0]}</p>}
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

          {/* ── Evidence & details ───────────────────────────────── */}
          <div className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-2)' }}>
            <div>
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">🔎 Evidence &amp; Details</p>
              <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                Helps verify the complaint and speeds up resolution. The more detail you provide, the more credible your case.
              </p>
            </div>

            {/* Incident date + reference number */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Date of incident *" error={errors.incident_date?.[0]}>
                <input
                  type="date"
                  value={form.incident_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                  className="input"
                  required
                />
              </Field>
              <Field
                label="Reference / Order number"
                hint="Optional"
                error={errors.reference_number?.[0]}
              >
                <input
                  type="text"
                  value={form.reference_number}
                  onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                  placeholder="e.g. ORD-12345, INV-0089, Case #77"
                  className="input"
                  maxLength={120}
                />
              </Field>
            </div>

            {/* Amount involved */}
            <Field
              label="Amount involved (AUD)"
              hint="Optional — leave blank if not financial"
              error={errors.amount_involved?.[0]}
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[color:var(--color-muted)] font-medium select-none">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount_involved}
                  onChange={(e) => setForm({ ...form, amount_involved: e.target.value })}
                  placeholder="0.00"
                  className="input pl-7"
                />
              </div>
            </Field>

            {/* Contact attempted */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" className="sr-only peer"
                  checked={form.contact_attempted}
                  onChange={(e) => setForm({ ...form, contact_attempted: e.target.checked })} />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition" />
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition peer-checked:translate-x-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-ink)]">
                  I have already attempted to resolve this with the company
                </p>
                <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                  e.g. called support, sent an email, submitted a refund request — and did not get a satisfactory response.
                </p>
              </div>
            </label>
          </div>

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
              disabled={loading || (!form.company_id && !(abnResult?.valid && unregName && unregAbn)) || !form.category || !form.incident_date}
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

function EmailUnverifiedGate() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-3xl">✉️</span>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-[color:var(--color-ink)]">
            Verify your email first
          </h2>
          <p className="text-sm text-[color:var(--color-ink-2)] mt-1">
            You need to verify your email address before filing a complaint.
          </p>
        </div>
        <EmailVerifyBanner />
        <a href="/dashboard" className="btn btn-secondary w-full justify-center">
          Back to dashboard
        </a>
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
