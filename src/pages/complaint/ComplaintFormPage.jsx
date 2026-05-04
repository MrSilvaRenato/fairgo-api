import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
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
const TOTAL_STEPS = 3

/* ── Spinner ── */
function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} className="animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

/* ── Company avatar (uploaded logo → favicon → initials) ── */
function CompanyAvatar({ company, size = 40 }) {
  const [err, setErr] = useState(false)
  const initial = (company.name || '?')[0].toUpperCase()

  const uploadedLogo = company.logo_url?.startsWith('/storage/') ? company.logo_url : null
  const faviconUrl = company.website
    ? `https://www.google.com/s2/favicons?sz=64&domain=${company.website.replace(/^https?:\/\//, '')}`
    : null
  const src = uploadedLogo || faviconUrl || company.logo_url || null

  if (src && !err) {
    return (
      <img
        key={src}
        src={src}
        alt=""
        width={size} height={size}
        onError={() => setErr(true)}
        className="rounded-xl object-contain bg-white border border-[color:var(--color-line)]"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div className="rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
      style={{ width: size, height: size, background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}>
      {initial}
    </div>
  )
}

export default function ComplaintFormPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()

  /* ── Step state ── */
  const [step, setStep] = useState(1)

  /* ── Form data ── */
  const [form, setForm] = useState({
    company_id: searchParams.get('company_id') ?? '',
    title: '', description: '', expected_resolution: '',
    category: '', is_public: true,
    incident_date: '', reference_number: '', amount_involved: '',
    contact_attempted: false, phone: '',
  })

  /* ── Company search ── */
  const [companySearch, setCompanySearch]       = useState('')
  const [companies, setCompanies]               = useState([])   // local DB results
  const [abnResults, setAbnResults]             = useState([])   // ABN lookup results
  const [selectedCompany, setSelectedCompany]   = useState(null) // existing DB company
  const [selectedAbnResult, setSelectedAbnResult] = useState(null) // ABR lookup selection
  const [searchLoading, setSearchLoading]       = useState(false)

  /* ── Attachments ── */
  const [attachments, setAttachments] = useState([]) // File[]
  const fileInputRef = useRef(null)

  /* ── Submit state ── */
  const [errors, setErrors]       = useState({})
  const [loading, setLoading]     = useState(false)
  const [modAlert, setModAlert]   = useState(null)
  const [submittedId, setSubmittedId] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [draftRestored, setDraftRestored] = useState(false)

  /* ── Restore draft ── */
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const draft = JSON.parse(raw)
      if (draft.form)            setForm(draft.form)
      if (draft.companySearch)   setCompanySearch(draft.companySearch)
      if (draft.selectedCompany) { setSelectedCompany(draft.selectedCompany); setStep(2) }
      setDraftRestored(true)
    } catch { /* ignore */ }
  }, [])

  /* ── Pre-selected company from URL ── */
  useEffect(() => {
    if (!searchParams.get('company_id') || selectedCompany) return
    api.get(`/companies/${searchParams.get('company_id')}`).then(res => {
      setSelectedCompany(res.data)
      setCompanySearch(res.data.name)
    }).catch(() => {})
  }, [])

  /* ── Pre-filled company name from URL — just seed the search box ── */
  useEffect(() => {
    const name = searchParams.get('company_name')
    if (!name || selectedCompany) return
    setCompanySearch(name)
  }, [])

  /* ── Unified company search: local DB + ABN lookup ── */
  const searchTimeout = useRef(null)
  const handleCompanySearch = (q) => {
    setCompanySearch(q)
    setSelectedCompany(null)
    setSelectedAbnResult(null)
    setForm(f => ({ ...f, company_id: '', company_name: '', company_abn: '' }))
    clearTimeout(searchTimeout.current)
    if (q.length < 2) { setCompanies([]); setAbnResults([]); return }
    setSearchLoading(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const [dbRes, abnRes] = await Promise.allSettled([
          api.get('/complaints/company-search', { params: { q } }),
          api.get('/abn/search', { params: { q } }),
        ])
        setCompanies(dbRes.status === 'fulfilled' ? dbRes.value.data : [])
        const abnData = abnRes.status === 'fulfilled' ? abnRes.value.data : null
        // Show ABN-lookup results even in stub/dev mode (ABN was checksum-verified)
        // Suppress name-search stub results (they're always empty in dev mode anyway)
        const showAbn = abnData && (abnData.source === 'abn' || !abnData.stub)
        setAbnResults(showAbn ? (abnData.results ?? []) : [])
      } finally { setSearchLoading(false) }
    }, 300)
  }

  const selectCompany = (company) => {
    setSelectedCompany(company)
    setSelectedAbnResult(null)
    setForm(f => ({ ...f, company_id: String(company.id), company_name: '', company_abn: '' }))
    setCompanies([]); setAbnResults([])
    setCompanySearch(company.name)
  }

  const selectAbnResult = (result) => {
    setSelectedAbnResult(result)
    setSelectedCompany(null)
    setForm(f => ({ ...f, company_id: '', company_name: result.name, company_abn: result.abn }))
    setCompanies([]); setAbnResults([])
    const formattedAbn = result.abn.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')
    setCompanySearch(result.name || `ABN ${formattedAbn}`)
  }

  const clearSelection = () => {
    setSelectedCompany(null)
    setSelectedAbnResult(null)
    setCompanySearch('')
    setCompanies([]); setAbnResults([])
    setForm(f => ({ ...f, company_id: '', company_name: '', company_abn: '' }))
  }

  /* ── File attachments ── */
  const addFiles = (files) => {
    const valid = Array.from(files).filter(f =>
      f.size <= 10 * 1024 * 1024 && /image\/(jpeg|png|gif|webp)|application\/pdf/.test(f.type)
    )
    setAttachments(prev => [...prev, ...valid].slice(0, 5))
  }
  const removeAttachment = (i) => setAttachments(prev => prev.filter((_, idx) => idx !== i))

  /* ── Step validation ── */
  const step1Valid = form.company_id || selectedAbnResult
  const step2Valid = form.category && form.description.trim().length >= 20

  /* ── Navigation ── */
  const goNext = () => {
    setErrors({})
    // Pre-fill title from first sentence of description when moving to step 3
    if (step === 2 && !form.title.trim()) {
      const suggested = form.description.trim().split(/[.!?\n]/)[0].slice(0, 100).trim()
      if (suggested) setForm(f => ({ ...f, title: suggested }))
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }
  const goBack = () => { setErrors({}); setStep(s => Math.max(s - 1, 1)) }

  /* ── Submit ── */
  const submit = async () => {
    setErrors({})

    if (!user) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, companySearch, selectedCompany }))
      navigate('/register?next=/complaints/new')
      return
    }

    setLoading(true)
    try {
      const fields = { ...form }
      // company_name and company_abn are already set in form state by selectAbnResult()

      let payload, headers = {}
      if (attachments.length > 0) {
        payload = new FormData()
        Object.entries(fields).forEach(([k, v]) => {
          if (v === '' || v === null || v === undefined) return
          if (typeof v === 'boolean') payload.append(k, v ? '1' : '0')
          else payload.append(k, v)
        })
        attachments.forEach(f => payload.append('attachments[]', f))
        headers['Content-Type'] = 'multipart/form-data'
      } else {
        // No files — send clean JSON (booleans stay as booleans)
        payload = {}
        Object.entries(fields).forEach(([k, v]) => {
          if (v !== '' && v !== null && v !== undefined) payload[k] = v
        })
      }

      const res = await api.post('/complaints/', payload, { headers })
      sessionStorage.removeItem(DRAFT_KEY)
   const status = res.data.moderation_status

if (res.data.company_under_review) {
  setSuccessMessage(res.data.message)
  setSubmittedId(res.data.id)
} else if (status === 'flagged' || status === 'edited') {
  setModAlert(status)
  setSubmittedId(res.data.id)
} else {
  navigate('/dashboard')
}
    } catch (err) {
      if (err.response?.status === 429) {
        setErrors({ _limit: true })
      } else if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
        const e = err.response.data.errors ?? {}
        if (e.company_id || e.company_abn) setStep(1)
        else if (e.category || e.description) setStep(2)
      } else {
        setErrors({ _general: err.response?.data?.message ?? 'Something went wrong. Please try again.' })
      }
    } finally { setLoading(false) }
  }

  /* ── Gates ── */
  if (user && user.role !== 'consumer') {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card p-8 text-center space-y-4">
          <span className="text-4xl">🏢</span>
          <h2 className="font-display text-xl font-semibold">Business accounts can't file complaints</h2>
          <p className="text-sm text-[color:var(--color-muted)]">
            You're logged in as a business representative. Use a personal consumer account to file complaints.
          </p>
          <a href="/register" className="btn-primary w-full justify-center flex">Create a consumer account</a>
          <a href="/company/dashboard" className="btn-secondary w-full justify-center flex">Back to dashboard</a>
        </div>
      </div>
    )
  }

  if (user && !user.email_verified_at) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card p-8 text-center space-y-4">
          <span className="text-4xl">✉️</span>
          <h2 className="font-display text-xl font-semibold">Verify your email first</h2>
          <EmailVerifyBanner />
          <a href="/dashboard" className="btn-secondary w-full justify-center flex">Back to dashboard</a>
        </div>
      </div>
    )
  }

  if (errors._limit) {
    // Calculate time until midnight reset
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const hoursLeft = Math.ceil((midnight - now) / 3600000)

    return (
      <div className="max-w-xl mx-auto">
        <div className="card p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-3xl"
            style={{ background: 'var(--color-eucalyptus-3)' }}>
            🛡️
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-[color:var(--color-ink)]">
              Daily complaint limit reached
            </h2>
            <p className="text-sm text-[color:var(--color-muted)] mt-1">
              Resets in approximately <strong>{hoursLeft} hour{hoursLeft !== 1 ? 's' : ''}</strong>
            </p>
          </div>

          <div className="text-left rounded-2xl p-5 space-y-3 text-sm"
            style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)' }}>
            <p className="font-semibold text-[color:var(--color-ink)]">Why is there a daily limit?</p>
            <p className="text-[color:var(--color-ink-2)] leading-relaxed">
              Aus Fair Go uses AI moderation to verify complaints are genuine before they're published.
              To protect businesses from coordinated spam and ensure every complaint receives proper
              attention, we limit submissions to <strong>5 complaints per day</strong> per account.
            </p>
            <p className="text-[color:var(--color-ink-2)] leading-relaxed">
              Your limit resets automatically at midnight each day. If you have an urgent matter
              that can't wait, please contact us at{' '}
              <a href="mailto:support@ausfairgo.com.au" className="underline font-medium"
                style={{ color: 'var(--color-eucalyptus)' }}>
                support@ausfairgo.com.au
              </a>.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button onClick={() => navigate('/dashboard')} className="btn-primary w-full justify-center flex">
              View my complaints
            </button>
            <button onClick={() => setErrors({})} className="btn-secondary w-full justify-center flex">
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

if (successMessage) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-8 text-center space-y-5">
        <div className="text-5xl">🏢</div>
        <h2 className="font-display text-xl font-semibold">Company verification required</h2>
        <p className="text-sm text-[color:var(--color-muted)]">Complaint #{submittedId}</p>

        <div className="text-left px-4 py-4 rounded-2xl text-sm space-y-3"
          style={{ background: '#FDF6E8', border: '1px solid var(--color-ochre)' }}>
          <p className="font-semibold">Your complaint is saved but not public yet</p>
          <p className="text-[color:var(--color-ink-2)] leading-relaxed">
            {successMessage}
          </p>
        </div>

        <button onClick={() => navigate('/dashboard')} className="btn-primary w-full justify-center flex">
          View in my dashboard
        </button>
      </div>
    </div>
  )
}
    
  if (modAlert) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card p-8 text-center space-y-5">
          <div className="text-5xl">⏳</div>
          <h2 className="font-display text-xl font-semibold">Your complaint is under review</h2>
          <p className="text-sm text-[color:var(--color-muted)]">Complaint #{submittedId}</p>
          <div className="text-left px-4 py-4 rounded-2xl text-sm space-y-3"
            style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)' }}>
            <p className="font-semibold">⚠️ Content flagged for review</p>
            <p className="text-[color:var(--color-ink-2)] leading-relaxed">
              {modAlert === 'flagged'
                ? 'Our system detected content that may breach community guidelines. Your complaint is held for moderator review before publishing.'
                : 'Some content was auto-edited to comply with guidelines. Pending final review before publishing.'}
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full justify-center flex">
            View in my dashboard
          </button>
        </div>
      </div>
    )
  }

  /* ── Progress bar ── */
  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Top bar: back + progress + step label ── */}
      <div className="flex items-center gap-4 mb-8">
        {step > 1 ? (
          <button onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)] transition shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        ) : (
          <div className="shrink-0 w-[52px]" />
        )}

        <div className="flex-1">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-line)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--color-eucalyptus)' }} />
          </div>
        </div>

        <span className="text-xs text-[color:var(--color-muted)] shrink-0 tabular-nums">
          Step {step} of {TOTAL_STEPS}
        </span>
      </div>

      {/* ── Draft restored banner ── */}
      {draftRestored && step === 1 && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'var(--color-eucalyptus-3)', border: '1px solid var(--color-eucalyptus)' }}>
          <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--color-eucalyptus)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--color-eucalyptus)' }}>
            Your complaint details were saved — pick up where you left off.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 1 — Which company?
      ════════════════════════════════════════ */}
      {step === 1 && (
        <div className="card p-6 sm:p-10">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🏢</div>
            <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink)]">
              Which company are you complaining about?
            </h1>
            <p className="text-sm text-[color:var(--color-muted)] mt-2">
              Search by company name or ABN — results pulled live from the Australian Business Register.
            </p>
          </div>

          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]">
                {searchLoading
                  ? <Spinner size={16} />
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                }
              </div>
              <input
                autoFocus
                value={companySearch}
                onChange={e => handleCompanySearch(e.target.value)}
                placeholder="Search by company name or ABN…"
                className="input pl-10 text-base py-3"
              />

              {/* Dropdown — local DB + ABN lookup results */}
              {(companies.length > 0 || abnResults.length > 0) && !selectedCompany && !selectedAbnResult && (
                <ul className="absolute z-20 w-full mt-1 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-line)' }}>

                  {/* Section: On Aus Fair Go */}
                  {companies.length > 0 && (
                    <>
                      <li className="px-4 pt-3 pb-1">
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--color-muted)]">
                          On Aus Fair Go
                        </span>
                      </li>
                      {companies.map((c) => (
                        <li key={c.id} onClick={() => selectCompany(c)}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer transition hover:bg-[color:var(--color-paper-2)]">
                          <CompanyAvatar company={c} size={36} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[color:var(--color-ink)] truncate">{c.name}</p>
                            {c.industry && <p className="text-xs text-[color:var(--color-muted)] truncate">{c.industry}</p>}
                          </div>
                          <svg className="w-4 h-4 text-[color:var(--color-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </li>
                      ))}
                    </>
                  )}

                  {/* Section: Australian Business Register */}
                  {abnResults.length > 0 && (
                    <>
                      <li className={`px-4 pt-3 pb-1 ${companies.length > 0 ? 'border-t' : ''}`}
                        style={{ borderColor: 'var(--color-line)' }}>
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--color-muted)]">
                          Australian Business Register
                        </span>
                      </li>
                      {abnResults.map((r) => {
                        const formattedAbn = r.abn.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')
                        const displayName = r.name || `ABN ${formattedAbn}`
                        return (
                          <li key={r.abn} onClick={() => selectAbnResult(r)}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition hover:bg-[color:var(--color-paper-2)]">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-bold"
                              style={{ background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}>
                              {displayName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-[color:var(--color-ink)] truncate">{displayName}</p>
                              <p className="text-xs text-[color:var(--color-muted)]">
                                {r.name
                                  ? <>ABN {formattedAbn}{r.state && ` · ${r.state}`}</>
                                  : 'ABN verified · company name will be confirmed by admin'}
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-[color:var(--color-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </li>
                        )
                      })}
                    </>
                  )}
                </ul>
              )}
            </div>

            {/* No results at all */}
            {companySearch.length >= 2 && companies.length === 0 && abnResults.length === 0
              && !selectedCompany && !selectedAbnResult && !searchLoading && (
              <div className="rounded-2xl px-4 py-3 text-sm text-center"
                style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)' }}>
                <p className="font-medium text-[color:var(--color-ink)]">No results found for "{companySearch}"</p>
                <p className="text-xs text-[color:var(--color-muted)] mt-1">
                  Try searching by the company's ABN number instead (e.g. 74 264 019 312).
                </p>
              </div>
            )}

            {/* Selected: existing DB company */}
            {selectedCompany && (
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'var(--color-eucalyptus-3)', border: '1px solid var(--color-eucalyptus)' }}>
                <CompanyAvatar company={selectedCompany} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-eucalyptus)' }}>{selectedCompany.name}</p>
                  {selectedCompany.industry && (
                    <p className="text-xs text-[color:var(--color-muted)]">{selectedCompany.industry}</p>
                  )}
                </div>
                <button onClick={clearSelection}
                  className="text-[color:var(--color-muted)] hover:text-[color:var(--color-clay)] transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Selected: ABN lookup result — name locked from ABR */}
            {selectedAbnResult && (
              <div className="rounded-2xl px-4 py-4 space-y-1"
                style={{ background: 'var(--color-eucalyptus-3)', border: '1px solid var(--color-eucalyptus)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-eucalyptus)' }}>
                      ✓ {selectedAbnResult.name || `ABN ${selectedAbnResult.abn.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')}`}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-2)' }}>
                      ABN {selectedAbnResult.abn.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')}
                      {selectedAbnResult.state && ` · ${selectedAbnResult.state}`}
                      {selectedAbnResult.postcode && ` ${selectedAbnResult.postcode}`}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                      Verified against the Australian Business Register
                    </p>
                  </div>
                  <button onClick={clearSelection}
                    className="text-[color:var(--color-muted)] hover:text-[color:var(--color-clay)] transition shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-[11px] rounded-lg px-2 py-1 inline-block"
                  style={{ background: '#FDF6E8', color: '#8A5A1F' }}>
                  🏢 This company will be added to Aus Fair Go after admin review
                </p>
              </div>
            )}

            {errors.company_id && <p className="text-[color:var(--color-clay)] text-xs">{errors.company_id[0]}</p>}
            {errors.company_abn && <p className="text-[color:var(--color-clay)] text-xs">{errors.company_abn[0]}</p>}
          </div>

          {/* CTA */}
          <div className="mt-8">
            <button
              onClick={goNext}
              disabled={!step1Valid}
              className="btn-primary w-full justify-center flex text-base py-3">
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 2 — What happened?
      ════════════════════════════════════════ */}
      {step === 2 && (
        <div className="card p-6 sm:p-10">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📣</div>
            <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink)]">
              What's your complaint about{selectedCompany ? ` ${selectedCompany.name}` : ''}?
            </h1>
            <p className="text-sm text-[color:var(--color-muted)] mt-2">
              Be specific — well-detailed complaints are resolved faster.
            </p>
          </div>

          <div className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-[color:var(--color-ink)] mb-2">
                Category <span className="text-[color:var(--color-clay)]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.value} type="button"
                    onClick={() => setForm(f => ({ ...f, category: c.value }))}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition text-left ${
                      form.category === c.value
                        ? 'font-semibold'
                        : 'hover:border-[color:var(--color-muted)]'
                    }`}
                    style={form.category === c.value
                      ? { borderColor: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }
                      : { borderColor: 'var(--color-line)', background: 'var(--color-card)', color: 'var(--color-ink-2)' }
                    }>
                    <span className="text-base">{c.icon}</span>
                    <span className="leading-tight">{c.label}</span>
                  </button>
                ))}
              </div>
              {errors.category && <p className="text-[color:var(--color-clay)] text-xs mt-1.5">{errors.category[0]}</p>}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="text-sm font-semibold text-[color:var(--color-ink)]">
                  Describe what happened <span className="text-[color:var(--color-clay)]">*</span>
                </label>
                <span className={`text-xs tabular-nums ${form.description.length >= 4800 ? 'text-[color:var(--color-clay)]' : 'text-[color:var(--color-muted)]'}`}>
                  {form.description.length}/5000
                </span>
              </div>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={6}
                placeholder="Tell us what happened — include dates, order numbers, what you tried, and the impact it had on you…"
                className="input resize-none"
                maxLength={5000}
              />
              {form.description.trim().length > 0 && form.description.trim().length < 20 && (
                <p className="text-[color:var(--color-ochre)] text-xs mt-1">Please provide a bit more detail (at least 20 characters).</p>
              )}
              {errors.description && <p className="text-[color:var(--color-clay)] text-xs mt-1.5">{errors.description[0]}</p>}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-semibold text-[color:var(--color-ink)] mb-2">
                Attachments <span className="text-xs font-normal text-[color:var(--color-muted)]">— optional, up to 5 files (images or PDF, max 10 MB each)</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {attachments.map((file, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl border overflow-hidden group"
                    style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-2)' }}>
                    {file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                        <svg className="w-7 h-7 text-[color:var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-[10px] text-[color:var(--color-muted)] truncate w-full text-center">{file.name}</span>
                      </div>
                    )}
                    <button onClick={() => removeAttachment(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      style={{ background: 'var(--color-clay)', color: '#fff' }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {attachments.length < 5 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition hover:border-[color:var(--color-eucalyptus)] hover:bg-[color:var(--color-eucalyptus-3)]"
                    style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[10px]">Add file</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef} type="file" multiple accept="image/*,.pdf"
                className="hidden"
                onChange={e => { addFiles(e.target.files); e.target.value = '' }}
              />
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'var(--color-eucalyptus-3)', border: '1px solid var(--color-eucalyptus)' }}>
              <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-eucalyptus)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-eucalyptus)' }}>
                  Your personal details are protected
                </p>
                <p className="text-xs mt-0.5 text-[color:var(--color-ink-2)]">
                  Your name and contact information are <strong>never shown publicly</strong>. Only the company will see them when responding to your complaint.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={goNext}
              disabled={!step2Valid}
              className="btn-primary w-full justify-center flex text-base py-3">
              Review my complaint →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 3 — Review & publish
      ════════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-5">

          {/* ── Complaint preview card ── */}
          <div className="card p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="text-3xl shrink-0">✅</div>
              <div>
                <h1 className="font-display text-xl font-semibold text-[color:var(--color-ink)]">
                  Review &amp; publish your complaint
                </h1>
                <p className="text-sm text-[color:var(--color-muted)] mt-0.5">
                  Check everything looks right before we notify {selectedCompany?.name ?? 'the company'}.
                </p>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--color-line)' }} />

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-[color:var(--color-ink)] mb-1.5">
                Complaint title <span className="text-[color:var(--color-clay)]">*</span>
                <span className="text-xs font-normal text-[color:var(--color-muted)] ml-2">— a short summary shown publicly</span>
              </label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Charged twice and no refund after 3 weeks"
                className="input"
                maxLength={150}
              />
              <p className="text-xs text-[color:var(--color-muted)] mt-1 text-right tabular-nums">{form.title.length}/150</p>
              {errors.title && <p className="text-[color:var(--color-clay)] text-xs mt-1">{errors.title[0]}</p>}
            </div>

            <hr style={{ borderColor: 'var(--color-line)' }} />

            {/* Company */}
            <div className="flex items-center gap-3">
              {selectedCompany && <CompanyAvatar company={selectedCompany} size={40} />}
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold text-[color:var(--color-muted)]">Company</p>
                <p className="font-semibold text-[color:var(--color-ink)]">
                  {selectedCompany?.name ?? selectedAbnResult?.name}
                </p>
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold text-[color:var(--color-muted)] mb-1">Category</p>
              <span className="badge badge-green text-xs">
                {CATEGORIES.find(c => c.value === form.category)?.icon}{' '}
                {CATEGORIES.find(c => c.value === form.category)?.label}
              </span>
            </div>

            {/* Description preview */}
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold text-[color:var(--color-muted)] mb-1">Complaint</p>
              <p className="text-sm text-[color:var(--color-ink-2)] leading-relaxed whitespace-pre-wrap line-clamp-5">
                {form.description}
              </p>
            </div>

            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold text-[color:var(--color-muted)] mb-2">Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg border overflow-hidden"
                      style={{ borderColor: 'var(--color-line)' }}>
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[color:var(--color-muted)]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Extra details card ── */}
          <div className="card p-6 sm:p-8 space-y-5">
            <p className="font-semibold text-[color:var(--color-ink)]">🔎 Additional details</p>
            <p className="text-xs text-[color:var(--color-muted)] -mt-3">
              More detail = stronger case. All optional except incident date.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Incident date */}
              <div>
                <label className="block text-xs font-semibold text-[color:var(--color-ink)] mb-1">
                  Date of incident <span className="text-[color:var(--color-clay)]">*</span>
                </label>
                <input type="date"
                  value={form.incident_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))}
                  className="input text-sm" required />
                {errors.incident_date && <p className="text-[color:var(--color-clay)] text-xs mt-1">{errors.incident_date[0]}</p>}
              </div>

              {/* Reference number */}
              <div>
                <label className="block text-xs font-semibold text-[color:var(--color-ink)] mb-1">
                  Reference / Order number <span className="text-xs font-normal text-[color:var(--color-muted)]">optional</span>
                </label>
                <input type="text"
                  value={form.reference_number}
                  onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
                  placeholder="e.g. ORD-12345"
                  className="input text-sm" maxLength={120} />
              </div>
            </div>

            {/* Amount involved */}
            <div>
              <label className="block text-xs font-semibold text-[color:var(--color-ink)] mb-1">
                Amount involved (AUD) <span className="text-xs font-normal text-[color:var(--color-muted)]">optional</span>
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[color:var(--color-muted)] font-medium select-none">$</span>
                <input type="number" min="0" step="0.01"
                  value={form.amount_involved}
                  onChange={e => setForm(f => ({ ...f, amount_involved: e.target.value }))}
                  placeholder="0.00" className="input pl-7 text-sm" />
              </div>
            </div>

            {/* Expected resolution */}
            <div>
              <label className="block text-xs font-semibold text-[color:var(--color-ink)] mb-1">
                What would resolve this for you? <span className="text-xs font-normal text-[color:var(--color-muted)]">optional</span>
              </label>
              <textarea
                value={form.expected_resolution}
                onChange={e => setForm(f => ({ ...f, expected_resolution: e.target.value }))}
                rows={2}
                placeholder="e.g. Full refund, replacement, formal apology…"
                className="input resize-none text-sm" />
            </div>

            {/* Contact attempted toggle */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" className="sr-only peer"
                  checked={form.contact_attempted}
                  onChange={e => setForm(f => ({ ...f, contact_attempted: e.target.checked }))} />
                <div className="w-10 h-6 rounded-full transition peer-checked:bg-[color:var(--color-eucalyptus)]"
                  style={{ background: form.contact_attempted ? undefined : 'var(--color-line)' }} />
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition peer-checked:translate-x-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-ink)]">
                  I've already tried to resolve this with the company
                </p>
                <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                  e.g. called support, emailed, submitted a refund request — without a satisfactory response.
                </p>
              </div>
            </label>
          </div>

          {/* ── Contact details card ── */}
          <div className="card p-6 sm:p-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">📞</div>
              <div>
                <p className="font-semibold text-[color:var(--color-ink)]">
                  Phone number <span className="text-xs font-normal text-[color:var(--color-muted)]">optional</span>
                </p>
                <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                  Only shared with <strong>{selectedCompany?.name ?? 'the company'}</strong> if they want to contact you directly to resolve the issue. Never shown publicly.
                </p>
              </div>
            </div>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. 0412 345 678"
              className="input" />
          </div>

          {/* ── Visibility card ── */}
          <div className="card p-5 sm:p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" className="sr-only peer"
                  checked={form.is_public}
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} />
                <div className="w-10 h-6 rounded-full transition peer-checked:bg-[color:var(--color-eucalyptus)]"
                  style={{ background: form.is_public ? undefined : 'var(--color-line)' }} />
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition peer-checked:translate-x-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                  {form.is_public ? '🌐 Public complaint' : '🔒 Private complaint'}
                </p>
                <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                  {form.is_public
                    ? 'Visible to everyone. Helps other consumers and affects the company\'s rating.'
                    : 'Only you and the company can see this complaint. It won\'t affect their public score.'}
                </p>
              </div>
            </label>
          </div>

          {/* ── Guest notice ── */}
          {!user && (
            <div className="flex items-start gap-3 rounded-2xl px-4 py-3"
              style={{ background: '#FEF9EC', border: '1px solid var(--color-ochre)' }}>
              <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-ochre)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs text-[color:var(--color-ink-2)] leading-relaxed">
                You'll be asked to <span className="font-semibold">create a free account</span> — your complaint details are saved and will be submitted automatically.
              </p>
            </div>
          )}

          {errors._general && (
            <div className="rounded-2xl px-4 py-3 text-sm text-[color:var(--color-clay)]"
              style={{ background: 'var(--color-clay-soft)', border: '1px solid var(--color-clay)' }}>
              {errors._general}
            </div>
          )}

          {/* ── Submit ── */}
          <button
            onClick={submit}
            disabled={loading || !form.incident_date}
            className="btn-primary w-full justify-center flex text-base py-3.5">
            {loading ? (
              <span className="flex items-center gap-2"><Spinner size={18} /> Submitting…</span>
            ) : user
              ? <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  Publish complaint
                </span>
              : 'Create account & publish →'
            }
          </button>

          <p className="text-center text-xs text-[color:var(--color-muted)]">
            By publishing, you confirm this complaint is truthful and agree to our{' '}
            <a href="/terms" className="underline hover:text-[color:var(--color-ink)]">community guidelines</a>.
          </p>
        </div>
      )}
    </div>
  )
}
