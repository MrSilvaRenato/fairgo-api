import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import CompanyLogo from '../components/CompanyLogo'
import Icon from '../components/Icon'
import AiReviewedBadge from '../components/AiReviewedBadge'
import { BAND } from '../components/ScoreMeter'
import useSeoMeta from '../hooks/useSeoMeta'

const STATUS_STYLE = {
  open:              { label: 'Open',       fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)', dot: 'var(--color-eucalyptus)' },
  awaiting_response: { label: 'Awaiting',   fg: '#8A5A1F',                 bg: '#F3E2C3',                   dot: '#D8A24A' },
  responded:         { label: 'Responded',  fg: '#3B4B7A',                 bg: '#DAE0EE',                   dot: '#5A6FA8' },
  resolved:          { label: 'Resolved',   fg: 'var(--color-eucalyptus)', bg: '#E7EEDF',                   dot: '#3E7560' },
  unresolved:        { label: 'Unresolved', fg: 'var(--color-clay)',       bg: 'var(--color-clay-soft)',    dot: 'var(--color-clay)' },
  expired:           { label: 'Expired',    fg: 'var(--color-muted)',      bg: 'var(--color-paper-2)',      dot: 'var(--color-muted)' },
}

const FEED_STATUS_OPTS = [
  { value: '',                  label: 'All' },
  { value: 'open',              label: 'Open',       dot: 'var(--color-eucalyptus)' },
  { value: 'responded',         label: 'Responded',  dot: '#5A6FA8' },
  { value: 'resolved',          label: 'Resolved',   dot: '#3E7560' },
  { value: 'unresolved',        label: 'Unresolved', dot: 'var(--color-clay)' },
  { value: 'awaiting_response', label: 'Awaiting',   dot: '#D8A24A' },
]

const FEED_CATEGORY_OPTS = [
  { value: '',         label: 'All',      emoji: null  },
  { value: 'billing',  label: 'Billing',  emoji: '💳' },
  { value: 'delivery', label: 'Delivery', emoji: '📦' },
  { value: 'service',  label: 'Service',  emoji: '🎧' },
  { value: 'refund',   label: 'Refund',   emoji: '↩️' },
  { value: 'fraud',    label: 'Fraud',    emoji: '⚠️' },
  { value: 'other',    label: 'Other',    emoji: '📋' },
]

const CATEGORIES = [
  { value: 'billing',  label: 'Billing',  emoji: '💳', desc: 'Unexpected charges & invoices' },
  { value: 'delivery', label: 'Delivery', emoji: '📦', desc: 'Late, missing or damaged orders' },
  { value: 'service',  label: 'Service',  emoji: '🎧', desc: 'Poor support & customer care' },
  { value: 'refund',   label: 'Refund',   emoji: '↩️', desc: 'Refused or delayed refunds' },
  { value: 'fraud',    label: 'Fraud',    emoji: '⚠️', desc: 'Scams & deceptive conduct' },
  { value: 'other',    label: 'Other',    emoji: '📋', desc: 'Everything else' },
]

