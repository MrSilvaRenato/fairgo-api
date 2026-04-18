import { useState } from 'react'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import Icon from './Icon'

/**
 * Phone verification modal/inline widget.
 * Shows a phone input → sends OTP → verifies code.
 * On success calls onVerified() so the parent can proceed.
 */
export default function PhoneVerification({ onVerified, compact = false }) {
  const { user, fetchUser } = useAuthStore()

  const [step, setStep]       = useState('phone')   // 'phone' | 'otp'
  const [phone, setPhone]     = useState(user?.phone ?? '')
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [resendIn, setResendIn] = useState(0)

  const startResendTimer = () => {
    setResendIn(60)
    const t = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) { clearInterval(t); return 0 }
        return s - 1
      })
    }, 1000)
  }

  const sendOtp = async (e) => {
    e?.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.post('/auth/phone/send', { phone })
      setStep('otp')
      startResendTimer()
    } catch (err) {
      const msg = err.response?.data?.errors?.phone?.[0]
             ?? err.response?.data?.message
             ?? 'Failed to send code.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e) => {
    e?.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.post('/auth/phone/verify', { phone, code })
      await fetchUser()   // refresh user in store so phone_verified_at is up to date
      onVerified?.()
    } catch (err) {
      const msg = err.response?.data?.errors?.code?.[0]
             ?? err.response?.data?.message
             ?? 'Invalid code.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    // Inline banner version (used inside ComplaintFormPage)
    return (
      <div className="rounded-2xl border border-[color:var(--color-ochre)] bg-[#FDF6E8] p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[color:var(--color-ochre)] flex items-center justify-center shrink-0 mt-0.5">
            <Icon name="verified" size={15} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-sm text-[color:var(--color-ink)]">Verify your phone number</p>
            <p className="text-xs text-[color:var(--color-ink-2)] mt-0.5">
              Required before submitting. Keeps Fair Go genuine — one complaint per real person.
            </p>
          </div>
        </div>

        {step === 'phone' ? (
          <form onSubmit={sendOtp} className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61 400 000 000"
              className="input flex-1 text-sm"
              required
            />
            <button type="submit" disabled={loading} className="btn btn-primary shrink-0 text-sm">
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-3">
            <p className="text-xs text-[color:var(--color-muted)]">
              Code sent to <span className="font-mono font-medium text-[color:var(--color-ink)]">{phone}</span>
              {' — '}
              <button type="button" onClick={() => { setStep('phone'); setCode(''); setError('') }}
                className="text-[color:var(--color-eucalyptus)] hover:underline">change</button>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                className="input flex-1 text-sm font-mono tracking-widest"
                required
              />
              <button type="submit" disabled={loading || code.length < 6} className="btn btn-primary shrink-0 text-sm">
                {loading ? 'Verifying…' : 'Verify'}
              </button>
            </div>
            <button
              type="button"
              disabled={resendIn > 0}
              onClick={sendOtp}
              className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] disabled:opacity-40 transition"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </button>
          </form>
        )}

        {error && (
          <p className="text-xs text-[color:var(--color-clay)] flex items-center gap-1.5">
            <Icon name="x" size={12} /> {error}
          </p>
        )}
      </div>
    )
  }

  // Full-page / modal version
  return (
    <div className="max-w-sm mx-auto px-6 py-12 text-center space-y-6">
      <div className="w-14 h-14 rounded-full bg-[color:var(--color-eucalyptus-3)] flex items-center justify-center mx-auto">
        <Icon name="verified" size={24} className="text-[color:var(--color-eucalyptus)]" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-semibold">Verify your phone</h2>
        <p className="text-sm text-[color:var(--color-ink-2)] mt-2">
          We send a 6-digit code to confirm you're a real person. One number per account.
        </p>
      </div>

      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="space-y-4 text-left">
          <div>
            <label className="text-sm font-medium text-[color:var(--color-ink)] block mb-1.5">Mobile number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61 400 000 000"
              className="input w-full"
              required
            />
          </div>
          {error && <p className="text-xs text-[color:var(--color-clay)]">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Sending…' : 'Send verification code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4 text-left">
          <div>
            <label className="text-sm font-medium text-[color:var(--color-ink)] block mb-1.5">
              Enter the 6-digit code sent to {phone}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="input w-full font-mono tracking-[.4em] text-center text-xl"
              required
            />
          </div>
          {error && <p className="text-xs text-[color:var(--color-clay)]">{error}</p>}
          <button type="submit" disabled={loading || code.length < 6} className="btn btn-primary w-full">
            {loading ? 'Verifying…' : 'Confirm'}
          </button>
          <div className="text-center">
            <button
              type="button"
              disabled={resendIn > 0}
              onClick={sendOtp}
              className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] disabled:opacity-40 transition"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </button>
            {' · '}
            <button type="button" onClick={() => { setStep('phone'); setCode(''); setError('') }}
              className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition">
              Change number
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
