import { Outlet, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import useAuthStore from '../store/authStore'

function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="var(--color-eucalyptus)" />
      <path d="M12 26c6-2 10-6 14-14-1 9-5 14-14 14Z" fill="var(--color-ochre-2)" opacity="0.95" />
      <path d="M12 26c6-2 10-6 14-14-1 9-5 14-14 14Z" fill="var(--color-paper)" opacity="0.9" transform="translate(-2,-2)" />
      <path d="M8 30h24" stroke="var(--color-paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

export default function PublicLayout() {
  const { user } = useAuthStore()
  const isCompany = user?.role === 'company_admin'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-paper)' }}>
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="mt-20" style={{ borderTop: '1px solid var(--color-line)' }}>

        {/* Main footer */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">

            {/* Brand col */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-3">
                <LogoMark size={32} />
                <span className="font-display text-[18px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Aus Fair Go
                </span>
              </Link>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                Australia's independent consumer complaint platform. Holding businesses accountable, one complaint at a time.
              </p>
              <a href="mailto:hello@ausfairgo.com.au"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium transition-colors"
                style={{ color: 'var(--color-eucalyptus)' }}>
                hello@ausfairgo.com.au
              </a>
            </div>

            {/* Platform */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
                Platform
              </p>
              <ul className="space-y-2.5">
                <FooterLink to="/search">Browse businesses</FooterLink>
                <FooterLink to="/most-complained">Most complained</FooterLink>
                <FooterLink to="/register">Submit a complaint</FooterLink>
                <FooterLink href="/#leaderboard">Leaderboard</FooterLink>
              </ul>
            </div>

            {/* For Business */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
                For Business
              </p>
              <ul className="space-y-2.5">
                <FooterLink to="/register?role=business">Register your business</FooterLink>
                <FooterLink to="/search">Find your company</FooterLink>
                <FooterLink to={isCompany ? '/company/dashboard' : '/login?next=/company/dashboard'}>Business dashboard</FooterLink>
                <FooterLink to={isCompany ? '/company/billing' : '/login?next=/company/billing'}>Plans &amp; pricing</FooterLink>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
                Legal
              </p>
              <ul className="space-y-2.5">
                <FooterLink to="/community-guidelines">Community Guidelines</FooterLink>
                <FooterLink to="/terms">Terms &amp; Conditions</FooterLink>
                <FooterLink to="/privacy">Privacy Policy</FooterLink>
                <FooterLink href="https://www.accc.gov.au/consumers/consumer-rights-guarantees" external>
                  Australian Consumer Law
                </FooterLink>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--color-line)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
              © {new Date().getFullYear()} Aus Fair Go. All rights reserved.
            </p>
            <p className="text-[11px] text-center" style={{ color: 'var(--color-muted)' }}>
              Operated under the{' '}
              <a href="https://www.legislation.gov.au/Details/C2004A03722"
                target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[color:var(--color-ink)] transition">
                Privacy Act 1988
              </a>
              {' '}·{' '}
              <span className="inline-flex items-center gap-1">
                🇦🇺 Made in Australia
              </span>
            </p>
          </div>
        </div>

      </footer>
    </div>
  )
}

function FooterLink({ to, href, external = false, children }) {
  const cls = "text-sm transition-colors hover:text-[color:var(--color-eucalyptus)]"
  const style = { color: 'var(--color-ink-2)' }

  if (href || external) {
    return (
      <li>
        <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
          className={cls} style={style}>
          {children}
        </a>
      </li>
    )
  }
  return (
    <li>
      <Link to={to} className={cls} style={style}>{children}</Link>
    </li>
  )
}