export default function HomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const feedRef  = useRef(null)

  useSeoMeta({
    title: 'Australian consumer complaints & business accountability',
    description: 'Aus Fair Go gives Australian consumers a voice. File complaints, track resolutions, and hold businesses accountable. Completely transparent.',
    url: 'https://ausfairgo.com.au/',
  })

  // Hero search
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState({ companies: [], complaints: [] })
  const [searching, setSearching] = useState(false)
  const [open,      setOpen]      = useState(false)
  const searchRef = useRef(null)

  // Complaint feed
  const [complaints,      setComplaints]      = useState([])
  const [complaintsTotal, setComplaintsTotal] = useState(0)
  const [loadingFeed,     setLoadingFeed]     = useState(true)
  const [feedSearch,      setFeedSearch]      = useState('')
  const [feedStatus,      setFeedStatus]      = useState('')
  const [feedCategory,    setFeedCategory]    = useState('')
  const [feedExpanded,    setFeedExpanded]    = useState(false)
  const [feedCounts,      setFeedCounts]      = useState({ category: {}, status: {} })
  const feedSearchTimer = useRef(null)

  // Leaderboard
  const [leaderboard,     setLeaderboard]     = useState([])
  const [industries,      setIndustries]      = useState([])
  const [activeIndustry,  setActiveIndustry]  = useState('all')
  const [loadingBoard,    setLoadingBoard]    = useState(true)
  const [boardMode,       setBoardMode]       = useState('best')
  const [claimedOnly,     setClaimedOnly]     = useState(false)
  const [moreOpen,        setMoreOpen]        = useState(false)

  // Companies browse — default to claimed (more impressive, verified)
  const [managedQuery,    setManagedQuery]    = useState('')
  const [claimedList,     setClaimedList]     = useState([])
  const [allList,         setAllList]         = useState([])
  const [managedLoading,  setManagedLoading]  = useState(true)

  const moreRef      = useRef(null)
  const VISIBLE_PILLS = 4

  // Load all companies
  useEffect(() => {
    api.get('/complaints/company-search')
      .then(r => setAllList(r.data ?? []))
      .catch(() => {})
      .finally(() => setManagedLoading(false))
  }, [])

  // Load claimed companies
  useEffect(() => {
    if (claimedList.length > 0) return
    api.get('/complaints/company-search', { params: { claimed: true } })
      .then(r => setClaimedList(r.data ?? []))
      .catch(() => {})
  }, [])

  // Company search
  useEffect(() => {
    if (!managedQuery) return
    const t = setTimeout(() => {
      api.get('/complaints/company-search', { params: { q: managedQuery } })
        .then(r => setAllList(r.data ?? []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [managedQuery])

  const displayedCompanies = managedQuery ? allList : claimedList

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false)
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Hero search autocomplete
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

  // Feed counts (for filter pills)
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

  // Feed data
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
        .then(r => {
          setComplaints(r.data.data ?? [])
          if (!feedSearch && !feedStatus && !feedCategory) setComplaintsTotal(r.data.total ?? 0)
        })
        .catch(() => {})
        .finally(() => setLoadingFeed(false))
    }, feedSearch ? 350 : 0)
    return () => clearTimeout(feedSearchTimer.current)
  }, [feedSearch, feedStatus, feedCategory])

  // Leaderboard
  useEffect(() => {
    setLoadingBoard(true)
    api.get('/leaderboard', { params: { industry: activeIndustry } })
      .then(r => { setLeaderboard(r.data.companies ?? []); setIndustries(r.data.industries ?? []) })
      .catch(() => {})
      .finally(() => setLoadingBoard(false))
  }, [activeIndustry])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    setOpen(false)
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const handleCategoryPick = (value) => {
    setFeedCategory(value)
    setTimeout(() => feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const displayList = useMemo(() => {
    let rated = (leaderboard ?? []).filter(c => c.badge !== 'not_rated')
    if (claimedOnly) rated = rated.filter(c => c.claimed)
    return boardMode === 'best' ? rated : [...rated].reverse()
  }, [boardMode, leaderboard, claimedOnly])

  return (
    <div className="-mt-8">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section id="hero" className="relative overflow-hidden mb-10">
        <div className="absolute -top-24 right-[-120px] w-[420px] h-[420px] rounded-full opacity-[0.18] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-ochre) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full opacity-[0.14] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-eucalyptus) 0%, transparent 70%)' }} />

        <div className="relative px-2 sm:px-6 py-12 sm:py-16 lg:grid lg:grid-cols-2 lg:gap-14 lg:items-center">

          {/* ── Left column ── */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-6 caps" style={{ color: 'var(--color-eucalyptus)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-eucalyptus)' }} />
              Australia's public complaint record
            </div>

            <h1 className="font-display text-[46px] sm:text-[64px] lg:text-[62px] xl:text-[72px] leading-[1.02] font-semibold tracking-tight mb-5">
              File it once.<br />
              <span className="italic-display" style={{ color: 'var(--color-ochre)' }}>Public forever.</span>
            </h1>
            <p className="text-[17px] sm:text-[18px] text-[color:var(--color-ink-2)] max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10">
              A public, searchable record of how Australian businesses treat their customers.
              Free for consumers. The company has 7 days to respond.
            </p>

            {/* Search bar */}
            <div className="max-w-xl mx-auto lg:mx-0 relative text-left" ref={searchRef}>
              <form onSubmit={handleSubmit}
                className="flex items-center gap-2 border hairline rounded-2xl p-1.5 shadow-sm focus-within:border-[color:var(--color-eucalyptus)] focus-within:shadow-[0_0_0_3px_rgba(47,93,76,.12)] transition"
                style={{ background: 'var(--color-card)' }}>
                <div className="flex flex-1 items-center gap-2 px-3">
                  {searching
                    ? <Icon name="sparkle" size={16} className="text-[color:var(--color-eucalyptus)] animate-spin shrink-0" />
                    : <Icon name="search"  size={16} className="text-[color:var(--color-muted)] shrink-0" />}
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search any Australian business…"
                    className="flex-1 text-sm py-2.5 outline-none bg-transparent placeholder-[color:var(--color-muted)] text-[color:var(--color-ink)]"
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="btn btn-primary shrink-0">
                  Search <Icon name="arrow-r" size={14} />
                </button>
              </form>

              {/* Autocomplete dropdown */}
              {open && (results.companies.length > 0 || results.complaints.length > 0) && (
                <div className="absolute z-20 left-0 right-0 mt-2 rounded-2xl shadow-2xl border hairline overflow-hidden"
                  style={{ background: 'var(--color-card)' }}>
                  {results.companies.length > 0 && (
                    <ul>
                      {results.companies.slice(0, 5).map(c => {
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
                                  style={{ color: b.text, background: 'var(--color-paper-2)' }}>{b.label}</span>
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
                        {results.complaints.slice(0, 3).map(c => (
                          <li key={c.id}>
                            <Link to={`/complaints/${c.id}`} onClick={() => setOpen(false)}
                              className="flex items-start gap-3 px-4 py-2.5 hover:bg-[color:var(--color-paper-2)] transition">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[color:var(--color-ink)] truncate">{c.title}</p>
                                <p className="text-xs text-[color:var(--color-muted)]">
                                  {c.company?.name} · <span className="capitalize">{c.category}</span>
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="border-t hairline px-4 py-2">
                    <button onClick={handleSubmit}
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--color-eucalyptus)' }}>
                      See all results for "{query}" →
                    </button>
                  </div>
                </div>
              )}
              {open && query.length >= 2 && !searching && results.companies.length === 0 && results.complaints.length === 0 && (
                <div className="absolute z-20 left-0 right-0 mt-2 rounded-2xl shadow-xl border hairline px-4 py-5 text-center"
                  style={{ background: 'var(--color-card)' }}>
                  <p className="text-sm text-[color:var(--color-muted)] mb-3">
                    No results for <span className="font-medium text-[color:var(--color-ink)]">"{query}"</span>
                  </p>
                  <Link
                    to={`/complaints/new?company_name=${encodeURIComponent(query.trim())}`}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 btn btn-primary text-sm px-4 py-2">
                    File a complaint against "{query}" <Icon name="arrow-r" size={13} />
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-7">
              {user ? (
                <Link to="/complaints/new" className="btn btn-primary">
                  <Icon name="plus" size={14} /> Submit a complaint
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">Get started — it's free</Link>
                  <Link to="/login"    className="btn btn-secondary">Sign in</Link>
                </>
              )}
            </div>
          </div>

          {/* ── Right column — live activity snapshot (desktop only) ── */}
          <div className="hidden lg:flex flex-col gap-3 self-center">
            <div className="rounded-[20px] overflow-hidden border hairline shadow-xl"
              style={{ background: 'var(--color-card)' }}>
              {/* Widget header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b hairline"
                style={{ background: 'var(--color-paper-2)' }}>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: 'var(--color-eucalyptus)' }} />
                    <span className="relative inline-flex rounded-full h-2 w-2"
                      style={{ background: 'var(--color-eucalyptus)' }} />
                  </span>
                  <span className="caps text-[11px]" style={{ color: 'var(--color-eucalyptus)' }}>Live activity</span>
                </div>
                {complaintsTotal > 0 && (
                  <span className="text-[11px] font-mono text-[color:var(--color-muted)]">
                    {complaintsTotal.toLocaleString('en-AU')} on record
                  </span>
                )}
              </div>

              {/* 4 most recent — compact style, no metadata clutter */}
              {loadingFeed ? (
                <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-paper-2)' }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 rounded w-3/4" style={{ background: 'var(--color-paper-2)' }} />
                        <div className="h-2.5 rounded w-1/2" style={{ background: 'var(--color-paper-2)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                  {complaints.slice(0, 4).map(c => <ComplaintFeedRow key={c.id} complaint={c} compact />)}
                </div>
              )}

              {/* Widget footer */}
              <div className="px-5 py-3 border-t hairline flex items-center justify-between"
                style={{ background: 'var(--color-paper-2)' }}>
                <p className="text-[11px] text-[color:var(--color-muted)]">Public · updates in real time</p>
                <button
                  onClick={() => feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="text-[11px] font-medium flex items-center gap-1 hover:underline underline-offset-4"
                  style={{ color: 'var(--color-eucalyptus)' }}>
                  Browse all <Icon name="arrow-r" size={11} />
                </button>
              </div>
            </div>

            {/* Mini trust signals */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '7 days',  sub: 'company response window' },
                { value: '100%',    sub: 'public record' },
                { value: 'Free',    sub: 'for consumers' },
              ].map(s => (
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

      {/* ══════════════════════════════════════════
          TRUST BAR  (moved up — build credibility early)
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        {[
          { value: complaintsTotal > 0 ? complaintsTotal.toLocaleString('en-AU') : '…', label: 'Complaints on record' },
          { value: claimedList.length > 0 ? `${claimedList.length}+` : '…',             label: 'Businesses monitored' },
          { value: '7 days',                                                              label: 'Company response window' },
          { value: 'Always free',                                                         label: 'For consumers' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <p className="font-display text-[22px] sm:text-[26px] font-semibold leading-none text-[color:var(--color-ink)] mb-1.5">
              {s.value}
            </p>
            <p className="text-xs text-[color:var(--color-muted)] leading-snug">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          CATEGORY QUICK PICKS  (new — entry points into the feed)
      ══════════════════════════════════════════ */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-[20px] sm:text-[22px] font-semibold tracking-tight">
              Browse by category
            </h2>
            <p className="text-sm text-[color:var(--color-muted)] mt-0.5">Jump straight to what's relevant to you.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleCategoryPick(cat.value)}
              className="card p-3 sm:p-4 text-left flex flex-col gap-1.5 transition-colors group cursor-pointer"
              style={{ borderWidth: '1px' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-eucalyptus)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
              <span className="text-xl sm:text-2xl leading-none">{cat.emoji}</span>
              <p className="font-semibold text-xs sm:text-sm text-[color:var(--color-ink)] group-hover:text-[color:var(--color-eucalyptus)] transition-colors leading-snug">
                {cat.label}
              </p>
              <p className="text-[10px] sm:text-[11px] text-[color:var(--color-muted)] leading-snug hidden sm:block">
                {cat.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LIVE COMPLAINT FEED
      ══════════════════════════════════════════ */}
      <section id="recent-complaints" className="mb-16" ref={feedRef}>
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
            <h2 className="font-display text-[26px] sm:text-[32px] font-semibold tracking-tight">
              Public complaint record
            </h2>
          </div>
          <Link to="/complaints"
            className="text-sm font-medium flex items-center gap-1.5 shrink-0 hover:underline underline-offset-4 mt-1"
            style={{ color: 'var(--color-eucalyptus)' }}>
            View all <Icon name="arrow-r" size={13} />
          </Link>
        </div>

        {/* Filter bar */}
        <div className="card p-3 sm:p-4 mb-3 space-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Icon name="search" size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-muted)' }} />
              <input
                value={feedSearch}
                onChange={e => setFeedSearch(e.target.value)}
                placeholder="Search by title or company..."
                className="input pl-8 text-sm h-9 w-full"
              />
              {feedSearch && (
                <button onClick={() => setFeedSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                  style={{ color: 'var(--color-muted)' }}>
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>
            <button
              onClick={() => setFeedExpanded(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 h-9 rounded-xl border transition shrink-0 ${
                feedCategory
                  ? 'border-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                  : 'border-[color:var(--color-line)] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]'
              }`}
              style={feedCategory ? { background: 'var(--color-ink)' } : { background: 'var(--color-card)' }}>
              <Icon name="sparkle" size={13} />
              <span className="hidden sm:inline">Category</span>
              {feedCategory && <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{ background: 'var(--color-ochre)' }} />}
            </button>
          </div>

          {/* Status pills */}
          <div className="flex gap-1.5 flex-wrap">
            {FEED_STATUS_OPTS.map(opt => {
              const count  = opt.value
                ? (feedCounts.status[opt.value] ?? 0)
                : Object.values(feedCounts.status).reduce((a, b) => a + b, 0)
              const active = feedStatus === opt.value
              return (
                <button key={opt.value}
                  onClick={() => setFeedStatus(opt.value)}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 sm:px-3 py-1.5 rounded-full border transition ${
                    active
                      ? 'border-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                      : 'border-[color:var(--color-line)] text-[color:var(--color-ink-2)] hover:border-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]'
                  }`}
                  style={active ? { background: 'var(--color-ink)' } : { background: 'var(--color-card)' }}>
                  {opt.dot && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: active ? 'var(--color-paper)' : opt.dot }} />
                  )}
                  {opt.label}
                  {count > 0 && (
                    <span className={`text-[10px] font-mono px-1 py-0.5 rounded-full leading-none ${
                      active ? 'bg-white/20 text-white' : 'bg-[color:var(--color-ink)]/10 text-[color:var(--color-ink)]'
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
                const count  = opt.value
                  ? (feedCounts.category[opt.value] ?? 0)
                  : Object.values(feedCounts.category).reduce((a, b) => a + b, 0)
                const active = feedCategory === opt.value
                return (
                  <button key={opt.value}
                    onClick={() => { setFeedCategory(opt.value); setFeedExpanded(false) }}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 sm:px-3 py-1.5 rounded-full border transition ${
                      active
                        ? 'border-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                        : 'border-[color:var(--color-line)] text-[color:var(--color-ink-2)] hover:border-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]'
                    }`}
                    style={active ? { background: 'var(--color-ink)' } : {}}>
                    {opt.emoji && <span>{opt.emoji}</span>}
                    {opt.label}
                    {count > 0 && (
                      <span className={`text-[10px] font-mono px-1 py-0.5 rounded-full leading-none ${
                        active ? 'bg-white/20 text-white' : 'bg-[color:var(--color-ink)]/10 text-[color:var(--color-ink)]'
                      }`}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Active filter tags */}
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
                className="text-[11px] transition ml-auto"
                style={{ color: 'var(--color-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-clay)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Feed list */}
        <div className="card overflow-hidden">
          {loadingFeed ? (
            <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-paper-2)' }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 rounded w-2/3" style={{ background: 'var(--color-paper-2)' }} />
                    <div className="h-3 rounded w-1/3"   style={{ background: 'var(--color-paper-2)' }} />
                  </div>
                  <div className="h-5 w-16 rounded-full shrink-0" style={{ background: 'var(--color-paper-2)' }} />
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-10 sm:p-12 text-center">
              <div className="font-display italic-display text-[20px] mb-2 text-[color:var(--color-muted)]">
                {(feedSearch || feedStatus || feedCategory) ? 'No matching complaints.' : 'No complaints yet.'}
              </div>
              <p className="text-sm text-[color:var(--color-muted)] mb-5">
                {(feedSearch || feedStatus || feedCategory) ? 'Try adjusting your filters or ' : 'Be the first — '}
                <Link to="/complaints" className="underline underline-offset-4" style={{ color: 'var(--color-eucalyptus)' }}>
                  browse all complaints
                </Link>.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                {complaints.map(c => <ComplaintFeedRow key={c.id} complaint={c} />)}
              </div>
              <div className="px-4 sm:px-5 py-3 flex items-center justify-between"
                style={{ background: 'var(--color-paper-2)', borderTop: '1px solid var(--color-line)' }}>
                <p className="text-xs text-[color:var(--color-muted)]">
                  {complaintsTotal > 0 && !feedSearch && !feedStatus && !feedCategory
                    ? <>{complaintsTotal.toLocaleString('en-AU')} complaints on the public record</>
                    : <>Showing {complaints.length} matching</>}
                </p>
                <Link
                  to={`/complaints${feedStatus || feedCategory
                    ? `?${new URLSearchParams({ ...(feedStatus && { status: feedStatus }), ...(feedCategory && { category: feedCategory }) })}`
                    : ''}`}
                  className="text-xs font-medium flex items-center gap-1 hover:underline underline-offset-4"
                  style={{ color: 'var(--color-eucalyptus)' }}>
                  Browse all <Icon name="arrow-r" size={12} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LEADERBOARD  (with Best/Worst + Claimed-only toggles)
      ══════════════════════════════════════════ */}
      <section id="leaderboard" className="mb-16">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <div className="caps">Rankings</div>
            <h2 className="font-display text-[26px] sm:text-[32px] font-semibold tracking-tight mt-1">
              Company Performance
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              Scored by consumer outcomes — resolution rate, satisfaction &amp; response time.
            </p>
          </div>

          {/* Mode toggles */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Best / Worst segmented control */}
            <div className="flex rounded-xl border hairline overflow-hidden"
              style={{ background: 'var(--color-paper-2)', padding: '3px', gap: '2px' }}>
              <button
                onClick={() => setBoardMode('best')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                style={boardMode === 'best'
                  ? { background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }
                  : { color: 'var(--color-ink-2)' }}>
                Top performers
              </button>
              <button
                onClick={() => setBoardMode('worst')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                style={boardMode === 'worst'
                  ? { background: 'var(--color-clay)', color: 'var(--color-paper)' }
                  : { color: 'var(--color-ink-2)' }}>
                Needs improvement
              </button>
            </div>

            {/* Claimed-only toggle */}
            <button
              onClick={() => setClaimedOnly(v => !v)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border transition whitespace-nowrap"
              style={claimedOnly
                ? { background: 'var(--color-eucalyptus)', borderColor: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }
                : { borderColor: 'var(--color-line)', color: 'var(--color-ink-2)' }}>
              ✅ Actively managed
            </button>
          </div>
        </div>

        {/* Industry filter pills */}
        <div className="flex gap-2 flex-wrap items-center mb-5">
          {['all', ...industries.slice(0, VISIBLE_PILLS)].map(ind => (
            <button key={ind} onClick={() => { setActiveIndustry(ind); setMoreOpen(false) }}
              className={`chip capitalize ${activeIndustry === ind ? 'chip-active' : ''}`}>
              {ind === 'all' ? 'All industries' : ind}
            </button>
          ))}
          {industries.length > VISIBLE_PILLS && (
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(v => !v)}
                className={`chip ${industries.slice(VISIBLE_PILLS).includes(activeIndustry) ? 'chip-active' : ''}`}>
                {industries.slice(VISIBLE_PILLS).includes(activeIndustry)
                  ? <span className="capitalize">{activeIndustry}</span>
                  : <span>+{industries.length - VISIBLE_PILLS} more</span>}
                <Icon name="chevron-d" size={12} />
              </button>
              {moreOpen && (
                <div className="absolute z-20 left-0 top-full mt-1.5 border hairline rounded-2xl shadow-xl py-1.5 min-w-[180px]"
                  style={{ background: 'var(--color-card)' }}>
                  {industries.slice(VISIBLE_PILLS).map(ind => (
                    <button key={ind} onClick={() => { setActiveIndustry(ind); setMoreOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm capitalize transition hover:bg-[color:var(--color-paper-2)] ${
                        activeIndustry === ind ? 'font-semibold' : ''
                      }`}
                      style={{ color: activeIndustry === ind ? 'var(--color-eucalyptus)' : 'var(--color-ink)' }}>
                      {ind}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Leaderboard list */}
        {loadingBoard ? (
          <div className="card divide-y hairline overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-6 h-4 rounded" style={{ background: 'var(--color-paper-2)' }} />
                <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: 'var(--color-paper-2)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/3" style={{ background: 'var(--color-paper-2)' }} />
                  <div className="h-3 rounded w-1/5" style={{ background: 'var(--color-paper-2)' }} />
                </div>
                <div className="w-16 h-6 rounded-full" style={{ background: 'var(--color-paper-2)' }} />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="font-display italic-display text-[22px] mb-2">Nothing to rank yet.</div>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              No companies in this category have enough data.
            </p>
          </div>
        ) : (
          <div className="card divide-y hairline overflow-hidden">
            {displayList.map((c, i) => {
              const b    = BAND[c.badge] ?? BAND.not_rated
              const rank = boardMode === 'best' ? i + 1 : displayList.length - i
              return (
                <Link key={c.id} to={`/companies/${c.slug}`}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-[color:var(--color-paper-2)]/60 transition group">
                  <span className="font-mono text-sm font-medium w-7 text-center shrink-0"
                    style={{ color: 'var(--color-muted)' }}>
                    {String(rank).padStart(2, '0')}
                  </span>
                  <CompanyLogo company={c} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[15px] text-[color:var(--color-ink)] truncate group-hover:underline decoration-[color:var(--color-ink)]/30 underline-offset-4">
                        {c.name}
                      </p>
                      {c.verified_badge && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{ color: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)' }}>
                          <Icon name="verified" size={10} /> Verified
                        </span>
                      )}
                      {c.not_recommended && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                          <Icon name="flag" size={10} /> Not recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--color-muted)' }}>
                      {c.industry ?? 'Unknown'} · {c.total} complaint{c.total !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {/* Score bar — desktop */}
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="w-24">
                      <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: 'var(--color-muted)' }}>
                        <span>Score</span>
                        <span className="font-medium" style={{ color: 'var(--color-ink)' }}>{c.score}</span>
                      </div>
                      <div className="progress">
                        <span style={{ width: `${c.score}%`, background: b.ring }} />
                      </div>
                    </div>
                    <span className="caps w-[60px] text-right" style={{ color: b.text }}>{b.label}</span>
                  </div>
                  {/* Score number — mobile */}
                  <div className="sm:hidden shrink-0 text-right">
                    <span className="font-display text-[20px] font-semibold leading-none">{c.score}</span>
                    <p className="caps mt-0.5" style={{ color: b.text }}>{b.label}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Most complained link */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link to="/most-complained"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl border transition"
            style={{ color: 'var(--color-ink-2)', borderColor: 'var(--color-line)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-clay)'; e.currentTarget.style.color = 'var(--color-clay)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.color = 'var(--color-ink-2)' }}>
            Most complained companies <Icon name="arrow-r" size={14} />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMPANIES BROWSE  (actively managed, simplified)
      ══════════════════════════════════════════ */}
      <section id="actively-managed" className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <div className="caps mb-1" style={{ color: 'var(--color-eucalyptus)' }}>✅ Actively managed</div>
            <h2 className="font-display text-[26px] sm:text-[32px] font-semibold tracking-tight">
              Businesses on the platform
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              Companies actively managing their profile on Aus Fair Go.
            </p>
          </div>
          {/* Inline search — right side on desktop */}
          <div className="relative shrink-0 w-full sm:w-[200px]">
            <Icon name="search" size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-muted)' }} />
            <input
              value={managedQuery}
              onChange={e => setManagedQuery(e.target.value)}
              placeholder="Search businesses…"
              className="input pl-8 text-sm w-full"
            />
          </div>
        </div>

        {managedLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-4 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: 'var(--color-paper-2)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-2/3" style={{ background: 'var(--color-paper-2)' }} />
                  <div className="h-3 rounded w-1/3" style={{ background: 'var(--color-paper-2)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayedCompanies.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-display italic-display text-[20px] mb-1">No businesses found.</p>
            {managedQuery ? (
              <>
                <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
                  <span className="font-medium" style={{ color: 'var(--color-ink)' }}>"{managedQuery}"</span> isn't on Aus Fair Go yet.
                </p>
                <Link
                  to={`/complaints/new?company_name=${encodeURIComponent(managedQuery)}`}
                  className="btn btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5">
                  File a complaint against "{managedQuery}" <Icon name="arrow-r" size={14} />
                </Link>
                <p className="text-xs mt-4" style={{ color: 'var(--color-muted)' }}>
                  You'll be asked to provide their ABN to verify the business.
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No actively managed businesses yet.</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(managedQuery ? displayedCompanies : displayedCompanies.slice(0, 6)).map(c => {
                const b = BAND[c.badge] ?? BAND.not_rated
                return (
                  <div key={c.id} className="card p-4 flex flex-col gap-2">
                    <Link to={`/companies/${c.slug}`} className="flex items-center gap-3 group">
                      <CompanyLogo company={c} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-4 decoration-[color:var(--color-ink)]/30">
                          {c.name}
                        </p>
                        <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--color-muted)' }}>
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
                          Verified &amp; actively managed
                        </span>
                      </div>
                    ) : (
                      <div className="pt-1 border-t hairline">
                        <Link
                          to={user ? `/companies/${c.slug}/claim` : `/register?role=business&next=/companies/${c.slug}/claim`}
                          className="text-[11px] transition"
                          style={{ color: 'var(--color-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-eucalyptus)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                          Is this your business?{' '}
                          <span className="underline underline-offset-2">Claim your free dashboard →</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {!managedQuery && displayedCompanies.length > 6 && (
              <div className="mt-5 text-center">
                <Link to="/search"
                  className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl border transition"
                  style={{ color: 'var(--color-ink-2)', borderColor: 'var(--color-line)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-eucalyptus)'; e.currentTarget.style.color = 'var(--color-eucalyptus)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.color = 'var(--color-ink-2)' }}>
                  Browse all {allList.length} businesses <Icon name="arrow-r" size={14} />
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════
          FOR BUSINESS STRIP
      ══════════════════════════════════════════ */}
      <section className="mb-16">
        <div className="rounded-[24px] overflow-hidden flex flex-col sm:flex-row items-stretch"
          style={{ border: '1px solid var(--color-eucalyptus)' }}>
          <div className="flex-1 p-8 sm:p-10" style={{ background: 'var(--color-eucalyptus-3)' }}>
            <div className="caps mb-2" style={{ color: 'var(--color-eucalyptus)' }}>For businesses</div>
            <h2 className="font-display text-[22px] sm:text-[28px] font-semibold tracking-tight mb-3">
              Your reputation is already<br className="hidden sm:block" /> on the public record.
            </h2>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--color-ink-2)' }}>
              Claim your free dashboard, respond to complaints publicly, track your score,
              and show customers you take feedback seriously.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 px-8 py-8 sm:px-10 sm:border-l shrink-0"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-eucalyptus)' }}>
            <p className="text-xs font-semibold caps mb-1" style={{ color: 'var(--color-muted)' }}>Get started</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/search" className="btn btn-primary justify-center sm:justify-start whitespace-nowrap">
                Find &amp; claim your business <Icon name="arrow-r" size={14} />
              </Link>
              <Link to="/register?role=business" className="btn btn-secondary justify-center sm:justify-start whitespace-nowrap text-sm">
                Register a new business
              </Link>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>Free forever · No credit card · 2 minutes</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section id="how-it-works" className="mb-16">
        <div className="text-center mb-8">
          <div className="caps mb-2">How it works</div>
          <h2 className="font-display text-[28px] sm:text-[36px] font-semibold tracking-tight">
            Three steps to accountability
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { n: '01', title: 'Submit your complaint',
              desc: 'Tell your story publicly. The company is notified and has 7 days to respond on the record.' },
            { n: '02', title: 'Company responds publicly',
              desc: "Their reply is visible to everyone — permanent proof of how they handle real customer issues." },
            { n: '03', title: 'You rate and close',
              desc: 'Only you can mark it resolved. Your rating moves the company score — fairly, either way.' },
          ].map(s => (
            <div key={s.n} className="card p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-display italic-display text-[40px] leading-none" style={{ color: 'var(--color-ochre)' }}>
                  {s.n}
                </span>
                <span className="w-10 h-[1px]" style={{ background: 'var(--color-line)' }} />
              </div>
              <h3 className="font-display text-[18px] font-semibold">{s.title}</h3>
              <p className="text-sm text-[color:var(--color-ink-2)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BOTTOM CTA  (non-authenticated only)
      ══════════════════════════════════════════ */}
      {!user && (
        <section className="mb-8">
          <div className="relative rounded-[28px] overflow-hidden" style={{ background: 'var(--color-ink)' }}>
            <div className="absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, var(--color-ochre) 0%, transparent 70%)' }} />
            <div className="relative px-8 py-12 sm:px-14 sm:py-16 text-center">
              <div className="caps mb-3" style={{ color: 'var(--color-ochre-2)' }}>Ready?</div>
              <h2 className="font-display text-[32px] sm:text-[44px] font-semibold tracking-tight mb-3"
                style={{ color: 'var(--color-paper)' }}>
                Your voice matters.{' '}
                <span className="italic-display" style={{ color: 'var(--color-ochre-2)' }}>Use it.</span>
              </h2>
              <p className="text-[15px] max-w-md mx-auto mb-8 leading-relaxed" style={{ color: '#C9CFC8' }}>
                Join Aus Fair Go — the public record where Australian consumer voices create real change.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/register" className="btn"
                  style={{ background: 'var(--color-ochre)', color: 'var(--color-ink)' }}>
                  Create free account <Icon name="arrow-r" size={14} />
                </Link>
                <Link to="/register?role=business" className="btn btn-ghost"
                  style={{ color: 'var(--color-paper)' }}>
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

/* ─────────────────────────────────────────────────────────
   ComplaintFeedRow — shared by hero widget (compact) and main feed
───────────────────────────────────────────────────────── */
function ComplaintFeedRow({ complaint, compact = false }) {
  const st         = STATUS_STYLE[complaint.status] ?? STATUS_STYLE.open
  const lastActive = new Date(complaint.updated_at || complaint.created_at)
  const timeStr    = lastActive.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  const dateStr    = lastActive.toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short' })

  return (
    <Link to={`/complaints/${complaint.id}`}
      className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-[color:var(--color-paper-2)] transition group">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st.dot }} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-4 decoration-[color:var(--color-ink)]/30 leading-snug">
          {complaint.title}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>
          vs <span className="font-medium" style={{ color: 'var(--color-ink-2)' }}>{complaint.company?.name}</span>
          <span className="mx-1.5 opacity-30">·</span>
          <span className="capitalize">{complaint.category}</span>
          {!compact && complaint.feedback?.rating && (
            <>
              <span className="mx-1.5 opacity-30">·</span>
              <span className="font-medium" style={{ color: 'var(--color-ochre)' }}>
                {complaint.feedback.rating}/5{' '}
                {complaint.feedback.would_deal_again != null
                  ? (complaint.feedback.would_deal_again ? '👍' : '👎')
                  : ''}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Status + AI badge — full feed only, hidden on mobile */}
      {!compact && (
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <AiReviewedBadge moderation_status={complaint.moderation_status} size="xs" />
          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ color: st.fg, background: st.bg }}>
            {st.label}
          </span>
        </div>
      )}

      {/* Time */}
      <span className="text-[10px] sm:text-[11px] font-mono shrink-0" style={{ color: 'var(--color-muted)' }}>
        {compact ? timeStr : `${dateStr} · ${timeStr}`}
      </span>
    </Link>
  )
}
