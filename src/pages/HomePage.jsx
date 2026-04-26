import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import CompanyLogo from '../components/CompanyLogo'
import Icon from '../components/Icon'
import AiReviewedBadge from '../components/AiReviewedBadge'
import ScoreMeter, { BAND } from '../components/ScoreMeter'
import useSeoMeta from '../hooks/useSeoMeta'

/* ── display config ─────────────────────────────────────── */
const STATUS_STYLE = {
  open:              { label: 'Open',        fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)', dot: 'var(--color-eucalyptus)' },
  awaiting_response: { label: 'Awaiting',    fg: '#8A5A1F',                 bg: '#F3E2C3',                   dot: '#D8A24A' },
  responded:         { label: 'Responded',   fg: '#3B4B7A',                 bg: '#DAE0EE',                   dot: '#5A6FA8' },
  resolved:          { label: 'Resolved',    fg: 'var(--color-eucalyptus)', bg: '#E7EEDF',                   dot: '#3E7560' },
  unresolved:        { label: 'Unresolved',  fg: 'var(--color-clay)',       bg: 'var(--color-clay-soft)',    dot: 'var(--color-clay)' },
  expired:           { label: 'Expired',     fg: 'var(--color-muted)',      bg: 'var(--color-paper-2)',      dot: 'var(--color-muted)' },
}

const FEED_STATUS_OPTS = [
  { value: '',                  label: 'All' },
  { value: 'open',              label: 'Open',        dot: 'var(--color-eucalyptus)' },
  { value: 'responded',         label: 'Responded',   dot: '#5A6FA8' },
  { value: 'resolved',          label: 'Resolved',    dot: '#3E7560' },
  { value: 'unresolved',        label: 'Unresolved',  dot: 'var(--color-clay)' },
  { value: 'awaiting_response', label: 'Awaiting',    dot: '#D8A24A' },
]

const FEED_CATEGORY_OPTS = [
  { value: '',          label: 'All',      emoji: null  },
  { value: 'billing',   label: 'Billing',  emoji: '💳' },
  { value: 'delivery',  label: 'Delivery', emoji: '📦' },
  { value: 'service',   label: 'Service',  emoji: '🎧' },
  { value: 'refund',    label: 'Refund',   emoji: '↩️' },
  { value: 'fraud',     label: 'Fraud',    emoji: '⚠️' },
]

