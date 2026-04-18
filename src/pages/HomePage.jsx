import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'

/* ── config ─────────────────────────────────────────────── */
const BADGE = {
  excellent: { label: 'Excellent', pill: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-400', bar: 'bg-emerald-500' },
  good:      { label: 'Good',      pill: 'bg-sky-100 text-sky-700',         ring: 'ring-sky-400',     bar: 'bg-sky-500'     },
  regular:   { label: 'Regular',   pill: 'bg-amber-100 text-amber-700',     ring: 'ring-amber-400',   bar: 'bg-amber-400'   },
  poor:      { label: 'Poor',      pill: 'bg-rose-100 text-rose-700',       ring: 'ring-rose-400',    bar: 'bg-rose-400'    },
  not_rated: { label: 'Not rated', pill: 'bg-gray-100 text-gray-500',       ring: 'ring-gray-300',    bar: 'bg-gray-300'    },
}
const STATUS_STYLE = {
  open:              'bg-sky-50 text-sky-600 border border-sky-100',
  awaiting_response: 'bg-amber-50 text-amber-700 border border-amber-100',
  responded:         'bg-violet-50 text-violet-600 border border-violet-100',
  resolved:          'bg-emerald-50 text-emerald-600 border border-emerald-100',
  unresolved:        'bg-rose-50 text-rose-500 border border-rose-100',
  expired:           'bg-gray-50 text-gray-400 border border-gray-100',
}
const STATUS_LABEL = {
  open: 'Open', awaiting_response: 'Awaiting response',
  responded: 'Responded', resolved: 'Resolved',
  unresolved: 'Unresolved', expired: 'Expired',
}
const CATEGORY_ICON = {
  billing: '💳', delivery: '📦', service: '🛎️',
  refund: '💸', fraud: '⚠️', other: '📝',
}
const INDUSTRY_ICON = {
  retail: '🛍️', telco: '📱', finance: '🏦', insurance: '🛡️',
  utilities: '💡', travel: '✈️', health: '❤️', automotive: '🚗',
  food: '🍔', tech: '💻', real_estate: '🏠', education: '📚', other: '🏢',
}

/* ─────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // Search
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [open,      setOpen]      = useState(false)
  const searchRef = useRef(null)

  // Feed
  const [complaints,   setComplaints]   = useState([])
  const [loadingFeed,  setLoadingFeed]  = useState(true)

  // Leaderboard
  const [leaderboard,  setLeaderboard]   = useState([])
  const [industries,   setIndustries]    = useState([])
  const [activeIndustry, setActiveIndustry] = useState('all')
  const [loadingBoard, setLoadingBoard]  = useState(true)
  const [boardMode,    setBoardMode]     = useState('best') // best | worst
  const [moreOpen,     setMoreOpen]      = useState(false)
  const moreRef = useRef(null)
  const TOP_N = 4

  /* close dropdowns on outside click */
  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false)
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* search debounce */
  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try { const r = await api.get('/search', { params: { q: query } }); setResults(r.data); setOpen(true) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  /* recent complaints */
  useEffect(() => {
    api.get('/complaints', { params: { per_page: 6 } })
      .then((r) => setComplaints(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingFeed(false))
  }, [])

  /* leaderboard */
  useEffect(() => {
    setLoadingBoard(true)
    api.get('/leaderboard', { params: { industry: activeIndustry } })
      .then((r) => { setLeaderboard(r.data.companies); setIndustries(r.data.industries) })
      .catch(() => {})
      .finally(() => setLoadingBoard(false))
  }, [activeIndustry])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (results.length > 0) navigate(`/companies/${results[0].slug}`)
  }

  const displayList = boardMode === 'best'
    ? leaderboard
    : [...leaderboard].reverse()

  return (
    <div className="-mt-8 space-y-0">

      {/* ═══════════════════════════════════════════ HERO */}
      <section className="relative overflow-hidden rounded-3xl mb-12 bg-white border border-gray-100 shadow-sm">
        {/* Subtle decorative blobs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-green-100 rounded-full opacity-50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-emerald-100 rounded-full opacity-40 blur-3xl pointer-events-none" />

        <div className="relative px-6 py-16 sm:py-24">
          <div className="max-w-2xl mx-auto text-center">

            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 border border-green-200 bg-green-50 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Australia's consumer complaint platform
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-[1.1] tracking-tight">
              Real complaints.<br />
              <span className="text-green-600">Real accountability.</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed">
              Submit your complaint publicly, get a company response, and help millions of Australians make smarter decisions.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative" ref={searchRef}>
              <form onSubmit={handleSubmit}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-lg focus-within:ring-2 focus-within:ring-green-300 focus-within:border-transparent transition">
                <div className="flex flex-1 items-center gap-2 px-3">
                  {searching
                    ? <svg className="w-4 h-4 text-green-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  }
                  <input value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search a company name…"
                    className="flex-1 text-sm py-2.5 outline-none bg-transparent placeholder-gray-400 text-gray-900"
                    autoComplete="off" />
                </div>
                <button type="submit" className="btn-primary shrink-0">Search</button>
              </form>

              {/* Dropdown */}
              {open && results.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                  {results.map((c) => {
                    const b = BADGE[c.badge] ?? BADGE.not_rated
                    return (
                      <li key={c.id}>
                        <Link to={`/companies/${c.slug}`} onClick={() => setOpen(false)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center shrink-0">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-sm text-gray-900 truncate">{c.name}</p>
                              {c.industry && <p className="text-xs text-gray-400 capitalize">{c.industry}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.pill}`}>{b.label}</span>
                            <span className="text-xs text-gray-400">{c.total} complaints</span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
              {open && query.length >= 2 && results.length === 0 && !searching && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-5 text-sm text-gray-500 text-center">
                  No company found —{' '}
                  <Link to="/companies/register" className="text-green-600 hover:underline font-medium">register yours</Link>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3 mt-7 text-sm">
              {user ? (
                <Link to="/complaints/new" className="btn-primary inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Submit a complaint
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary inline-flex items-center gap-2">
                    Get started — it's free
                  </Link>
                  <Link to="/login" className="btn-secondary">Sign in</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ HOW IT WORKS */}
      <section className="mb-14">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">How it works</p>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Three steps to accountability</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              n: '01', emoji: '✍️', color: 'bg-green-50 border-green-100',
              title: 'Submit your complaint',
              desc:  'Tell your story publicly. The company is notified and must respond within 7 days.',
            },
            {
              n: '02', emoji: '💬', color: 'bg-sky-50 border-sky-100',
              title: 'Company responds',
              desc:  'They reply on the record — all future customers can see how they handle issues.',
            },
            {
              n: '03', emoji: '⭐', color: 'bg-violet-50 border-violet-100',
              title: 'You rate & close',
              desc:  'Your rating updates their public score permanently. Good companies rise, bad ones get exposed.',
            },
          ].map((s) => (
            <div key={s.n} className={`rounded-2xl border p-6 ${s.color} flex flex-col gap-3`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-xs font-bold text-gray-400 tracking-wider">{s.n}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-base">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ LEADERBOARD */}
      <section className="mb-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Company rankings</p>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Best & worst rated businesses</h2>
          </div>

          {/* Best / Worst toggle */}
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1 w-fit">
            {[['best','🏆 Best'],['worst','💀 Worst']].map(([v,l]) => (
              <button key={v} onClick={() => setBoardMode(v)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition ${boardMode === v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Industry filter — top N pills + "More" dropdown */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          {/* Always-visible: All + first TOP_N */}
          {['all', ...industries.slice(0, TOP_N)].map((ind) => (
            <button key={ind} onClick={() => { setActiveIndustry(ind); setMoreOpen(false) }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                activeIndustry === ind
                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'
              }`}>
              {ind === 'all' ? '🌐 All industries' : `${INDUSTRY_ICON[ind] ?? '🏢'} ${ind.charAt(0).toUpperCase() + ind.slice(1)}`}
            </button>
          ))}

          {/* "More" trigger — only when there are overflow industries */}
          {industries.length > TOP_N && (
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition flex items-center gap-1 whitespace-nowrap ${
                  moreOpen || industries.slice(TOP_N).includes(activeIndustry)
                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'
                }`}>
                {industries.slice(TOP_N).includes(activeIndustry)
                  ? `${INDUSTRY_ICON[activeIndustry] ?? '🏢'} ${activeIndustry.charAt(0).toUpperCase() + activeIndustry.slice(1)}`
                  : `+${industries.length - TOP_N} more`}
                <svg className={`w-3 h-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {moreOpen && (
                <div className="absolute left-0 top-full mt-2 z-20 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 min-w-[180px]">
                  {industries.slice(TOP_N).map((ind) => (
                    <button key={ind} onClick={() => { setActiveIndustry(ind); setMoreOpen(false) }}
                      className={`w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition ${
                        activeIndustry === ind ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50'
                      }`}>
                      <span>{INDUSTRY_ICON[ind] ?? '🏢'}</span>
                      {ind.charAt(0).toUpperCase() + ind.slice(1)}
                      {activeIndustry === ind && (
                        <svg className="w-3 h-3 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {loadingBoard ? (
          <div className="card divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-6 h-4 bg-gray-100 rounded" />
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/5" />
                </div>
                <div className="w-12 h-6 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-gray-500 text-sm">No ranked companies yet in this category.</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-50 overflow-hidden">
            {displayList.map((c, i) => {
              const b = BADGE[c.badge] ?? BADGE.not_rated
              const rank = boardMode === 'best' ? i + 1 : displayList.length - i
              return (
                <Link key={c.id} to={`/companies/${c.slug}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group">
                  {/* Rank */}
                  <span className={`text-sm font-bold w-6 text-center shrink-0 ${i < 3 && boardMode === 'best' ? 'text-amber-500' : 'text-gray-300'}`}>
                    {i < 3 && boardMode === 'best' ? ['🥇','🥈','🥉'][i] : `${rank}`}
                  </span>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ring-2 ${b.ring} bg-white`}>
                    {INDUSTRY_ICON[c.industry] ?? c.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name & industry */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-green-700 transition">{c.name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{c.industry ?? 'Unknown industry'} · {c.total} complaints</p>
                  </div>

                  {/* Score bar + badge */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="w-24">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Score</span>
                        <span className="font-semibold text-gray-700">{c.score}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${b.bar} transition-all duration-500`} style={{ width: `${c.score}%` }} />
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${b.pill}`}>{b.label}</span>
                  </div>

                  {/* Mobile: just score */}
                  <div className="sm:hidden shrink-0 text-right">
                    <span className="text-sm font-bold text-gray-800">{c.score}</span>
                    <p className={`text-[10px] font-medium mt-0.5 ${b.pill.split(' ')[1]}`}>{b.label}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════ RECENT COMPLAINTS */}
      <section className="mb-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Live feed</p>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recent complaints</h2>
          </div>
          <Link to="/complaints" className="hidden sm:flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium">
            View all
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {loadingFeed ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="flex gap-2"><div className="h-5 bg-gray-100 rounded-full w-20" /><div className="h-5 bg-gray-100 rounded-full w-16" /></div>
                <div className="h-5 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded" /><div className="h-4 bg-gray-100 rounded w-4/5" />
                <div className="h-3 bg-gray-100 rounded w-1/3 mt-2" />
              </div>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 text-sm mb-4">No public complaints yet — be the first.</p>
            <Link to={user ? '/complaints/new' : '/register'} className="btn-primary inline-block">
              Submit a complaint
            </Link>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {complaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
            </div>
            <div className="text-center mt-5 sm:hidden">
              <Link to="/complaints" className="btn-secondary text-sm">View all complaints</Link>
            </div>
          </>
        )}
      </section>

      {/* ═══════════════════════════════════════════ VALUE PROPS */}
      <section className="grid sm:grid-cols-3 gap-4 mb-14">
        {[
          {
            bg: 'bg-green-600', icon: '🆓',
            title: 'Always free for consumers',
            desc: 'Submit complaints, follow up, and rate companies at zero cost — forever.',
          },
          {
            bg: 'bg-gray-900', icon: '🔍',
            title: 'Transparent on the public record',
            desc: 'Every complaint is visible. Companies can\'t hide — good and bad behaviour is permanent.',
          },
          {
            bg: 'bg-sky-600', icon: '📈',
            title: 'Scores companies can earn back',
            desc: 'Businesses that resolve issues improve their score. It\'s fair — like it should be.',
          },
        ].map((v) => (
          <div key={v.title} className={`${v.bg} rounded-2xl p-6 text-white`}>
            <span className="text-3xl block mb-3">{v.icon}</span>
            <h3 className="font-bold text-base mb-2">{v.title}</h3>
            <p className="text-sm opacity-75 leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </section>

      {/* ═══════════════════════════════════════════ BOTTOM CTA */}
      {!user && (
        <section className="card p-10 sm:p-14 text-center mb-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-sky-50 opacity-60" />
          <div className="relative">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ready?</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
              Your voice matters. Use it.
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              Join Fair Go — Australia's platform where consumer voices create real change for businesses.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/register" className="btn-primary px-8 py-3 text-sm">
                Create free account
              </Link>
              <Link to="/companies/register" className="btn-secondary px-8 py-3 text-sm">
                Register your business
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}

/* ─── Complaint card component ──────────────────────────── */
function ComplaintCard({ complaint }) {
  const statusStyle = STATUS_STYLE[complaint.status] ?? STATUS_STYLE.open
  const statusLabel = STATUS_LABEL[complaint.status] ?? 'Open'
  const icon = CATEGORY_ICON[complaint.category] ?? '📝'
  const daysAgo = Math.floor((Date.now() - new Date(complaint.created_at)) / 86400000)

  return (
    <Link to={`/complaints/${complaint.id}`}
      className="card p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusStyle}`}>{statusLabel}</span>
        <span className="text-xs text-gray-400 capitalize">{icon} {complaint.category}</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors leading-snug">
        {complaint.title}
      </h3>
      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{complaint.description}</p>
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
        <span className="text-xs text-gray-400">
          vs <span className="font-medium text-gray-700">{complaint.company?.name}</span>
        </span>
        <span className="text-xs text-gray-400">
          {daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo}d ago`}
        </span>
      </div>
    </Link>
  )
}
