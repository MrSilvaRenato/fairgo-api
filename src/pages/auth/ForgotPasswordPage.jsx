import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'

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

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.errors?.email?.[0] ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center -mt-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LogoMark size={52} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Forgot your password?</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📬</div>
              <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>Check your inbox</p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                If an account exists for <strong>{email}</strong>, a reset link has been sent.
                Check your spam folder if you don't see it within a few minutes.
              </p>
              <Link to="/login" className="btn btn-secondary w-full justify-center flex mt-2">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink-2)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input w-full"
                  placeholder="you@example.com"
                  autoFocus
                  autoComplete="email"
                />
                {error && (
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-clay)' }}>
                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center flex">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sending…
                  </span>
                ) : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        {!sent && (
          <p className="mt-5 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
            Remember your password?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--color-eucalyptus)' }}>
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
