import { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import useSeoMeta from '../hooks/useSeoMeta'
import Icon from '../components/Icon'

/* ── Verification status config ──────────────────────────────── */
const ID_STATUS = {
  pending:  { label: 'Under review',   color: '#8A5A1F', bg: '#F3E2C3',                      icon: '🕐' },
  approved: { label: 'ID Verified',    color: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)', icon: '✅' },
  rejected: { label: 'Not verified',   color: 'var(--color-clay)',       bg: 'var(--color-clay-soft)',    icon: '❌' },
}

export default function ProfilePage() {
  const { user: authUser, fetchUser } = useAuthStore()

  useSeoMeta({ title: 'My profile — Aus Fair Go' })

  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [errors,    setErrors]    = useState({})
  const [form,      setForm]      = useState({ name: '', phone: '', address: '' })

  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState('')
  const [uploadDone,   setUploadDone]   = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    api.get('/profile')
      .then(r => {
        setProfile(r.data)
        setForm({ name: r.data.name ?? '', phone: r.data.phone ?? '', address: r.data.address ?? '' })
      })
      .finally(() => setLoading(false))
  }, [])

  if (!authUser) return <Navigate to="/login?next=/profile" replace />

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setErrors({}); setSaving(true); setSaved(false)
    try {
      const r = await api.patch('/profile', form)
      setProfile(r.data)
      setSaved(true)
      fetchUser()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
    } finally { setSaving(false) }
  }

  const uploadId = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(''); setUploading(true); setUploadDone(false)
    const fd = new FormData()
    fd.append('document', file)
    try {
      const r = await api.post('/profile/id-verification', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfile(r.data)
      setUploadDone(true)
    } catch (err) {
      setUploadError(err.response?.data?.message ?? 'Upload failed. Try again.')
    } finally { setUploading(false) }
    e.target.value = ''
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-4 animate-pulse">
      <div className="h-8 rounded-xl w-1/3" style={{ background: 'var(--color-line)' }} />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl" style={{ background: 'var(--color-line)' }} />
      ))}
    </div>
  )

  const idStatus  = profile?.id_verification_status
  const idBadge   = idStatus ? ID_STATUS[idStatus] : null
  const isVerified = idStatus === 'approved'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[color:var(--color-muted)]">
        <Link to={authUser.role === 'company_admin' ? '/company/dashboard' : '/dashboard'}
          className="hover:text-[color:var(--color-ink)] transition">Dashboard</Link>
        <span>/</span>
        <span className="text-[color:var(--color-ink-2)]">Profile</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
          {profile?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{profile?.name}</h1>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ID Verified
              </span>
            )}
          </div>
          <p className="text-sm text-[color:var(--color-muted)] mt-0.5">
            Member since {profile?.member_since} · {profile?.role === 'company_admin' ? 'Business account' : 'Consumer account'}
          </p>
        </div>
      </div>

      {/* ── Personal info ── */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>Personal information</h2>

        <form onSubmit={submit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: 'var(--color-muted)' }}>Full name</label>
            <input name="name" value={form.name} onChange={handle}
              className="input w-full" placeholder="Your full name" />
            {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--color-clay)' }}>{errors.name[0]}</p>}
          </div>

          {/* Email — read only */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: 'var(--color-muted)' }}>Email address</label>
            <div className="relative">
              <input value={profile?.email ?? ''} readOnly
                className="input w-full pr-28 cursor-not-allowed"
                style={{ opacity: 0.6 }} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={profile?.email_verified
                  ? { background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }
                  : { background: 'var(--color-clay-soft)', color: 'var(--color-clay)' }
                }>
                {profile?.email_verified ? '✓ Verified' : '✗ Unverified'}
              </span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: 'var(--color-muted)' }}>Phone number</label>
            <div className="relative">
              <input name="phone" value={form.phone} onChange={handle}
                className="input w-full pr-28" placeholder="+61 4xx xxx xxx" />
              {profile?.phone_verified && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}>
                  ✓ Verified
                </span>
              )}
            </div>
            {errors.phone && <p className="text-xs mt-1" style={{ color: 'var(--color-clay)' }}>{errors.phone[0]}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: 'var(--color-muted)' }}>Address</label>
            <input name="address" value={form.address} onChange={handle}
              className="input w-full" placeholder="Street, City, State, Postcode" />
            <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
              Private — never shown publicly.
            </p>
            {errors.address && <p className="text-xs mt-1" style={{ color: 'var(--color-clay)' }}>{errors.address[0]}</p>}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium"
                style={{ color: 'var(--color-eucalyptus)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                Saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Identity verification ── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>Identity verification</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Verify your identity to receive a verified badge on your profile and complaints.
            </p>
          </div>
          {idBadge && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ background: idBadge.bg, color: idBadge.color }}>
              {idBadge.icon} {idBadge.label}
            </span>
          )}
        </div>

        {/* Status messages */}
        {idStatus === 'pending' && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2.5"
            style={{ background: '#FEF9C3', border: '1px solid #FDE047', color: '#713F12' }}>
            <span className="text-base shrink-0">🕐</span>
            <div>
              <strong>Document submitted — under review</strong>
              <p className="text-xs mt-0.5 opacity-80">Our team will review your document within 1–2 business days.</p>
            </div>
          </div>
        )}
        {idStatus === 'approved' && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2.5"
            style={{ background: 'var(--color-eucalyptus-3)', border: '1px solid var(--color-eucalyptus)', color: 'var(--color-eucalyptus)' }}>
            <span className="text-base shrink-0">✅</span>
            <div>
              <strong>Identity verified</strong>
              <p className="text-xs mt-0.5 opacity-80">Your ID was verified on {new Date(profile.id_verified_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
            </div>
          </div>
        )}
        {idStatus === 'rejected' && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2.5"
            style={{ background: 'var(--color-clay-soft)', border: '1px solid var(--color-clay)', color: 'var(--color-clay)' }}>
            <span className="text-base shrink-0">❌</span>
            <div>
              <strong>Verification unsuccessful</strong>
              {profile.id_rejection_note && <p className="text-xs mt-0.5 opacity-80">{profile.id_rejection_note}</p>}
              <p className="text-xs mt-1 opacity-80">Please upload a clearer document and try again.</p>
            </div>
          </div>
        )}

        {/* Upload area — hidden once approved */}
        {idStatus !== 'approved' && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>
              {idStatus === 'pending' ? 'Replace document' : 'Upload a document'}
            </p>
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition hover:border-[color:var(--color-eucalyptus)]"
              style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-2)' }}
            >
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={uploadId} />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 animate-spin" style={{ color: 'var(--color-eucalyptus)' }} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <p className="text-sm text-[color:var(--color-muted)]">Uploading…</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: 'var(--color-eucalyptus-3)' }}>
                    <svg className="w-6 h-6" style={{ color: 'var(--color-eucalyptus)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    Click to upload your ID document
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                    Driver's licence, passport or Medicare card · JPG, PNG or PDF · Max 10MB
                  </p>
                </>
              )}
            </div>
            {uploadError && <p className="text-xs mt-2" style={{ color: 'var(--color-clay)' }}>{uploadError}</p>}
            {uploadDone && !uploadError && (
              <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-eucalyptus)' }}>
                ✓ Document submitted — we'll review it within 1–2 business days.
              </p>
            )}
            <p className="text-[11px] mt-3" style={{ color: 'var(--color-muted)' }}>
              🔒 Your document is stored securely and never shown publicly. Used for identity verification only.
            </p>
          </div>
        )}
      </div>

      {/* ── Password ── */}
      <div className="card p-6">
        <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--color-ink)' }}>Password</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          Use the password reset flow to change your password securely.
        </p>
        <Link to="/forgot-password" className="btn btn-secondary inline-flex items-center gap-2 text-sm">
          <Icon name="key" size={14} /> Change password
        </Link>
      </div>

      {/* ── Payment method — Coming Soon ── */}
      <div className="card p-6 opacity-50 cursor-not-allowed select-none" style={{ border: '1px dashed var(--color-line)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>Payment method</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-line)', color: 'var(--color-muted)' }}>Coming soon</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Save a payment method for faster dispute resolution services.
        </p>
        <div className="mt-4 flex gap-2">
          {['💳', '🏦', '📱'].map(e => (
            <div key={e} className="w-12 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)' }}>{e}</div>
          ))}
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className="card p-6 space-y-3" style={{ border: '1px solid var(--color-clay-soft)' }}>
        <h2 className="font-semibold text-base" style={{ color: 'var(--color-clay)' }}>Danger zone</h2>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Deactivating removes your login access and personal contact info. Your complaints remain as public records.
        </p>
        <Link to={authUser.role === 'company_admin' ? '/company/settings' : '/dashboard'}
          className="btn text-sm inline-flex items-center gap-2"
          style={{ background: 'var(--color-clay-soft)', color: 'var(--color-clay)', border: '1px solid var(--color-clay)' }}>
          Manage account deactivation
        </Link>
      </div>

    </div>
  )
}
