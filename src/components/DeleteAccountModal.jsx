import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'

export default function DeleteAccountModal({ onClose, isCompany = false }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.delete('/auth/account', { data: { password } })
      // Clear auth state
      localStorage.removeItem('token')
      useAuthStore.setState({ user: null, token: null })
      navigate('/?deleted=1')
    } catch (err) {
      setError(err.response?.data?.errors?.password?.[0] ?? err.response?.data?.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>

      <div className="card w-full max-w-md p-6 space-y-5" style={{ background: 'var(--color-card)' }}>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-clay-soft)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--color-clay)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>Delete account</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>This action is permanent and cannot be undone.</p>
          </div>
          <button onClick={onClose} className="text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* What gets deleted */}
        <div className="rounded-xl p-4 space-y-2 text-sm"
          style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)' }}>
          <p className="font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
            What will happen
          </p>
          <ul className="space-y-1.5 text-xs" style={{ color: 'var(--color-ink-2)' }}>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-clay)' }}>✕</span>
              Your account and personal information will be permanently deleted
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-clay)' }}>✕</span>
              All active sessions will be signed out immediately
            </li>
            {isCompany ? (
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--color-clay)' }}>✕</span>
                Your company profile will be unlinked and return to unclaimed status
              </li>
            ) : (
              <li className="flex items-start gap-2">
                <span className="text-amber-500">~</span>
                Your complaints will remain on the platform as anonymous records (required for public accountability)
              </li>
            )}
          </ul>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-red-600 shrink-0"
          />
          <span className="text-xs" style={{ color: 'var(--color-ink-2)' }}>
            I understand this is permanent and I want to delete my account.
          </span>
        </label>

        {/* Password confirmation */}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink-2)' }}>
              Confirm your password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input w-full"
              placeholder="Enter your password to confirm"
              autoComplete="current-password"
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

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="btn btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !confirmed || !password}
              className="flex-1 justify-center flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
              style={{ background: 'var(--color-clay)' }}>
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Deleting…
                </>
              ) : 'Delete my account'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
