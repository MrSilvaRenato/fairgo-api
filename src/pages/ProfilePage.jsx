import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import useSeoMeta from '../hooks/useSeoMeta'
import Icon from '../components/Icon'

export default function ProfilePage() {
  const { user: authUser, fetchUser } = useAuthStore()

  useSeoMeta({ title: 'My profile — Aus Fair Go' })

  const [authChecked, setAuthChecked] = useState(false)
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [errors,    setErrors]    = useState({})
  const [form,      setForm]      = useState({ name: '', phone: '', address: '' })

  const [otpSent,    setOtpSent]    = useState(false)
  const [otpCode,    setOtpCode]    = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpError,   setOtpError]   = useState('')
  const [otpPhone,   setOtpPhone]   = useState('')

  useEffect(() => {
    fetchUser().finally(() => setAuthChecked(true))
  }, [])

  useEffect(() => {
    if (!authChecked) return
    if (!authUser) return
    api.get('/profile')
      .then(r => {
        setProfile(r.data)
        setForm({ name: r.data.name ?? '', phone: r.data.phone ?? '', address: r.data.address ?? '' })
      })
      .finally(() => setLoading(false))
  }, [authChecked, authUser])

  if (!authChecked) return null
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

  const sendOtp = async () => {
    const phone = form.phone.trim()
    if (!phone) { setOtpError('Enter your phone number first.'); return }
    setOtpError(''); setOtpSending(true)
    try {
      await api.post('/auth/phone/send', { phone })
      setOtpPhone(phone)
      setOtpSent(true)
      setOtpCode('')
    } catch (err) {
      setOtpError(err.response?.data?.message ?? 'Could not send code. Try again.')
    } finally { setOtpSending(false) }
  }

  const verifyOtp = async () => {
    setOtpError(''); setOtpVerifying(true)
    try {
      const r = await api.post('/auth/phone/verify', { phone: otpPhone, code: otpCode })
      setProfile(p => ({ ...p, phone_verified_at: r.data.phone_verified_at, phone: otpPhone }))
      setOtpSent(false)
      setOtpCode('')
      fetchUser()
    } catch (err) {
      setOtpError(err.response?.data?.message ?? 'Invalid or expired code.')
    } finally { setOtpVerifying(false) }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-4 animate-pulse">
      <div className="h-8 rounded-xl w-1/3" style={{ background: 'var(--color-line)' }} />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl" style={{ background: 'var(--color-line)' }} />
      ))}
    </div>
  )

  const isVerified = !!profile?.phone_verified_at

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
            <div className="flex gap-2">
              <input name="phone" value={form.phone} onChange={handle}
                className="input flex-1" placeholder="+61 4xx xxx xxx"
                disabled={!!profile?.phone_verified_at} />
              {!profile?.phone_verified_at && (
                <button type="button" onClick={sendOtp} disabled={otpSending || otpSent}
                  className="btn btn-secondary text-xs shrink-0 px-3">
                  {otpSending ? 'Sending…' : otpSent ? 'Code sent' : 'Send code'}
                </button>
              )}
              {profile?.phone_verified_at && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-2 rounded-xl shrink-0"
                  style={{ background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}>
                  ✓ Verified
                </span>
              )}
            </div>
            {errors.phone && <p className="text-xs mt-1" style={{ color: 'var(--color-clay)' }}>{errors.phone[0]}</p>}

            {/* OTP input */}
            {otpSent && !profile?.phone_verified_at && (
              <div className="mt-3 p-4 rounded-xl space-y-3" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)' }}>
                <p className="text-xs text-[color:var(--color-ink-2)]">
                  A 6-digit code was sent to <strong>{otpPhone}</strong>. Enter it below to verify your number.
                </p>
                <div className="flex gap-2">
                  <input
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input flex-1 font-mono text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <button type="button" onClick={verifyOtp}
                    disabled={otpCode.length !== 6 || otpVerifying}
                    className="btn btn-primary text-xs shrink-0 px-4 disabled:opacity-50">
                    {otpVerifying ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  {otpError && <p className="text-xs" style={{ color: 'var(--color-clay)' }}>{otpError}</p>}
                  <button type="button" onClick={sendOtp} disabled={otpSending}
                    className="text-xs underline ml-auto" style={{ color: 'var(--color-muted)' }}>
                    Resend code
                  </button>
                </div>
              </div>
            )}
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

      {/* ── Phone verification ── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>Phone verification</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Verify your mobile number to receive a <strong>Phone Verified</strong> badge on your complaints. One number per account.
            </p>
          </div>
          {profile?.phone_verified_at && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}>
              ✅ Verified
            </span>
          )}
        </div>

        {profile?.phone_verified_at ? (
          <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2.5"
            style={{ background: 'var(--color-eucalyptus-3)', border: '1px solid var(--color-eucalyptus)', color: 'var(--color-eucalyptus)' }}>
            <span className="text-base shrink-0">✅</span>
            <div>
              <strong>Phone number verified</strong>
              <p className="text-xs mt-0.5 opacity-80">
                Verified on {new Date(profile.phone_verified_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}.
                Your complaints now show the Phone Verified badge.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2.5"
            style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)', color: 'var(--color-ink-2)' }}>
            <span className="text-base shrink-0">📱</span>
            <div>
              <strong>Not yet verified</strong>
              <p className="text-xs mt-0.5 opacity-80">
                Enter your mobile number above and tap <em>Send code</em> to receive a one-time SMS code.
              </p>
            </div>
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
