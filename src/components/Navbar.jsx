import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import Icon from './Icon'

/**
 * Scroll to a section on the homepage.
 * If already on "/", just scrollIntoView. Otherwise navigate first then scroll.
 */
function useScrollTo() {
  const navigate = useNavigate()
  const location = useLocation()
  return (id) => {
    const scroll = () => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (location.pathname === '/') {
      scroll()
    } else {
      navigate('/')
      // wait for render then scroll
      setTimeout(scroll, 120)
    }
  }
}

/**
 * Logo mark — two overlapping leaves + horizon line.
 * Warm, botanical, geometric. Uses eucalyptus + ochre from the palette.
 */
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

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const scrollTo = useScrollTo()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname.startsWith(path)
  const linkClass = (path) =>
    `px-2 py-1.5 rounded-lg transition text-sm ${
      isActive(path)
        ? 'text-[color:var(--color-eucalyptus)] font-medium'
        : 'text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]'
    }`

  return (
    <nav className="sticky top-0 z-40 backdrop-blur bg-[color:var(--color-paper)]/85 border-b hairline-2">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6 whitespace-nowrap">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Aus Fair Go — home">
          <LogoMark />
          <span className="font-display text-[22px] font-semibold tracking-tight">Aus Fair Go</span>
        </Link>

        {/* Public links — full set on lg, compact on md */}
        <div className="hidden lg:flex items-center gap-5 text-sm text-[color:var(--color-ink-2)]">
          <NavBtn onClick={() => scrollTo('hero')}>Companies</NavBtn>
          <NavBtn onClick={() => scrollTo('leaderboard')}>Leaderboard</NavBtn>
          <Link to="/most-complained" className={linkClass('/most-complained')}>Most complained</Link>
          <NavBtn onClick={() => scrollTo('how-it-works')}>How it works</NavBtn>
        </div>
        <div className="hidden md:flex lg:hidden items-center gap-5 text-sm text-[color:var(--color-ink-2)]">
          <NavBtn onClick={() => scrollTo('hero')}>Companies</NavBtn>
          <Link to="/most-complained" className={linkClass('/most-complained')}>Most complained</Link>
        </div>

        <div className="flex-1" />

        {/* Auth / CTAs */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <span className="text-xs text-[color:var(--color-muted)]">
                Hi, <span className="text-[color:var(--color-ink)] font-medium">{user.name.split(' ')[0]}</span>
              </span>

              {user.role === 'admin' && (
                <Link to="/admin" className={linkClass('/admin')}>Admin</Link>
              )}

              {user.role === 'company_admin' && (
                <>
                  <Link to="/company/dashboard" className={linkClass('/company/dashboard')}>Dashboard</Link>
                  <Link to="/company/analytics" className={linkClass('/company/analytics')}>Analytics</Link>
                  <Link to="/company/billing" className={linkClass('/company/billing')}>Billing</Link>
                  <Link to="/company/settings" className={linkClass('/company/settings')}>Settings</Link>
                </>
              )}

              {user.role === 'consumer' && (
                <>
                  <Link to="/dashboard" className={`${linkClass('/dashboard')} relative`}>
                    Dashboard
                    {user.unread_replies > 0 && (
                      <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={{ background: 'var(--color-clay)', color: 'var(--color-paper)' }}>
                        {user.unread_replies > 9 ? '9+' : user.unread_replies}
                      </span>
                    )}
                  </Link>
                  <Link to="/complaints/new" className="btn btn-primary text-xs">
                    Submit complaint <Icon name="arrow-r" size={14} />
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-clay)] transition px-2 py-1.5"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]"
              >
                Sign in
              </Link>
              <Link
                to="/register?role=business"
                className="text-sm text-[color:var(--color-ink-2)] hover:text-[color:var(--color-eucalyptus)] transition-colors font-medium"
              >
                For Business
              </Link>
              <Link to="/register" className="btn btn-primary text-xs">
                Submit a complaint <Icon name="arrow-r" size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-paper-2)] transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <Icon name={menuOpen ? 'x' : 'menu'} size={18} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t hairline-2 bg-[color:var(--color-card)] px-4 py-3 space-y-1">
          {user ? (
            <>
              <p className="text-xs text-[color:var(--color-muted)] px-3 py-1">
                Signed in as <span className="font-medium text-[color:var(--color-ink)]">{user.name}</span>
              </p>
              {user.role === 'admin' && (
                <MobileLink to="/admin" onClick={() => setMenuOpen(false)}>Admin</MobileLink>
              )}
              {user.role === 'company_admin' && (
                <>
                  <MobileLink to="/company/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>
                  <MobileLink to="/company/analytics" onClick={() => setMenuOpen(false)}>Analytics</MobileLink>
                  <MobileLink to="/company/billing" onClick={() => setMenuOpen(false)}>Billing</MobileLink>
                  <MobileLink to="/company/settings" onClick={() => setMenuOpen(false)}>Settings</MobileLink>
                </>
              )}
              {user.role === 'consumer' && (
                <>
                  <MobileLink to="/complaints/new" onClick={() => setMenuOpen(false)}>Submit complaint</MobileLink>
                  <MobileLink to="/dashboard" onClick={() => setMenuOpen(false)}>
                    Dashboard
                    {user.unread_replies > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                        style={{ background: 'var(--color-clay)', color: 'var(--color-paper)' }}>
                        {user.unread_replies > 9 ? '9+' : user.unread_replies}
                      </span>
                    )}
                  </MobileLink>
                  <MobileLink to="/companies/register" onClick={() => setMenuOpen(false)}>Register business</MobileLink>
                </>
              )}
              <button
                onClick={() => { setMenuOpen(false); handleLogout() }}
                className="w-full text-left px-3 py-2 text-sm text-[color:var(--color-clay)] hover:bg-[color:var(--color-clay-soft)] rounded-lg transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <MobileLink to="/login" onClick={() => setMenuOpen(false)}>Sign in</MobileLink>
              <MobileLink to="/register" onClick={() => setMenuOpen(false)}>Submit a complaint</MobileLink>
              <MobileLink to="/register?role=business" onClick={() => setMenuOpen(false)}>For Business</MobileLink>
            </>
          )}
          <div className="border-t hairline-2 mt-2 pt-2 space-y-1">
            <MobileNavBtn onClick={() => { setMenuOpen(false); scrollTo('hero') }}>Companies</MobileNavBtn>
            <MobileNavBtn onClick={() => { setMenuOpen(false); scrollTo('leaderboard') }}>Leaderboard</MobileNavBtn>
            <MobileNavBtn onClick={() => { setMenuOpen(false); scrollTo('recent-complaints') }}>Recent complaints</MobileNavBtn>
            <MobileNavBtn onClick={() => { setMenuOpen(false); scrollTo('how-it-works') }}>How it works</MobileNavBtn>
          </div>
        </div>
      )}
    </nav>
  )
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 text-sm text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-2)] rounded-lg transition"
    >
      {children}
    </Link>
  )
}

function NavBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="hover:text-[color:var(--color-ink)] transition"
    >
      {children}
    </button>
  )
}

function MobileNavBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left px-3 py-2 text-sm text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-paper-2)] hover:text-[color:var(--color-ink)] rounded-lg transition"
    >
      {children}
    </button>
  )
}
