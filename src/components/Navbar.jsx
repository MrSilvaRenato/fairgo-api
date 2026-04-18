import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const active = (path) =>
    location.pathname.startsWith(path)
      ? 'text-green-600 font-medium'
      : 'text-gray-500 hover:text-gray-900'

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">FG</span>
          </div>
          <span className="text-lg font-bold text-gray-900 hidden sm:block">Fair Go</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 text-sm">
          {user ? (
            <>
              <span className="text-gray-400 text-xs px-3 py-1.5 rounded-lg">
                Hi, <span className="text-gray-700 font-medium">{user.name.split(' ')[0]}</span>
              </span>

              {user.role === 'admin' && (
                <NavLink to="/admin" active={active('/admin')}>Admin</NavLink>
              )}

              {user.role === 'company_admin' && (
                <>
                  <NavLink to="/company/dashboard" active={active('/company/dashboard')}>Dashboard</NavLink>
                  <NavLink to="/company/analytics" active={active('/company/analytics')}>Analytics</NavLink>
                  <NavLink to="/company/billing" active={active('/company/billing')}>Billing</NavLink>
                </>
              )}

              {user.role === 'consumer' && (
                <>
                  <NavLink to="/complaints/new" active={active('/complaints/new')}>
                    <span className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
                      Submit complaint
                    </span>
                  </NavLink>
                  <NavLink to="/dashboard" active={active('/dashboard')}>Dashboard</NavLink>
                  <NavLink to="/companies/register" active={active('/companies/register')}>Register business</NavLink>
                </>
              )}

              <button
                onClick={handleLogout}
                className="ml-2 text-gray-400 hover:text-red-500 transition text-xs px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" active={active('/login')}>Login</NavLink>
              <Link
                to="/register"
                className="ml-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-green-700 transition shadow-sm"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {user ? (
            <>
              <p className="text-xs text-gray-400 px-3 py-1">
                Signed in as <span className="font-medium text-gray-700">{user.name}</span>
              </p>
              {user.role === 'admin' && (
                <MobileLink to="/admin" onClick={() => setMenuOpen(false)}>Admin</MobileLink>
              )}
              {user.role === 'company_admin' && (
                <>
                  <MobileLink to="/company/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>
                  <MobileLink to="/company/analytics" onClick={() => setMenuOpen(false)}>Analytics</MobileLink>
                  <MobileLink to="/company/billing" onClick={() => setMenuOpen(false)}>Billing</MobileLink>
                </>
              )}
              {user.role === 'consumer' && (
                <>
                  <MobileLink to="/complaints/new" onClick={() => setMenuOpen(false)}>Submit complaint</MobileLink>
                  <MobileLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>
                  <MobileLink to="/companies/register" onClick={() => setMenuOpen(false)}>Register business</MobileLink>
                </>
              )}
              <button
                onClick={() => { setMenuOpen(false); handleLogout() }}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <MobileLink to="/login" onClick={() => setMenuOpen(false)}>Login</MobileLink>
              <MobileLink to="/register" onClick={() => setMenuOpen(false)}>Get started</MobileLink>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} className={`px-3 py-1.5 rounded-lg transition text-sm ${active}`}>
      {children}
    </Link>
  )
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
    >
      {children}
    </Link>
  )
}
