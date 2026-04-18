import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import CompanyLogo from '../../components/CompanyLogo'
import Icon from '../../components/Icon'

const INDUSTRIES = [
  'Automotive', 'Banking & Finance', 'Education', 'Energy & Utilities',
  'Food & Beverage', 'Government', 'Health & Medical', 'Insurance',
  'Internet & Technology', 'Real Estate', 'Retail', 'Telecommunications',
  'Transport & Logistics', 'Travel & Tourism', 'Other',
]

export default function CompanySettingsPage() {
  const [company, setCompany] = useState(null)
  const [form, setForm] = useState({
    name: '', industry: '', description: '', website: '', logo_url: '',
  })
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [abnVerifying, setAbnVerifying] = useState(false)
  const [abnResult, setAbnResult]   = useState(null)
  const [saved, setSaved]     = useState(false)
  const [errors, setErrors]   = useState({})

  useEffect(() => {
    api.get('/dashboard/company').then((res) => {
      const c = res.data.company
      setCompany(c)
      setForm({
        name:        c.name        ?? '',
        industry:    c.industry    ?? '',
        description: c.description ?? '',
        website:     c.website     ?? '',
        logo_url:    c.logo_url    ?? '',
      })
    }).finally(() => setLoading(false))
  }, [])

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErrors({}); setSaving(true); setSaved(false)
    try {
      const res = await api.patch('/company/settings', form)
      setCompany(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse px-6 py-10">
      <div className="h-8 bg-[color:var(--color-line)] rounded w-1/3" />
      <div className="card p-8 space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-[color:var(--color-line)] rounded-xl" />)}
      </div>
    </div>
  )

  if (!company) return (
    <div className="text-center py-16 text-[color:var(--color-muted)]">
      No company found. <Link to="/companies/register" className="text-[color:var(--color-eucalyptus)] hover:underline">Register one</Link>.
    </div>
  )

  // Live preview uses form values
  const previewCompany = { ...company, website: form.website, name: form.name, logo_url: form.logo_url }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-muted)]">
        <Link to="/company/dashboard" className="hover:text-[color:var(--color-ink)]">Dashboard</Link>
        <Icon name="chevron-r" size={12} />
        <span className="text-[color:var(--color-ink)]">Settings</span>
      </div>

      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Company settings</h1>
        <p className="text-[color:var(--color-ink-2)] text-sm mt-1">Manage your public profile, branding and contact details.</p>
      </div>

      {/* Logo preview card */}
      <div className="card p-5 flex items-center gap-5">
        <CompanyLogo company={previewCompany} size="xl" />
        <div>
          <p className="font-semibold text-[color:var(--color-ink)]">{form.name || company.name}</p>
          <p className="text-xs text-[color:var(--color-muted)] mt-0.5 capitalize">{form.industry || 'No industry set'}</p>
          <p className="text-xs text-[color:var(--color-muted)] mt-2">
            {form.logo_url
              ? <span>Using custom logo URL</span>
              : form.website
                ? <>Logo auto-loaded from <span className="font-mono text-[color:var(--color-eucalyptus)]">{form.website}</span></>
                : 'Add your website below to auto-load your logo'}
          </p>
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-6 sm:p-8">
        <h2 className="caps mb-5">Public profile</h2>
        <form onSubmit={submit} className="space-y-5">

          <Field label="Business name" error={errors.name?.[0]}>
            <input
              name="name" value={form.name} onChange={handle}
              className="input" required placeholder="Your company name"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="ABN" hint="Read-only · verified against the Australian Business Register">
              <div className="flex gap-2 items-center">
                <input
                  value={company.abn ?? '—'} disabled
                  className="input opacity-50 cursor-not-allowed flex-1"
                />
                {company.abn_verified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl shrink-0"
                    style={{ color: '#1d4ed8', background: '#eff6ff', border: '1px solid #93c5fd' }}>
                    <Icon name="verified" size={13} /> ABN Verified
                  </span>
                ) : (
                  <button type="button"
                    disabled={abnVerifying || !company.abn}
                    onClick={async () => {
                      setAbnVerifying(true); setAbnResult(null)
                      try {
                        const r = await api.post('/company/abn/verify')
                        setAbnResult(r.data)
                        if (r.data.verified) setCompany((p) => ({ ...p, abn_verified: true }))
                      } catch { setAbnResult({ verified: false, error: 'Request failed' }) }
                      finally { setAbnVerifying(false) }
                    }}
                    className="btn btn-secondary text-xs shrink-0">
                    {abnVerifying ? 'Checking…' : 'Verify ABN'}
                  </button>
                )}
              </div>
              {abnResult && !abnResult.verified && (
                <p className="text-xs text-[color:var(--color-clay)] mt-1">
                  {abnResult.error ?? 'ABN could not be verified. Check the number is correct.'}
                </p>
              )}
              {abnResult?.verified && abnResult?.stub && (
                <p className="text-xs text-[color:var(--color-muted)] mt-1">
                  Dev mode: ABN format valid. In production this checks the Australian Business Register.
                </p>
              )}
            </Field>
            <Field label="Industry" error={errors.industry?.[0]}>
              <select name="industry" value={form.industry} onChange={handle} className="input">
                <option value="">Select an industry…</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
          </div>

          <Field
            label="Website"
            error={errors.website?.[0]}
            hint="Used to auto-load your logo"
          >
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 text-sm text-[color:var(--color-muted)] bg-[color:var(--color-paper-2)] border border-r-0 border-[color:var(--color-line)] rounded-l-xl h-[42px] shrink-0">
                https://
              </span>
              <input
                name="website" value={form.website} onChange={handle}
                className="input rounded-l-none border-l-0"
                placeholder="yourcompany.com.au"
              />
            </div>
          </Field>

          <Field
            label="Custom logo URL"
            error={errors.logo_url?.[0]}
            hint="Optional — overrides auto-fetched logo"
          >
            <input
              name="logo_url" value={form.logo_url} onChange={handle}
              className="input"
              placeholder="https://cdn.example.com/logo.png"
            />
          </Field>

          <Field
            label="Short description"
            error={errors.description?.[0]}
            hint={`${form.description.length}/1000`}
          >
            <textarea
              name="description" value={form.description} onChange={handle}
              rows={4} className="input resize-none"
              placeholder="Tell customers what your business does…"
              maxLength={1000}
            />
          </Field>

          {/* Save row */}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Saving…
                </span>
              ) : 'Save changes'}
            </button>

            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-[color:var(--color-eucalyptus)] font-medium">
                <Icon name="check" size={16} /> Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Account info (read-only) */}
      <div className="card p-6 sm:p-8">
        <h2 className="caps mb-5">Account</h2>
        <div className="space-y-4">
          <ReadField label="Account email" value={company.user?.email ?? '—'} />
          <ReadField label="Registered on Aus Fair Go" value={
            company.created_at
              ? new Date(company.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
              : '—'
          } />
          <ReadField label="Slug (public URL)" value={`fair-go.au/companies/${company.slug}`} mono />
          <ReadField label="Subscription plan" value={company.subscription?.plan ?? 'Free'} />
        </div>
      </div>

      {/* Quick links */}
      <div className="card p-5">
        <p className="caps mb-3">Other settings</p>
        <div className="space-y-1">
          <QuickLink
            to="/company/billing"
            icon="building"
            title="Billing & plan"
            sub="Upgrade to Standard or Pro"
          />
          <QuickLink
            to={`/companies/${company.slug}`}
            icon="arrow-ul"
            title="View public profile"
            sub="See how customers see your company"
          />
        </div>
      </div>

    </div>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-[color:var(--color-ink)]">{label}</label>
        {hint && <span className="text-xs text-[color:var(--color-muted)]">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[color:var(--color-clay)] text-xs mt-1.5">{error}</p>}
    </div>
  )
}

function ReadField({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[color:var(--color-line)] last:border-0">
      <span className="text-sm text-[color:var(--color-muted)] shrink-0">{label}</span>
      <span className={`text-sm text-[color:var(--color-ink)] text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

function QuickLink({ to, icon, title, sub }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[color:var(--color-paper-2)] transition group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[color:var(--color-paper-2)] rounded-lg flex items-center justify-center text-[color:var(--color-eucalyptus)]">
          <Icon name={icon} size={16} />
        </div>
        <div>
          <p className="text-sm font-medium text-[color:var(--color-ink)]">{title}</p>
          <p className="text-xs text-[color:var(--color-muted)]">{sub}</p>
        </div>
      </div>
      <Icon name="chevron-r" size={16} className="text-[color:var(--color-muted)] group-hover:text-[color:var(--color-ink)] transition" />
    </Link>
  )
}
