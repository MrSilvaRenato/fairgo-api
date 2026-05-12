import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Unlimited complaints', 'Basic dashboard', 'Public profile', 'Company response tools'],
    current: true,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: ['Everything in Free', 'Advanced analytics', 'Priority badge', 'AI-assisted responses', 'CSV export'],
  },
  {
    name: 'Business',
    price: '$79',
    period: '/month',
    features: ['Everything in Pro', 'Multi-location support', 'Dedicated account manager', 'API access', 'White-label reports'],
  },
]

export default function BillingPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-[28px] font-semibold tracking-tight" style={{ color: 'var(--color-ink)' }}>
          Billing &amp; Plans
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          Manage your subscription and unlock advanced features.
        </p>
      </div>

      {/* Coming soon banner */}
      <div className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-eucalyptus-3)' }}>
          <Icon name="sparkle" size={18} style={{ color: 'var(--color-eucalyptus)' }} />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
            Paid plans are coming soon
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            All features are completely free during our launch period. Paid plans with advanced analytics and priority features will be introduced later — we'll notify you before anything changes.
          </p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div key={plan.name}
            className={`card p-5 flex flex-col gap-4 relative ${!plan.current ? 'opacity-50' : ''}`}>

            {plan.current && (
              <span className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}>
                Current
              </span>
            )}
            {!plan.current && (
              <span className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-paper-2)', color: 'var(--color-muted)', border: '1px solid var(--color-line)' }}>
                Coming soon
              </span>
            )}

            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>{plan.name}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-display text-[28px] font-semibold leading-none" style={{ color: 'var(--color-ink)' }}>
                  {plan.price}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-ink-2)' }}>
                  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ color: 'var(--color-eucalyptus)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button disabled
              className="w-full text-center text-xs font-medium py-2 rounded-xl cursor-not-allowed"
              style={{ background: 'var(--color-paper-2)', color: 'var(--color-muted)', border: '1px solid var(--color-line)' }}>
              {plan.current ? 'Active' : 'Coming soon'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
        All plans will be processed securely by Stripe. Cancel anytime — no lock-in.
      </p>
    </div>
  )
}
