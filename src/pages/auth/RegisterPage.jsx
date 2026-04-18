import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const DRAFT_KEY = 'fairgo_complaint_draft'

export default function RegisterPage() {
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const hasDraft = !!sessionStorage.getItem(DRAFT_KEY)

  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    role: 'consumer',
  })
  const [errors, setErrors] = useState({})

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    try {
      await register(form)
      if (form.role === 'company_admin') {
        navigate('/companies/register')
      } else {
        navigate(next)
      }
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center -mt-8 py-8">
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
              <p className="text-sm font-semibold text-blue-900">Almost there — create a free account to submit your complaint</p>
              <p className="text-xs text-blue-700 mt-0.5">Your complaint details are saved and will be pre-filled once you sign up.</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">FG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {hasDraft ? 'Create your free account' : 'Create your account'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Free forever. No credit card required.</p>
        </div>

        <div className="card p-8">
          {/* Account type toggle — hide if coming from complaint draft (consumer only) */}
          {!hasDraft && (
            <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
              {[
                { value: 'consumer',      label: 'Consumer', icon: '👤' },
                { value: 'company_admin', label: 'Business', icon: '🏢' },
              ].map((opt) => (
                <button
                  key={opt.value} type="button"
                  onClick={() => setForm({ ...form, role: opt.value })}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
                    form.role === opt.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <Field label="Full name" error={errors.name?.[0]}>
              <input name="name" value={form.name} onChange={handle} required
                className="input" placeholder="Jane Smith" autoComplete="name" />
            </Field>

            <Field label="Email address" error={errors.email?.[0]}>
              <input name="email" type="email" value={form.email} onChange={handle} required
                className="input" placeholder="you@example.com" autoComplete="email" />
            </Field>

            <Field label="Password" error={errors.password?.[0]}>
              <input name="password" type="password" value={form.password} onChange={handle} required
                className="input" placeholder="Min 8 characters" autoComplete="new-password" />
            </Field>

            <Field label="Confirm password">
              <input name="password_confirmation" type="password" value={form.password_confirmation}
                onChange={handle} required className="input" placeholder="Repeat password"
                autoComplete="new-password" />
            </Field>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account…
                </span>
              ) : hasDraft ? 'Create account & submit complaint' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            to={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="text-green-600 font-medium hover:underline"
          >
            Sign in
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
