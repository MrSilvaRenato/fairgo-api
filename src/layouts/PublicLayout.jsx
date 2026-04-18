import { Outlet, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function PublicLayout() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="mt-16 border-t" style={{ borderColor: 'var(--color-line)' }}>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

            {/* Brand */}
            <div>
              <p className="font-display font-semibold text-[color:var(--color-ink)] text-sm">Aus Fair Go</p>
              <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                Australia's public consumer complaint platform
              </p>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[color:var(--color-muted)]">
              <Link to="/community-guidelines" className="hover:text-[color:var(--color-ink)] transition">
                Community Guidelines
              </Link>
              <Link to="/terms" className="hover:text-[color:var(--color-ink)] transition">
                Terms &amp; Conditions
              </Link>
              <Link to="/privacy" className="hover:text-[color:var(--color-ink)] transition">
                Privacy Policy
              </Link>
              <a href="mailto:hello@ausfairgo.com.au" className="hover:text-[color:var(--color-ink)] transition">
                Contact
              </a>
            </nav>
          </div>

          <div className="mt-6 pt-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-[color:var(--color-muted)]"
            style={{ borderColor: 'var(--color-line)' }}>
            <p>© {new Date().getFullYear()} Aus Fair Go. All rights reserved.</p>
            <p>
              Operated in accordance with the{' '}
              <a href="https://www.legislation.gov.au/Details/C2004A03722"
                target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[color:var(--color-ink)] transition">
                Privacy Act 1988
              </a>
              {' '}and{' '}
              <a href="https://www.accc.gov.au/consumers/consumer-rights-guarantees"
                target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[color:var(--color-ink)] transition">
                Australian Consumer Law
              </a>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
