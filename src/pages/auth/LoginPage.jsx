import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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

const DRAFT_KEY = 'fairgo_complaint_draft'
const MAX_ATTEMPTS = 5
const WARN_AFTER   = 3  // show reset prompt after this many failures

export default function LoginPage() {
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next    = searchParams.get('next') ?? '/'
  const banned  = searchParams.get('banned') === '1'
  const reset   = searchParams.get('reset') === '1'
  const hasDraft = !!sessionStorage.getItem(DRAFT_KEY)

  const [form, setForm]         = useState({ email: '', password: '' })
  const [errors, setErrors]     = useState({})
  const [attempts, setAttempts] = useState(0)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const remainingAttempts = MAX_ATTEMPTS - attempts
  const showResetPrompt   = attempts >= WARN_AFTER

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    try {
      await login(form)
      navigate(next)
    } catch (err) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
      else setErrors({ email: ['Invalid email or password.'] })
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center -mt-8 px-4">
      <div className="w-full max-w-md">

        {/* Password reset success banner */}
        {reset && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl px-4 py-4"
            style={{ background: 'var(--color-eucalyptus-soft, #e8f0eb)', border: '1px solid var(--color-eucalyptus)' }}>
            <span className="text-lg shrink-0">✅</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-eucalyptus)' }}>Password reset successfully</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-2)' }}>
                Your new password is active. Sign in below.
              </p>
            </div>
          </div>
        )}

        {/* Banned account banner */}
        {banned && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl px-4 py-4"
            style={{ background: 'var(--color-clay-soft)', border: '1px solid var(--color-clay)' }}>
            <span className="text-lg shrink-0">🚫</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-clay)' }}>Account suspended</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-2)' }}>
                This account has been suspended by Aus Fair Go. Contact{' '}
                <a href="mailto:support@ausfairgo.com.au" className="underline">support@ausfairgo.com.au</a>{' '}
                if you believe this is an error.
              </p>
            </div>
          </div>
        )}

        {/* Complaint draft context banner */}
        {hasDraft && (
          <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-4">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Sign in to submit your complaint</p>
              <p className="text-xs text-blue-700 mt-0.5">Your complaint details are saved and will be pre-filled once you log in.</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LogoMark size={52} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {hasDraft ? 'Sign in to continue' : 'Welcome back'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {hasDraft ? 'Your complaint will be submitted right after' : 'Sign in to your Aus Fair Go account'}
          </p>
        </div>

        <div className="card p-5 sm:p-8">
          <form onSubmit={submit} className="space-y-5">
            <Field label="Email address" error={errors.email?.[0]}>
              <input name="email" type="email" value={form.email} onChange={handle}
                required className="input" placeholder="you@example.com" autoComplete="email" />
            </Field>

            <Field label="Password" error={errors.password?.[0]}>
              <input name="password" type="password" value={form.password} onChange={handle}
                required className="input" placeholder="Your password" autoComplete="current-password" />
              {/* Forgot password link under the password field */}
              <div className="mt-1.5 text-right">
                <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--color-eucalyptus)' }}>
                  Forgot password?
                </Link>
              </div>
            </Field>

            {/* Reset prompt — shown after 3 failed attempts */}
            {showResetPrompt && (
              <div className="rounded-xl px-4 py-3 flex items-start gap-3"
                style={{ background: 'var(--color-ochre-soft, #fef9ec)', border: '1px solid var(--color-ochre, #E8B977)' }}>
                <span className="text-lg shrink-0 mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {remainingAttempts > 0
                      ? `You have ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} left`
                      : 'Too many failed attempts'}
                  </p>
                  <p className="text-xs mt-0.5 mb-2" style={{ color: 'var(--color-ink-2)' }}>
                    Having trouble signing in? Reset your password to regain access.
                  </p>
                  <Link
                    to={`/forgot-password`}
                    className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2"
                    style={{ color: 'var(--color-eucalyptus)' }}>
                    Reset my password →
                  </Link>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : hasDraft ? 'Sign in & submit complaint' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link
            to={`/register${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="text-green-600 font-medium hover:underline"
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