/* ─────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useSeoMeta({
    title: 'Australian consumer complaints & business accountability',
    description: 'Aus Fair Go gives Australian consumers a voice. File complaints, track resolutions, and hold businesses accountable. Completely transparent.',
    url: 'https://ausfairgo.com.au/',
  })

  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ companies: [], complaints: [] })
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const searchRef = useRef(null)

  const [complaints, setComplaints]           = useState([])
  const [complaintsTotal, setComplaintsTotal] = useState(0)
  const [loadingFeed, setLoadingFeed]         = useState(true)

  // Feed filters
  const [feedSearch,   setFeedSearch]   = useState('')
  const [feedStatus,   setFeedStatus]   = useState('')
  const [feedCategory, setFeedCategory] = useState('')
  const feedSearchTimer = useRef(null)
  const [feedExpanded, setFeedExpanded] = useState(false)
  const [feedCounts, setFeedCounts] = useState({ category: {}, status: {} })

  const [leaderboard, setLeaderboard] = useState([])
  const [industries, setIndustries] = useState([])
  const [activeIndustry, setActiveIndustry] = useState('all')
  const [loadingBoard, setLoadingBoard] = useState(true)
  const [boardMode, setBoardMode]       = useState('best')
  const [claimedOnly, setClaimedOnly]   = useState(false)
  const [moreOpen, setMoreOpen]         = useState(false)

  // Companies browse
  const [managedQuery,   setManagedQuery]   = useState('')
  const [showAllCompanies, setShowAllCompanies] = useState(true)
  const [claimedList,    setClaimedList]    = useState([])
  const [allList,        setAllList]        = useState([])
  const [managedLoading, setManagedLoading] = useState(true)

  // Load all companies on mount
  useEffect(() => {
    api.get('/complaints/company-search')
      .then((r) => setAllList(r.data ?? []))
      .catch(() => {})
      .finally(() => setManagedLoading(false))
  }, [])

  // Load claimed companies (used for stat bar + toggled view)
  useEffect(() => {
    if (claimedList.length > 0) return
    api.get('/complaints/company-search', { params: { claimed: true } })
      .then((r) => setClaimedList(r.data ?? []))
      .catch(() => {})
  }, [])

  // Search always queries all
  useEffect(() => {
    if (!managedQuery) return
    const t = setTimeout(() => {
      api.get('/complaints/company-search', { params: { q: managedQuery } })
        .then((r) => setAllList(r.data ?? []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [managedQuery])

  const displayedCompanies = managedQuery
    ? allList
    : showAllCompanies ? allList : claimedList
  const moreRef                         = useRef(null)
  const VISIBLE_PILLS                   = 4

  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false)
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults({ companies: [], complaints: [] }); setOpen(false); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await api.get('/search', { params: { q: query } })
        setResults(r.data); setOpen(true)
      } finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Fetch category + status counts — refresh when either filter changes
  useEffect(() => {
    api.get('/complaints/category-counts', {
      params: {
        ...(feedStatus   ? { status: feedStatus }     : {}),
        ...(feedCategory ? { category: feedCategory } : {}),
      },
    })
      .then(r => setFeedCounts({ category: r.data?.category ?? {}, status: r.data?.status ?? {} }))
      .catch(() => {})
  }, [feedStatus, feedCategory])

  useEffect(() => {
    clearTimeout(feedSearchTimer.current)
    feedSearchTimer.current = setTimeout(() => {
      setLoadingFeed(true)
      api.get('/complaints', {
        params: {
          per_page: 10,
          q:        feedSearch   || undefined,
          status:   feedStatus   || undefined,
          category: feedCategory || undefined,
        },
      })
        .then((r) => {
          setComplaints(r.data.data ?? [])
          // Only update total when no filters active (used for trust bar)
          if (!feedSearch && !feedStatus && !feedCategory) {
            setComplaintsTotal(r.data.total ?? 0)
          }
        })
        .catch(() => {})
        .finally(() => setLoadingFeed(false))
    }, feedSearch ? 350 : 0)
    return () => clearTimeout(feedSearchTimer.current)
  }, [feedSearch, feedStatus, feedCategory])

  useEffect(() => {
    setLoadingBoard(true)
    api.get('/leaderboard', { params: { industry: activeIndustry } })
      .then((r) => { setLeaderboard(r.data.companies ?? []); setIndustries(r.data.industries ?? []) })
      .catch(() => {})
      .finally(() => setLoadingBoard(false))
  }, [activeIndustry])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    setOpen(false)
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const displayList = useMemo(() => {
    // Never surface not_rated companies in the leaderboard — they don't have enough data
    let rated = (leaderboard ?? []).filter((c) => c.badge !== 'not_rated')
    if (claimedOnly) rated = rated.filter((c) => c.claimed)
    return boardMode === 'best' ? rated : [...rated].reverse()
  }, [boardMode, leaderboard, claimedOnly])

  return (
    <div className="-mt-8">
      {/* ═══════════════ HERO ═══════════════ */}
      <section id="hero" className="relative overflow-hidden mb-16">
        <div
          className="absolute -top-24 right-[-120px] w-[420px] h-[420px] rounded-full opacity-[0.18] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-ochre) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full opacity-[0.14] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-eucalyptus) 0%, transparent 70%)' }}
        />

        <div className="relative px-2 sm:px-6 py-12 sm:py-16 lg:grid lg:grid-cols-2 lg:gap-14 lg:items-center">
          {/* ── Left column ── */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-6 caps" style={{ color: 'var(--color-eucalyptus)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-eucalyptus)' }} />
              Australia's public complaint record
            </div>

            <h1 className="font-display text-[46px] sm:text-[64px] lg:text-[62px] xl:text-[72px] leading-[1.02] font-semibold tracking-tight mb-5">
              File it once.<br />
              <span className="italic-display" style={{ color: 'var(--color-ochre)' }}>
                Public forever.
              </span>
            </h1>
            <p className="text-[17px] sm:text-[18px] text-[color:var(--color-ink-2)] max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10">
              A public, searchable record of how Australian businesses treat their customers.
              Free for consumers. The company has 7 days to respond.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto lg:mx-0 relative text-left" ref={searchRef}>
              <form onSubmit={handleSubmit}
                className="flex items-center gap-2 bg-[color:var(--color-card)] border hairline rounded-2xl p-1.5 shadow-sm focus-within:border-[color:var(--color-eucalyptus)] focus-within:shadow-[0_0_0_3px_rgba(47,93,76,.12)] transition">
                <div className="flex flex-1 items-center gap-2 px-3">
                  {searching
                    ? <Icon name="sparkle" size={16} className="text-[color:var(--color-eucalyptus)] animate-spin shrink-0" />
                    : <Icon name="search" size={16} className="text-[color:var(--color-muted)] shrink-0" />
                  }
                  <input value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search any Australian business…"
                    className="flex-1 text-sm py-2.5 outline-none bg-transparent placeholder-[color:var(--color-muted)] text-[color:var(--color-ink)]"
                    autoComplete="off" />
                </div>
                <button type="submit" className="btn btn-primary shrink-0">
                  Search <Icon name="arrow-r" size={14} />
                </button>
              </form>

              {open && (results.companies.length > 0 || results.complaints.length > 0) && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-[color:var(--color-card)] rounded-2xl shadow-2xl border hairline overflow-hidden">
                  {results.companies.length > 0 && (
                    <ul>
                      {results.companies.slice(0, 5).map((c) => {
                        const b = BAND[c.badge] ?? BAND.not_rated
                        return (
                          <li key={c.id}>
                            <Link to={`/companies/${c.slug}`} onClick={() => setOpen(false)}
                              className="flex items-center justify-between px-4 py-3 hover:bg-[color:var(--color-paper-2)] transition gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <CompanyLogo company={c} size="sm" />
                                <div className="truncate">
                                  <p className="font-medium text-sm text-[color:var(--color-ink)] truncate">{c.name}</p>
                                  {c.industry && <p className="text-xs text-[color:var(--color-muted)] capitalize">{c.industry}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                      style={{ color: b.text, background: 'var(--color-paper-2)' }}>
                                  {b.label}
                                </span>
                                <span className="text-xs text-[color:var(--color-muted)] font-mono">{c.total}</span>
                              </div>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {results.complaints.length > 0 && (
                    <div className="border-t hairline">
                      <p className="caps text-[color:var(--color-muted)] px-4 pt-2 pb-1">Complaints</p>
                      <ul>
                        {results.complaints.slice(0, 3).map((c) => (
                          <li key={c.id}>
                            <Link to={`/complaints/${c.id}`} onClick={() => setOpen(false)}
                              className="flex items-start gap-3 px-4 py-2.5 hover:bg-[color:var(--color-paper-2)] transition">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[color:var(--color-ink)] truncate">{c.title}</p>
                                <p className="text-xs text-[color:var(--color-muted)]">{c.company?.name} · <span className="capitalize">{c.category}</span></p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="border-t hairline px-4 py-2">
                    <button onClick={handleSubmit} className="text-xs text-[color:var(--color-eucalyptus)] hover:underline font-medium">
                      See all results for "{query}" →
                    </button>
                  </div>
                </div>
              )}
              {open && query.length >= 2 && results.companies.length === 0 && results.complaints.length === 0 && !searching && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-[color:var(--color-card)] rounded-2xl shadow-xl border hairline px-4 py-5 text-sm text-[color:var(--color-muted)] text-center">
                  No match —{' '}
                  <Link to="/companies/register" className="text-[color:var(--color-eucalyptus)] hover:underline font-medium">
                    register a business
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-7 text-sm">
              {user ? (
                <Link to="/complaints/new" className="btn btn-primary">
                  <Icon name="plus" size={14} /> Submit a complaint
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">
                    Get started — it's free
                  </Link>
                  <Link to="/login" className="btn btn-secondary">Sign in</Link>
                </>
              )}
            </div>
          </div>

          {/* ── Right column — live feed widget (desktop only) ── */}
          <div className="hidden lg:flex flex-col gap-0 self-center">
            <div className="rounded-[20px] overflow-hidden border hairline shadow-xl"
              style={{ background: 'var(--color-card)' }}>
              {/* Widget header */}
              <div className="flex items-center justify-between px-5 py-4 border-b hairline"
                style={{ background: 'var(--color-paper-2)' }}>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: 'var(--color-eucalyptus)' }} />
                    <span className="relative inline-flex rounded-full h-2 w-2"
                      style={{ background: 'var(--color-eucalyptus)' }} />
                  </span>
                  <span className="caps text-[11px]" style={{ color: 'var(--color-eucalyptus)' }}>
                    Live on Aus Fair Go
                  </span>
                </div>
                {complaintsTotal > 0 && (
                  <span className="text-[11px] font-mono text-[color:var(--color-muted)]">
                    {complaintsTotal.toLocaleString('en-AU')} total
                  </span>
                )}
              </div>

              {/* Feed rows */}
              {loadingFeed ? (
                <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-[color:var(--color-paper-2)] shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-[color:var(--color-paper-2)] rounded w-3/4" />
                        <div className="h-2.5 bg-[color:var(--color-paper-2)] rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                  {complaints.slice(0, 5).map((c) => <ComplaintFeedRow key={c.id} complaint={c} />)}
                </div>
              )}

              {/* Widget footer */}
              <div className="px-5 py-3 border-t hairline flex items-center justify-between"
                style={{ background: 'var(--color-paper-2)' }}>
                <p className="text-[11px] text-[color:var(--color-muted)]">Updated in real time</p>
                <Link to="/complaints"
                  className="text-[11px] font-medium flex items-center gap-1 hover:underline underline-offset-4"
                  style={{ color: 'var(--color-eucalyptus)' }}>
                  View all <Icon name="arrow-r" size={11} />
                </Link>
              </div>
            </div>

            {/* Mini trust signals under the widget */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { value: '7 days', sub: 'response window' },
                { value: '100%', sub: 'public record' },
                { value: 'Free', sub: 'for consumers' },
              ].map((s) => (
                <div key={s.sub} className="rounded-2xl border hairline px-3 py-3 text-center"
                  style={{ background: 'var(--color-card)' }}>
                  <p className="font-display text-[16px] font-semibold leading-none text-[color:var(--color-ink)]">{s.value}</p>
                  <p className="text-[10px] text-[color:var(--color-muted)] mt-1 leading-snug">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS TRUST BAR ═══════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
        {[
          { value: complaintsTotal > 0 ? complaintsTotal.toLocaleString('en-AU') : '…', label: 'Complaints on record' },
          { value: claimedList.length > 0 ? `${claimedList.length}+` : '…',             label: 'Businesses monitored' },
          { value: '7 days',                                                              label: 'Company response window' },
          { value: 'Always free',                                                         label: 'For consumers' },
        ].map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <p className="font-display text-[22px] sm:text-[26px] font-semibold leading-none text-[color:var(--color-ink)] mb-1.5">
              {s.value}
            </p>
            <p className="text-xs text-[color:var(--color-muted)] leading-snug">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="mb-16">
        <div className="text-center mb-10">
          <div className="caps mb-2">How it works</div>
          <h2 className="font-display text-[32px] sm:text-[40px] font-semibold tracking-tight">
            Three steps to accountability
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { n: '01', title: 'Submit your complaint',
              desc: 'Tell your story publicly. The company is notified and has 7 days to respond on the record.' },
            { n: '02', title: 'Company responds',
              desc: 'Their reply is public and permanent. Future customers see how they handle real issues.' },
            { n: '03', title: 'You rate & close',
              desc: 'Only you can mark it resolved. Your rating moves the company score — fairly, either way.' },
          ].map((s) => (
            <div key={s.n} className="card p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-display italic-display text-[40px] leading-none" style={{ color: 'var(--color-ochre)' }}>
                  {s.n}
                </span>
                <span className="w-10 h-[1px]" style={{ background: 'var(--color-line)' }} />
              </div>
              <h3 className="font-display text-[20px] font-semibold">{s.title}</h3>
              <p className="text-sm text-[color:var(--color-ink-2)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ COMPANIES BROWSE ═══════════════ */}
      <section id="actively-managed" className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="caps mb-1" style={{ color: 'var(--color-eucalyptus)' }}>
              {showAllCompanies ? '🏢 All registered businesses' : '✅ Actively managed'}
            </div>
            <h2 className="font-display text-[32px] font-semibold tracking-tight">
              Businesses on the platform
            </h2>
            <p className="text-sm text-[color:var(--color-muted)] mt-1">
              {showAllCompanies
                ? 'All Australian businesses registered on Aus Fair Go.'
                : 'Companies actively managing their profile on Aus Fair Go.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setShowAllCompanies(true); setManagedQuery('') }}
              className={`text-sm px-4 py-2 rounded-full font-medium transition border ${
                showAllCompanies
                  ? 'text-[color:var(--color-paper)] border-[color:var(--color-ink)]'
                  : 'text-[color:var(--color-ink-2)] border-[color:var(--color-line)] hover:border-[color:var(--color-ink-2)]'
              }`}
              style={showAllCompanies ? { background: 'var(--color-ink)' } : {}}>
              All registered
            </button>
            <button
              onClick={() => { setShowAllCompanies(false); setManagedQuery('') }}
              className={`text-sm px-4 py-2 rounded-full font-medium transition border ${
                !showAllCompanies
                  ? 'border-[color:var(--color-eucalyptus)]'
                  : 'text-[color:var(--color-ink-2)] border-[color:var(--color-line)] hover:border-[color:var(--color-eucalyptus)]'
              }`}
              style={!showAllCompanies ? { background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' } : {}}>
              ✅ Actively managed
            </button>
          </div>
        </div>

        {/* Search */}
        {(
          <div className="relative mb-4 max-w-sm">
            <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] pointer-events-none" />
            <input
              value={managedQuery}
              onChange={(e) => setManagedQuery(e.target.value)}
              placeholder="Search all businesses…"
              className="input pl-9 text-sm"
              autoFocus={showAllCompanies}
            />
          </div>
        )}

        {managedLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-4 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-[color:var(--color-paper-2)] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[color:var(--color-paper-2)] rounded w-2/3" />
                  <div className="h-3 bg-[color:var(--color-paper-2)] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedCompanies.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-display italic-display text-[20px] mb-1">No businesses found.</p>
            <p className="text-sm text-[color:var(--color-muted)]">Try a different search term.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedCompanies.map((c) => {
                const b = BAND[c.badge] ?? BAND.not_rated
                return (
                  <div key={c.id} className="card p-4 flex flex-col gap-2">
                    <Link to={`/companies/${c.slug}`}
                      className="flex items-center gap-3 group">
                      <CompanyLogo company={c} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-4 decoration-[color:var(--color-ink)]/30">
                          {c.name}
                        </p>
                        <p className="text-xs text-[color:var(--color-muted)] capitalize mt-0.5">
                          {c.industry ?? 'Unknown'}
                          {c.total > 0 && <> · {c.total} complaint{c.total !== 1 ? 's' : ''}</>}
                        </p>
                      </div>
                      {c.badge !== 'not_rated' && (
                        <span className="text-[10px] font-semibold caps shrink-0" style={{ color: b.text }}>
                          {b.label}
                        </span>
                      )}
                    </Link>

                    {c.claimed ? (
                      <div className="flex items-center gap-1.5 pt-1 border-t hairline">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="9" fill="#2F5D4C"/>
                          <path d="M6 10.5l3 3 5-5" stroke="#F5F0E6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--color-eucalyptus)' }}>
                          Verified & actively managed
                        </span>
                      </div>
                    ) : (
                      <div className="pt-1 border-t hairline">
                        <Link
                          to={user ? `/companies/${c.slug}/claim` : `/register?role=business&next=/companies/${c.slug}/claim`}
                          className="text-[11px] text-[color:var(--color-muted)] hover:text-[color:var(--color-eucalyptus)] transition">
                          Is this your business?{' '}
                          <span className="underline underline-offset-2">Claim your free dashboard & analytics →</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

          </>
        )}
      </section>

      {/* ═══════════════ LEADERBOARD ═══════════════ */}
      <section id="leaderboard" className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="caps">Rankings</div>
            <h2 className="font-display text-[32px] font-semibold tracking-tight mt-1">
              Best &amp; worst rated businesses
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setClaimedOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                claimedOnly
                  ? 'bg-[#f0fdf4] border-[#86efac] text-[#166534]'
                  : 'border-[color:var(--color-line)] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] bg-[color:var(--color-card)]'
              }`}>
              ✅ Actively managed
            </button>
            <div className="flex rounded-full border hairline bg-[color:var(--color-card)] p-1 gap-1 w-fit">
              {[['best', 'Best'], ['worst', 'Worst']].map(([v, l]) => (
                <button key={v} onClick={() => setBoardMode(v)}
                  className={`text-xs font-medium px-4 py-1.5 rounded-full transition ${
                    boardMode === v
                      ? 'bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                      : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Industry filter pills */}
        <div className="flex gap-2 flex-wrap items-center mb-6">
          {['all', ...industries.slice(0, VISIBLE_PILLS)].map((ind) => (
            <button key={ind} onClick={() => { setActiveIndustry(ind); setMoreOpen(false) }}
              className={`chip capitalize ${activeIndustry === ind ? 'chip-active' : ''}`}>
              {ind === 'all' ? 'All industries' : ind}
            </button>
          ))}
          {industries.length > VISIBLE_PILLS && (
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`chip ${industries.slice(VISIBLE_PILLS).includes(activeIndustry) ? 'chip-active' : ''}`}>
                {industries.slice(VISIBLE_PILLS).includes(activeIndustry)
                  ? <span className="capitalize">{activeIndustry}</span>
                  : <span>+{industries.length - VISIBLE_PILLS} more</span>}
                <Icon name="chevron-d" size={12} />
              </button>
              {moreOpen && (
                <div className="absolute z-20 left-0 top-full mt-1.5 bg-[color:var(--color-card)] border hairline rounded-2xl shadow-xl py-1.5 min-w-[180px]">
                  {industries.slice(VISIBLE_PILLS).map((ind) => (
                    <button key={ind} onClick={() => { setActiveIndustry(ind); setMoreOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm capitalize transition hover:bg-[color:var(--color-paper-2)] ${
                        activeIndustry === ind ? 'font-semibold text-[color:var(--color-eucalyptus)]' : 'text-[color:var(--color-ink)]'
                      }`}>
                      {ind}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Two-column layout: ranked list (left) + Top 3 podium (right) */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left: ranked list ───────────────────────────── */}
          <div className="flex-1 min-w-0">
            {loadingBoard ? (
              <div className="card divide-y hairline-2 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="w-6 h-4 bg-[color:var(--color-paper-2)] rounded" />
                    <div className="w-10 h-10 bg-[color:var(--color-paper-2)] rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[color:var(--color-paper-2)] rounded w-1/3" />
                      <div className="h-3 bg-[color:var(--color-paper-2)] rounded w-1/5" />
                    </div>
                    <div className="w-16 h-6 bg-[color:var(--color-paper-2)] rounded-full" />
                  </div>
                ))}
              </div>
            ) : displayList.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="font-display italic-display text-[22px] mb-2">Nothing to rank yet.</div>
                <p className="text-sm text-[color:var(--color-muted)]">No companies in this category have enough data.</p>
              </div>
            ) : (
              <div className="card divide-y hairline-2 overflow-hidden">
                {displayList.map((c, i) => {
                  const b = BAND[c.badge] ?? BAND.not_rated
                  const rank = boardMode === 'best' ? i + 1 : displayList.length - i
                  return (
                    <Link key={c.id} to={`/companies/${c.slug}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-[color:var(--color-paper-2)]/60 transition group">
                      <span className="font-mono text-sm font-medium w-8 text-center shrink-0 text-[color:var(--color-muted)]">
                        {String(rank).padStart(2, '0')}
                      </span>
                      <CompanyLogo company={c} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-[15px] text-[color:var(--color-ink)] truncate group-hover:underline decoration-[color:var(--color-ink)]/30 underline-offset-4">
                            {c.name}
                          </p>
                          {c.verified_badge && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                              style={{ color: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)' }}>
                              <Icon name="verified" size={10} /> Verified
                            </span>
                          )}
                          {c.not_recommended && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                              style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                              <Icon name="flag" size={10} /> Not recommended
                            </span>
                          )}
                          {c.claimed && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                              style={{ color: '#166534', background: '#f0fdf4' }}>
                              ✅ Actively Managed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[color:var(--color-muted)] capitalize mt-0.5">
                          {c.industry ?? 'Unknown'} · {c.total} complaints
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 shrink-0">
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] font-mono text-[color:var(--color-muted)] mb-1">
                            <span>Score</span>
                            <span className="text-[color:var(--color-ink)] font-medium">{c.score}</span>
                          </div>
                          <div className="progress">
                            <span style={{ width: `${c.score}%`, background: b.ring }} />
                          </div>
                        </div>
                        <span className="caps w-[60px] text-right" style={{ color: b.text }}>{b.label}</span>
                      </div>
                      <div className="sm:hidden shrink-0 text-right">
                        <span className="font-display text-[20px] font-semibold leading-none">{c.score}</span>
                        <p className="caps mt-0.5" style={{ color: b.text }}>{b.label}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Right: Top 3 podium cards ───────────────────── */}
          {!loadingBoard && displayList.length > 0 && boardMode === 'best' && (
            <div className="lg:w-[300px] shrink-0 flex flex-col gap-3">
              <p className="caps text-[color:var(--color-muted)] mb-1">Top performers</p>
              {displayList.slice(0, 3).map((c, i) => {
                const b         = BAND[c.badge] ?? BAND.not_rated
                const medals    = ['🥇', '🥈', '🥉']
                const responded = Math.round((c.response_rate   ?? 0) * (c.total ?? 0))
                const resolved  = Math.round((c.resolution_rate ?? 0) * (c.total ?? 0))

                return (
                  <Link key={c.id} to={`/companies/${c.slug}`}
                    className="card p-4 hover:shadow-md transition group">

                    {/* Company header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl leading-none">{medals[i]}</span>
                      <CompanyLogo company={c} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-2">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-[color:var(--color-muted)] capitalize">{c.industry ?? 'Unknown'}</p>
                      </div>
                    </div>

                    {/* Gauge — centred, big enough to look right */}
                    <div className="flex justify-center my-1">
                      <ScoreMeter score={c.score} band={c.badge} size={160} scoreOnly />
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-3 mt-1">
                      <div className="flex-1 bg-[color:var(--color-paper-2)] rounded-xl px-3 py-2">
                        <p className="text-[10px] text-[color:var(--color-muted)] uppercase tracking-wide leading-none mb-0.5">Responded</p>
                        <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                          {responded}<span className="text-[color:var(--color-muted)] font-normal text-xs"> / {c.total}</span>
                        </p>
                      </div>
                      <div className="flex-1 bg-[color:var(--color-paper-2)] rounded-xl px-3 py-2">
                        <p className="text-[10px] text-[color:var(--color-muted)] uppercase tracking-wide leading-none mb-0.5">Resolved</p>
                        <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                          {resolved}<span className="text-[color:var(--color-muted)] font-normal text-xs"> / {c.total}</span>
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-2.5 border-t hairline flex items-center justify-between">
                      <span className="caps text-[10px]" style={{ color: b.text }}>{b.label}</span>
                      {c.claimed && <span className="text-[10px] text-[#166534]">✅ Actively managed</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ LIVE ACTIVITY FEED ═══════════════ */}
      <section id="recent-complaints" className="mb-16">

        {/* Section header */}
        <div className="flex items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 caps mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: 'var(--color-eucalyptus)' }} />
                <span className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: 'var(--color-eucalyptus)' }} />
              </span>
              Live activity
            </div>
            <h2 className="font-display text-[28px] sm:text-[32px] font-semibold tracking-tight">
              Recent complaints
            </h2>
          </div>
          <Link to="/complaints"
            className="text-sm font-medium flex items-center gap-1.5 shrink-0 hover:underline underline-offset-4 mt-1"
            style={{ color: 'var(--color-eucalyptus)' }}>
            View all <Icon name="arrow-r" size={13} />
          </Link>
        </div>

        {/* ── Filter bar ─────────────────────────────────── */}
        <div className="card p-4 mb-3 space-y-3">
          {/* Search row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Icon name="search" size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] pointer-events-none" />
              <input
                value={feedSearch}
                onChange={e => setFeedSearch(e.target.value)}
                placeholder="Search by title or company..."
                className="input pl-8 text-sm h-9 w-full"
              />
              {feedSearch && (
                <button onClick={() => setFeedSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition">
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>

            {/* Expand toggle for category on mobile */}
            <button
              onClick={() => setFeedExpanded(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 h-9 rounded-xl border transition shrink-0 ${
                feedCategory
                  ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                  : 'border-[color:var(--color-line)] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] bg-[color:var(--color-card)]'
              }`}>
              <Icon name="sparkle" size={13} />
              <span className="hidden sm:inline">Category</span>
              {feedCategory && <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-ochre)] ml-0.5" />}
            </button>
          </div>

          {/* Status pills */}
          <div className="flex gap-1.5 flex-wrap">
            {FEED_STATUS_OPTS.map(opt => {
              const count = opt.value
                ? (feedCounts.status[opt.value] ?? 0)
                : Object.values(feedCounts.status).reduce((a, b) => a + b, 0)
              const active = feedStatus === opt.value
              return (
                <button key={opt.value}
                  onClick={() => setFeedStatus(opt.value)}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border transition ${
                    active
                      ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                      : 'border-[color:var(--color-line)] bg-[color:var(--color-card)] text-[color:var(--color-ink-2)] hover:border-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]'
                  }`}>
                  {opt.dot && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: active ? 'var(--color-paper)' : opt.dot }} />
                  )}
                  {opt.label}
                  {count > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-[color:var(--color-ink)]/10 text-[color:var(--color-ink)]'
                    }`}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Category pills — expanded */}
          {feedExpanded && (
            <div className="flex gap-1.5 flex-wrap pt-1 border-t hairline">
              {FEED_CATEGORY_OPTS.map(opt => {
                const count = opt.value ? (feedCounts.category[opt.value] ?? 0) : Object.values(feedCounts.category).reduce((a, b) => a + b, 0)
                const active = feedCategory === opt.value
                return (
                  <button key={opt.value}
                    onClick={() => { setFeedCategory(opt.value); setFeedExpanded(false) }}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border transition ${
                      active
                        ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                        : 'border-[color:var(--color-line)] bg-transparent text-[color:var(--color-ink-2)] hover:border-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]'
                    }`}>
                    {opt.emoji && <span>{opt.emoji}</span>}
                    {opt.label}
                    {count > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-[color:var(--color-ink)]/10 text-[color:var(--color-ink)]'
                      }`}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Active filter pills + clear */}
          {(feedSearch || feedStatus || feedCategory) && (
            <div className="flex items-center gap-2 pt-1 border-t hairline flex-wrap">
              {feedStatus && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink)' }}>
                  {FEED_STATUS_OPTS.find(o => o.value === feedStatus)?.label}
                  <button onClick={() => setFeedStatus('')} className="ml-0.5 opacity-50 hover:opacity-100">
                    <Icon name="x" size={10} />
                  </button>
                </span>
              )}
              {feedCategory && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink)' }}>
                  {FEED_CATEGORY_OPTS.find(o => o.value === feedCategory)?.emoji}{' '}
                  {FEED_CATEGORY_OPTS.find(o => o.value === feedCategory)?.label}
                  <button onClick={() => setFeedCategory('')} className="ml-0.5 opacity-50 hover:opacity-100">
                    <Icon name="x" size={10} />
                  </button>
                </span>
              )}
              <button
                onClick={() => { setFeedSearch(''); setFeedStatus(''); setFeedCategory('') }}
                className="text-[11px] text-[color:var(--color-muted)] hover:text-[color:var(--color-clay)] transition ml-auto">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Feed card ───────────────────────────────────── */}
        <div className="card overflow-hidden">
          {loadingFeed ? (
            <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-[color:var(--color-paper-2)] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-[color:var(--color-paper-2)] rounded w-2/3" />
                    <div className="h-3 bg-[color:var(--color-paper-2)] rounded w-1/3" />
                  </div>
                  <div className="h-5 w-16 bg-[color:var(--color-paper-2)] rounded-full shrink-0" />
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center">
              <div className="font-display italic-display text-[20px] mb-2 text-[color:var(--color-muted)]">
                {(feedSearch || feedStatus || feedCategory) ? 'No matching complaints.' : 'No complaints yet.'}
              </div>
              <p className="text-sm text-[color:var(--color-muted)] mb-5">
                {(feedSearch || feedStatus || feedCategory)
                  ? 'Try adjusting your filters or '
                  : 'Be the first — '}
                <Link to="/complaints" className="underline underline-offset-4"
                  style={{ color: 'var(--color-eucalyptus)' }}>
                  browse all complaints
                </Link>.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                {complaints.map((c) => <ComplaintFeedRow key={c.id} complaint={c} />)}
              </div>
              <div className="px-5 py-3 flex items-center justify-between"
                style={{ background: 'var(--color-paper-2)', borderTop: '1px solid var(--color-line)' }}>
                <p className="text-xs text-[color:var(--color-muted)]">
                  {complaintsTotal > 0 && !feedSearch && !feedStatus && !feedCategory
                    ? <>{complaintsTotal.toLocaleString('en-AU')} complaints on the public record</>
                    : <>Showing {complaints.length} matching</>}
                </p>
                <Link
                  to={`/complaints${feedStatus || feedCategory ? `?${new URLSearchParams({ ...(feedStatus && { status: feedStatus }), ...(feedCategory && { category: feedCategory }) }).toString()}` : ''}`}
                  className="text-xs font-medium flex items-center gap-1 hover:underline underline-offset-4"
                  style={{ color: 'var(--color-eucalyptus)' }}>
                  Browse all <Icon name="arrow-r" size={12} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══════════════ FOR BUSINESS STRIP ═══════════════ */}
      <section className="mb-16">
        <div className="rounded-[24px] overflow-hidden flex flex-col sm:flex-row items-stretch"
          style={{ border: '1px solid var(--color-eucalyptus)' }}>
          {/* Left — text */}
          <div className="flex-1 p-8 sm:p-10"
            style={{ background: 'var(--color-eucalyptus-3)' }}>
            <div className="caps mb-2" style={{ color: 'var(--color-eucalyptus)' }}>For businesses</div>
            <h2 className="font-display text-[24px] sm:text-[30px] font-semibold tracking-tight mb-3">
              Your reputation is already<br className="hidden sm:block" /> on the public record.
            </h2>
            <p className="text-sm text-[color:var(--color-ink-2)] leading-relaxed max-w-sm">
              Claim your free dashboard, respond to complaints publicly, track your score, and show customers you take feedback seriously.
            </p>
          </div>
          {/* Right — CTAs */}
          <div className="flex flex-col justify-center gap-3 px-8 py-8 sm:px-10 sm:border-l shrink-0"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-eucalyptus)' }}>
            <div>
              <p className="text-xs font-semibold caps mb-3" style={{ color: 'var(--color-muted)' }}>Get started</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/search" className="btn btn-primary justify-center sm:justify-start whitespace-nowrap">
                  Find &amp; claim your business <Icon name="arrow-r" size={14} />
                </Link>
                <Link to="/companies/register" className="btn btn-secondary justify-center sm:justify-start whitespace-nowrap text-sm">
                  Register a new business
                </Link>
              </div>
            </div>
            <p className="text-[11px] text-[color:var(--color-muted)]">
              Free forever · No credit card · Takes 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ VALUE PROPS ═══════════════ */}
      <section className="grid sm:grid-cols-3 gap-4 mb-16">
        {[
          { title: 'Always free for consumers', desc: 'Submit, follow up, rate — zero cost, forever.' },
          { title: 'On the public record', desc: "Every complaint is visible. Companies can't hide." },
          { title: 'Scores companies can earn back', desc: "Businesses that resolve issues improve their score. Fair — as it should be." },
        ].map((v, i) => (
          <div key={v.title} className="card p-7">
            <div
              className="font-display italic-display text-[36px] leading-none mb-4"
              style={{ color: i === 0 ? 'var(--color-eucalyptus)' : i === 1 ? 'var(--color-ochre)' : 'var(--color-clay)' }}
            >
              0{i + 1}.
            </div>
            <h3 className="font-display text-[20px] font-semibold mb-2">{v.title}</h3>
            <p className="text-sm text-[color:var(--color-ink-2)] leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </section>

      {/* ═══════════════ BOTTOM CTA ═══════════════ */}
      {!user && (
        <section className="mb-8">
          <div className="relative rounded-[28px] overflow-hidden" style={{ background: 'var(--color-ink)' }}>
            <div
              className="absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, var(--color-ochre) 0%, transparent 70%)' }}
            />
            <div className="relative px-8 py-12 sm:px-14 sm:py-16 text-center">
              <div className="caps mb-3" style={{ color: 'var(--color-ochre-2)' }}>Ready?</div>
              <h2 className="font-display text-[36px] sm:text-[44px] font-semibold tracking-tight mb-3"
                  style={{ color: 'var(--color-paper)' }}>
                Your voice matters.{' '}
                <span className="italic-display" style={{ color: 'var(--color-ochre-2)' }}>Use it.</span>
              </h2>
              <p className="text-[15px] max-w-md mx-auto mb-8 leading-relaxed" style={{ color: '#C9CFC8' }}>
                Join Aus Fair Go — the public record where Australian consumer voices create real change.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/register" className="btn" style={{ background: 'var(--color-ochre)', color: 'var(--color-ink)' }}>
                  Create free account <Icon name="arrow-r" size={14} />
                </Link>
                <Link to="/companies/register" className="btn btn-ghost" style={{ color: 'var(--color-paper)' }}>
                  Register your business
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

/* ─── Complaint feed row (compact) ──────────────── */
function ComplaintFeedRow({ complaint }) {
  const st = STATUS_STYLE[complaint.status] ?? STATUS_STYLE.open
  const lastActive = new Date(complaint.updated_at || complaint.created_at)
  const daysAgo = Math.floor((Date.now() - lastActive) / 86400000)
  const timeStr = lastActive.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  const dateLabel = daysAgo === 0
    ? `today · ${timeStr}`
    : daysAgo === 1 ? `1d ago · ${timeStr}` : `${daysAgo}d ago`

  return (
    <Link to={`/complaints/${complaint.id}`}
      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[color:var(--color-paper-2)] transition group">
      {/* Status dot */}
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st.dot }} />

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-4 decoration-[color:var(--color-ink)]/30 leading-snug">
          {complaint.title}
        </p>
        <p className="text-xs text-[color:var(--color-muted)] mt-0.5 truncate">
          vs <span className="font-medium text-[color:var(--color-ink-2)]">{complaint.company?.name}</span>
          <span className="mx-1.5 opacity-30">·</span>
          <span className="capitalize">{complaint.category}</span>
          {complaint.feedback?.rating && (
            <>
              <span className="mx-1.5 opacity-30">·</span>
              <span className="font-medium text-[color:var(--color-ochre)]">
                {complaint.feedback.rating}/5 {complaint.feedback.would_deal_again != null ? (complaint.feedback.would_deal_again ? '👍' : '👎') : ''}
              </span>
            </>
          )}
        </p>
      </div>

      {/* AI Reviewed badge + Status label — hidden on smallest screens */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <AiReviewedBadge moderation_status={complaint.moderation_status} size="xs" />
        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ color: st.fg, background: st.bg }}>
          {st.label}
        </span>
      </div>

      {/* Date */}
      <span className="text-[11px] text-[color:var(--color-muted)] font-mono shrink-0">{dateLabel}</span>
    </Link>
  )
}
