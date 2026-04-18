import { Link } from 'react-router-dom'

const NAV = [
  { to: '/community-guidelines', label: 'Community Guidelines' },
  { to: '/terms',                label: 'Terms & Conditions' },
  { to: '/privacy',              label: 'Privacy Policy' },
]

export default function LegalLayout({ title, subtitle, updated, children }) {
  return (
    <div className="max-w-4xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-[color:var(--color-muted)] mb-4">
          <Link to="/" className="hover:text-[color:var(--color-ink)] transition">Home</Link>
          <span>/</span>
          <span>{title}</span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--color-ink)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[color:var(--color-muted)] mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
        {updated && (
          <p className="text-xs text-[color:var(--color-muted)] mt-3">
            Last updated: <span className="font-medium">{updated}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar nav */}
        <aside className="lg:w-52 shrink-0">
          <nav className="sticky top-6 space-y-1">
            <p className="caps text-[color:var(--color-muted)] mb-3">Legal</p>
            {NAV.map((n) => {
              const active = typeof window !== 'undefined' && window.location.pathname === n.to
              return (
                <Link key={n.to} to={n.to}
                  className={`block px-3 py-2 rounded-xl text-sm transition ${
                    active
                      ? 'bg-[color:var(--color-eucalyptus-3)] text-[color:var(--color-eucalyptus)] font-semibold'
                      : 'text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-paper-2)]'
                  }`}>
                  {n.label}
                </Link>
              )
            })}

            <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--color-line)' }}>
              <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
                Questions? Email{' '}
                <a href="mailto:legal@ausfairgo.com.au"
                  className="text-[color:var(--color-eucalyptus)] underline underline-offset-2">
                  legal@ausfairgo.com.au
                </a>
              </p>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="card p-7 sm:p-10 space-y-8">
            {children}
          </div>
        </div>

      </div>
    </div>
  )
}
