import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../../lib/axios'

export default function BillingPage() {
  const [plans, setPlans] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(null)
  const [searchParams] = useSearchParams()
  const success  = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')

  useEffect(() => {
    Promise.all([api.get('/billing/plans'), api.get('/dashboard/company')])
      .then(([p, d]) => { setPlans(p.data.plans); setCurrent(d.data.company.subscription) })
      .finally(() => setLoading(false))
  }, [])

  const handleCheckout = async (planId) => {
    setRedirecting(planId)
    try {
      const { data } = await api.post('/billing/checkout', { plan: planId })
      window.location.href = data.url
    } catch { setRedirecting(null) }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will be downgraded to the free plan.')) return
    await api.post('/billing/cancel')
    window.location.reload()
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-1/4" />
      <div className="grid sm:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-header">Billing & Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Current plan:{' '}
            <span className="font-semibold text-gray-700 capitalize">{current?.plan ?? 'free'}</span>
          </p>
        </div>
        <Link to="/company/dashboard" className="btn-secondary text-sm">← Dashboard</Link>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-green-800 text-sm">Payment successful!</p>
            <p className="text-xs text-green-700 mt-0.5">Your plan has been upgraded. Analytics are now unlocked.</p>
          </div>
        </div>
      )}

      {cancelled && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">↩️</span>
          <p className="text-sm text-gray-600">Checkout was cancelled. No changes were made.</p>
        </div>
      )}

      {/* Free plan */}
      <div className="card p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-gray-800">Free plan</h3>
            {(!current || current.plan === 'free') && (
              <span className="badge badge-green">Current</span>
            )}
          </div>
          <p className="text-sm text-gray-500">Unlimited complaints · Basic dashboard · Public profile</p>
        </div>
        <p className="text-2xl font-bold text-gray-400">$0<span className="text-sm font-normal">/mo</span></p>
      </div>

      {/* Paid plans */}
      <div className="grid sm:grid-cols-2 gap-5">
        {plans.map((plan) => {
          const isCurrent = current?.plan === plan.id
          const isPro = plan.id === 'pro'
          return (
            <div key={plan.id}
              className={`card p-6 flex flex-col relative overflow-hidden ${
                isPro ? 'border-blue-200' : 'border-green-200'
              } ${isCurrent ? (isPro ? 'bg-blue-50' : 'bg-green-50') : ''}`}>

              {isPro && (
                <div className="absolute top-4 right-4">
                  <span className="badge badge-blue">Most popular</span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button onClick={handleCancel}
                  className="btn-danger w-full justify-center flex text-sm">
                  Cancel plan
                </button>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={!!redirecting}
                  className={`w-full justify-center flex font-medium text-sm py-2.5 rounded-xl transition disabled:opacity-50 ${
                    isPro
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}>
                  {redirecting === plan.id ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Redirecting…
                    </span>
                  ) : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-400">
        Payments processed securely by Stripe. Cancel anytime.
      </p>
    </div>
  )
}
