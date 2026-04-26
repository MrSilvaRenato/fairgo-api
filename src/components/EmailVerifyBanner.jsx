import { useState } from 'react'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'

/**
 * Shows a banner prompting email verification.
 * Renders nothing if the user is already verified or not logged in.
 */
export default function EmailVerifyBanner() {
  const { user } = useAuthStore()
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  // Don't show if verified or not a consumer
  if (!user || user.email_verified_at || user.role !== 'consumer') return null

  const resend = async () => {
    setLoading(true)
    try {
      await api.post('/auth/email/resend')
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 text-sm">
      <span className="text-lg shrink-0">✉️</span>
      <div className="flex-1">
        {sent ? (
          <p className="text-amber-800 font-medium">
            Verification email sent! Check your inbox at <strong>{user.email}</strong>.
          </p>
        ) : (
          <>
            <p className="text-amber-800 font-medium">
              Please verify your email to file complaints.
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              Check your inbox at <strong>{user.email}</strong> for the verification link.
            </p>
          </>
        )}
      </div>
      {!sent && (
        <button
          onClick={resend}
          disabled={loading}
          className="shrink-0 text-xs font-semibold text-amber-800 underline hover:no-underline disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Resend email'}
        </button>
      )}
    </div>
  )
}
