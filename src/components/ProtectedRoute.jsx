import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * ProtectedRoute — wraps routes that require authentication and/or a specific role.
 *
 * Props:
 *   role  — 'consumer' | 'company_admin' | 'admin' | undefined (any authenticated user)
 *
 * Behaviour:
 *   1. No token at all           → redirect to /login?next=...
 *   2. Token exists, user loading → show full-screen spinner (avoid flash redirect)
 *   3. Token exists, wrong role   → redirect to the user's own home
 *   4. All good                   → render <Outlet />
 */
export default function ProtectedRoute({ role }) {
  const { user, token, fetchUser } = useAuthStore()
  const location = useLocation()

  // If we have a token but no user yet, we need to resolve the user before deciding
  const [checking, setChecking] = useState(!user && !!token)

  useEffect(() => {
    if (!user && token) {
      fetchUser().finally(() => setChecking(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // No token — send straight to login
  if (!token) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  // Token exists but user not resolved yet — wait
  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[color:var(--color-eucalyptus)] border-t-transparent animate-spin" />
          <p className="text-sm text-[color:var(--color-muted)]">Loading…</p>
        </div>
      </div>
    )
  }

  // Token resolved to nothing (fetchUser failed / token expired)
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  // Wrong role — redirect to where this user belongs
  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'company_admin') return <Navigate to="/company/dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
