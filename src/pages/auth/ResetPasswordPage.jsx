import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../lib/axios'

function passwordScore(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw) || (pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw))) score++
  return Math.min(score, 4)
}
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981']

function PasswordStrength({ password }) {
  const score = passwordScore(password)
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4].map(n => (
          <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: n <= score ? STRENGTH_COLOR[score] : 'var(--color-line)' }} />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: STRENGTH_COLOR[score] }}>
        {STRENGTH_LABEL[score]}
        {score < 2 && ' — try adding numbers or uppercase letters'}
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const token           = searchParams.get('token') ?? ''
  const emailFromUrl    = searchParams.get('email') ?? ''

  const [form, setForm]     = useState({ email: emailFromUrl, password: '', password_confirmation: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [errors, setErrors] = useState({})

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { ...form, token })
      setDone(true)
      setTimeout(() => navigate('/login?reset=1'), 2500)
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
      else setErrors({ email: [err.response?.data?.message ?? 'Reset failed. The link may have expired.'] })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center -mt-8">
        <div className="w-full max-w-md card p-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>Invalid reset link</p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            This link is missing a reset token. Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn btn-primary w-full justify-center flex">
            Request new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center -mt-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-eucalyptus)' }}>
            <span className="text-white text-xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Set a new password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Choose a strong password for your account.
          </p>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>Password updated!</p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Redirecting you to login…
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <Field label="Email address" error={errors.email?.[0]}>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handle}
                  required
                  className="input w-full"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>

              <Field label="New password" error={errors.password?.[0]}>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handle}
                  required
                  minLength={8}
                  className="input w-full"
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
                <PasswordStrength password={form.password} />
              </Field>

              <Field label="Confirm new password" error={errors.password_confirmation?.[0]}>
                <input
                  name="password_confirmation"
                  type="password"
                  value={form.password_confirmation}
                  onChange={handle}
                  required
                  className="input w-full"
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                />
              </Field>

              <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center flex">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Saving…
                  </span>
                ) : 'Reset password'}
              </button>
            </form>
          )}
        </div>

        {!done && (
          <p className="mt-5 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
            <Link to="/forgot-password" className="hover:underline" style={{ color: 'var(--color-eucalyptus)' }}>
              Request a new reset link
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink-2)' }}>{label}</label>
      {children}
      {error && (
        <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-clay)' }}>
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
