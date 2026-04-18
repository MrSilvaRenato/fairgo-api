import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const DRAFT_KEY = 'fairgo_complaint_draft'

export default function LoginPage() {
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const hasDraft = !!sessionStorage.getItem(DRAFT_KEY)

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    try {
      await login(form)
      navigate(next)
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
      else setErrors({ email: ['Invalid email or password.'] })
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center -mt-8">
      <div className="w-full max-w-md">

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
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">FG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {hasDraft ? 'Sign in to continue' : 'Welcome back'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {hasDraft ? 'Your complaint will be submitted right after' : 'Sign in to your Fair Go account'}
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={submit} className="space-y-5">
            <Field label="Email address" error={errors.email?.[0]}>
              <input name="email" type="email" value={form.email} onChange={handle}
                required className="input" placeholder="you@example.com" autoComplete="email" />
            </Field>

            <Field label="Password" error={errors.password?.[0]}>
              <input name="password" type="password" value={form.password} onChange={handle}
                required className="input" placeholder="Your password" autoComplete="current-password" />
            </Field>

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
