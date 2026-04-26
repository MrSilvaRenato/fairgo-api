import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import Icon from './Icon'

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
      setTimeout(scroll, 120)
    }
  }
}

function LogoMark({ size = 30 }) {
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
  const [menuOpen, setMenuOpen]       = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const scrollTo  = useScrollTo()
  const userMenuRef = useRef(null)

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname.startsWith(path)
  const linkCls = (path) =>
    `px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
      isActive(path)
        ? 'text-[color:var(--color-eucalyptus)] font-semibold'
        : 'text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-2)]'
    }`

  return (
    <nav className={`sticky top-0 z-40 transition-shadow duration-200 ${
      scrolled ? 'shadow-md' : 'shadow-none'
    }`}
      style={{ background: 'var(--color-paper)', borderBottom: '1px solid var(--color-line)' }}>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[68px] flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="Aus Fair Go — home">
          <LogoMark />
          <span className="font-display text-[20px] font-semibold tracking-tight hidden sm:block"
            style={{ color: 'var(--color-ink)' }}>
            Aus Fair Go
          </span>
        </Link>

        {/* Divider */}
        <div className="hidden lg:block w-px h-5 bg-[color:var(--color-line)] mx-1" />

        {/* Public nav links */}
        <div className="hidden lg:flex items-center gap-0.5">
          <NavBtn onClick={() => scrollTo('hero')}>Companies</NavBtn>
          <NavBtn onClick={() => scrollTo('leaderboard')}>Leaderboard</NavBtn>
          <Link to="/most-complained" className={linkCls('/most-complained')}>Most complained</Link>
          <NavBtn onClick={() => scrollTo('how-it-works')}>How it works</NavBtn>
        </div>

        <div className="flex-1" />

        {/* Auth / CTAs — desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {/* Consumer CTA stays visible outside dropdown */}
              {user.role === 'consumer' && (
                <Link to="/complaints/new" className="btn btn-primary text-xs px-4 py-2">
                  + New complaint
                </Link>
              )}

              {/* User dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-colors hover:bg-[color:var(--color-paper-2)]"
                  style={{ color: 'var(--color-ink)' }}>
                  <span className="text-xs text-[color:var(--color-muted)]">Hi,</span>
                  <span className="font-semibold">{user.name.split(' ')[0]}</span>
                  <Icon name="chevron-d" size={13} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-[color:var(--color-card)] border hairline rounded-2xl shadow-xl py-1.5 z-50">
                    <div className="px-3 py-2 border-b hairline mb-1">
                      <p className="text-xs font-semibold text-[color:var(--color-ink)] truncate">{user.name}</p>
                      <p className="text-[11px] text-[color:var(--color-muted)] capitalize">{user.role.replace('_', ' ')}</p>
                    </div>

                    {user.role === 'admin' && (
                      <DropdownLink to="/admin" onClick={() => setUserMenuOpen(false)}>
                        <Icon name="verified" size={14} /> Admin panel
                      </DropdownLink>
                    )}

                    {user.role === 'company_admin' && (
                      <>
                        <DropdownLink to="/company/dashboard" onClick={() => setUserMenuOpen(false)}>
                          <Icon name="chart" size={14} /> Dashboard
                        </DropdownLink>
                        <DropdownLink to="/company/analytics" onClick={() => setUserMenuOpen(false)}>
                          <Icon name="sparkle" size={14} /> Analytics
                        </DropdownLink>
                        <DropdownLink to="/company/settings" onClick={() => setUserMenuOpen(false)}>
                          <Icon name="settings" size={14} /> Settings
                        </DropdownLink>
                        <DropdownLink to="/company/billing" onClick={() => setUserMenuOpen(false)}>
                          <Icon name="billing" size={14} /> Billing
                        </DropdownLink>
                      </>
                    )}

                    {user.role === 'consumer' && (
                      <DropdownLink to="/dashboard" onClick={() => setUserMenuOpen(false)}>
                        <Icon name="chart" size={14} />
                        <span className="flex-1">Dashboard</span>
                        {user.unread_replies > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                            style={{ background: 'var(--color-clay)', color: 'var(--color-paper)' }}>
                            {user.unread_replies > 9 ? '9+' : user.unread_replies}
                          </span>
                        )}
                      </DropdownLink>
                    )}

                    <DropdownLink to="/profile" onClick={() => setUserMenuOpen(false)}>
                      <Icon name="user" size={14} /> Profile
                    </DropdownLink>

                    <div className="border-t hairline mt-1 pt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout() }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-colors hover:bg-[color:var(--color-clay-soft)]"
                        style={{ color: 'var(--color-clay)' }}>
                        <Icon name="logout" size={14} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--color-ink-2)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-ink)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-ink-2)'}>
                Sign in
              </Link>

              <Link to="/register?role=business"
                className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors border"
                style={{ color: 'var(--color-eucalyptus)', borderColor: 'var(--color-eucalyptus)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-eucalyptus)'; e.currentTarget.style.color = 'var(--color-paper)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-eucalyptus)' }}>
                For Business
              </Link>

              <Link to="/register" className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                Submit complaint <Icon name="arrow-r" size={13} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-xl transition-colors"
          style={{ color: 'var(--color-ink-2)' }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu">
          <Icon name={menuOpen ? 'x' : 'menu'} size={20} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-4 py-4 space-y-1"
          style={{ borderColor: 'var(--color-line)', background: 'var(--color-card)' }}>

          {user ? (
            <>
              <p className="text-xs px-3 py-1 mb-2" style={{ color: 'var(--color-muted)' }}>
                Signed in as <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{user.name}</span>
              </p>
              {user.role === 'admin' && <MobileLink to="/admin">Admin</MobileLink>}
              {user.role === 'company_admin' && (
                <>
                  <MobileLink to="/company/dashboard">Dashboard</MobileLink>
                  <MobileLink to="/company/analytics">Analytics</MobileLink>
                  <MobileLink to="/company/billing">Billing</MobileLink>
                  <MobileLink to="/company/settings">Settings</MobileLink>
                </>
              )}
              {user.role === 'consumer' && (
                <>
                  <MobileLink to="/complaints/new">
                    <span className="font-semibold" style={{ color: 'var(--color-eucalyptus)' }}>+ Submit complaint</span>
                  </MobileLink>
                  <MobileLink to="/dashboard">
                    Dashboard
                    {user.unread_replies > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                        style={{ background: 'var(--color-clay)', color: 'var(--color-paper)' }}>
                        {user.unread_replies > 9 ? '9+' : user.unread_replies}
                      </span>
                    )}
                  </MobileLink>
                </>
              )}
              <button onClick={() => { setMenuOpen(false); handleLogout() }}
                className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-colors mt-1"
                style={{ color: 'var(--color-clay)' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <MobileLink to="/login">Sign in</MobileLink>
              <MobileLink to="/register">
                <span className="font-semibold" style={{ color: 'var(--color-eucalyptus)' }}>Submit a complaint</span>
              </MobileLink>
              <MobileLink to="/register?role=business">For Business</MobileLink>
            </>
          )}

          <div className="border-t mt-3 pt-3 space-y-1" style={{ borderColor: 'var(--color-line)' }}>
            <p className="text-[10px] uppercase tracking-widest px-3 mb-1" style={{ color: 'var(--color-muted)' }}>Explore</p>
            <MobileNavBtn onClick={() => scrollTo('hero')}>Companies</MobileNavBtn>
            <MobileNavBtn onClick={() => scrollTo('leaderboard')}>Leaderboard</MobileNavBtn>
            <MobileLink to="/most-complained">Most complained</MobileLink>
            <MobileNavBtn onClick={() => scrollTo('how-it-works')}>How it works</MobileNavBtn>
          </div>
        </div>
      )}
    </nav>
  )
}

function DropdownLink({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-colors hover:bg-[color:var(--color-paper-2)]"
      style={{ color: 'var(--color-ink)' }}>
      {children}
    </Link>
  )
}

function NavBtn({ onClick, children }) {
  return (
    <button onClick={onClick}
      className="px-2.5 py-1.5 rounded-lg text-sm transition-colors text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-2)]">
      {children}
    </button>
  )
}

function MobileLink({ to, children }) {
  return (
    <Link to={to}
      className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-colors"
      style={{ color: 'var(--color-ink)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-paper-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {children}
    </Link>
  )
}

function MobileNavBtn({ onClick, children }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-colors"
      style={{ color: 'var(--color-ink-2)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-paper-2)'; e.currentTarget.style.color = 'var(--color-ink)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-2)' }}>
      {children}
    </button>
  )
}
