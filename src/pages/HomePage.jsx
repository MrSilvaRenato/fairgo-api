import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import CompanyLogo from '../components/CompanyLogo'
import Icon from '../components/Icon'
import { BAND } from '../components/ScoreMeter'
import useSeoMeta from '../hooks/useSeoMeta'

/* ── display config ─────────────────────────────────────── */
const STATUS_STYLE = {
  open:              { label: 'Open',              fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)', dot: 'var(--color-eucalyptus)' },
  awaiting_response: { label: 'Awaiting response', fg: '#8A5A1F',                 bg: '#F3E2C3',                   dot: '#D8A24A' },
  responded:         { label: 'Responded',         fg: '#3B4B7A',                 bg: '#DAE0EE',                   dot: '#5A6FA8' },
  resolved:          { label: 'Resolved',          fg: 'var(--color-eucalyptus)', bg: '#E7EEDF',                   dot: '#3E7560' },
  unresolved:        { label: 'Unresolved',        fg: 'var(--color-clay)',       bg: 'var(--color-clay-soft)',    dot: 'var(--color-clay)' },
  expired:           { label: 'Expired',           fg: 'var(--color-muted)',      bg: 'var(--color-paper-2)',      dot: 'var(--color-muted)' },
}

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

  const [complaints, setComplaints] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(true)

  const [leaderboard, setLeaderboard] = useState([])
  const [industries, setIndustries] = useState([])
  const [activeIndustry, setActiveIndustry] = useState('all')
  const [loadingBoard, setLoadingBoard] = useState(true)
  const [boardMode, setBoardMode]       = useState('best')
  const [moreOpen, setMoreOpen]         = useState(false)
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

  useEffect(() => {
    api.get('/complaints', { params: { per_page: 6 } })
      .then((r) => setComplaints(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingFeed(false))
  }, [])

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
    const rated = (leaderboard ?? []).filter((c) => c.badge !== 'not_rated')
    return boardMode === 'best' ? rated : [...rated].reverse()
  }, [boardMode, leaderboard])

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

        <div className="relative px-2 sm:px-6 py-12 sm:py-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 caps" style={{ color: 'var(--color-eucalyptus)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-eucalyptus)' }} />
            Australia's public complaint record
          </div>

          <h1 className="font-display text-[48px] sm:text-[68px] leading-[1.02] font-semibold tracking-tight mb-5">
            File it once.<br />
            <span className="italic-display" style={{ color: 'var(--color-ochre)' }}>
              Public forever.
            </span>
          </h1>
          <p className="text-[17px] sm:text-[18px] text-[color:var(--color-ink-2)] max-w-xl mx-auto leading-relaxed mb-10">
            A public, searchable record of how Australian businesses treat their customers.
            Free for consumers. The company has 7 days to respond.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative text-left" ref={searchRef}>
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

          <div className="flex flex-wrap justify-center gap-2 mt-7 text-sm">
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
      </section>

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

      {/* ═══════════════ LEADERBOARD ═══════════════ */}
      <section id="leaderboard" className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="caps">Rankings</div>
            <h2 className="font-display text-[32px] font-semibold tracking-tight mt-1">
              Best &amp; worst rated businesses
            </h2>
          </div>

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

        {/* Industry filter — top pills + overflow dropdown */}
        <div className="flex gap-2 flex-wrap items-center mb-5">
          {/* Always show "All" + first VISIBLE_PILLS industries */}
          {['all', ...industries.slice(0, VISIBLE_PILLS)].map((ind) => (
            <button key={ind} onClick={() => { setActiveIndustry(ind); setMoreOpen(false) }}
              className={`chip capitalize ${activeIndustry === ind ? 'chip-active' : ''}`}>
              {ind === 'all' ? 'All industries' : ind}
            </button>
          ))}

          {/* Overflow dropdown */}
          {industries.length > VISIBLE_PILLS && (
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`chip ${industries.slice(VISIBLE_PILLS).includes(activeIndustry) ? 'chip-active' : ''}`}
              >
                {industries.slice(VISIBLE_PILLS).includes(activeIndustry)
                  ? <span className="capitalize">{activeIndustry}</span>
                  : <span>+{industries.length - VISIBLE_PILLS} more</span>
                }
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
                          style={{ color: '#166534', borderColor: '#86efac', background: '#f0fdf4' }}>
                          ✅ Actively Managed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[color:var(--color-muted)] capitalize mt-0.5">
                      {c.industry ?? 'Unknown'} · {c.total} complaints
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="w-28">
                      <div className="flex justify-between text-[10px] font-mono text-[color:var(--color-muted)] mb-1">
                        <span>Score</span>
                        <span className="text-[color:var(--color-ink)] font-medium">{c.score}</span>
                      </div>
                      <div className="progress">
                        <span style={{ width: `${c.score}%`, background: b.ring }} />
                      </div>
                    </div>
                    <span className="caps w-[64px] text-right" style={{ color: b.text }}>{b.label}</span>
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
      </section>

      {/* ═══════════════ RECENT COMPLAINTS ═══════════════ */}
      <section id="recent-complaints" className="mb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="caps">Live feed</div>
            <h2 className="font-display text-[32px] font-semibold tracking-tight mt-1">
              Recent complaints
            </h2>
          </div>
          <Link to="/complaints" className="hidden sm:inline-flex items-center gap-1 text-sm text-[color:var(--color-ink)] hover:underline underline-offset-4">
            View all <Icon name="arrow-r" size={14} />
          </Link>
        </div>

        {loadingFeed ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 bg-[color:var(--color-paper-2)] rounded-full w-20" />
                  <div className="h-5 bg-[color:var(--color-paper-2)] rounded-full w-16" />
                </div>
                <div className="h-5 bg-[color:var(--color-paper-2)] rounded w-3/4" />
                <div className="h-4 bg-[color:var(--color-paper-2)] rounded" />
                <div className="h-4 bg-[color:var(--color-paper-2)] rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="font-display italic-display text-[22px] mb-2">No complaints yet.</div>
            <p className="text-sm text-[color:var(--color-muted)] mb-5">Be the first to start the public record.</p>
            <Link to={user ? '/complaints/new' : '/register'} className="btn btn-primary inline-flex">
              Submit a complaint <Icon name="arrow-r" size={14} />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {complaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
            </div>
            <div className="text-center mt-5 sm:hidden">
              <Link to="/complaints" className="btn btn-secondary text-sm">View all</Link>
            </div>
          </>
        )}
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

/* ─── Complaint card ─────────────────────────────── */
function ComplaintCard({ complaint }) {
  const st = STATUS_STYLE[complaint.status] ?? STATUS_STYLE.open
  const daysAgo = Math.floor((Date.now() - new Date(complaint.created_at)) / 86400000)
  const dateLabel = daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo}d ago`

  return (
    <Link to={`/complaints/${complaint.id}`}
      className="card p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:border-[color:var(--color-ink-2)] transition-all duration-200 group cursor-pointer">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ color: st.fg, background: st.bg }}>
          <i className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
          {st.label}
        </span>
        <span className="text-xs text-[color:var(--color-muted)] capitalize">{complaint.category}</span>
      </div>
      <h3 className="font-display text-[17px] font-semibold text-[color:var(--color-ink)] line-clamp-2 group-hover:underline decoration-[color:var(--color-ink)]/30 underline-offset-4 leading-snug">
        {complaint.title}
      </h3>
      <p className="text-xs text-[color:var(--color-ink-2)] line-clamp-2 leading-relaxed">
        <span className="italic-display">“</span>{complaint.description}<span className="italic-display">”</span>
      </p>
      <div className="flex items-center justify-between pt-3 mt-auto border-t hairline-2 text-xs text-[color:var(--color-muted)]">
        <span>
          vs <span className="font-medium text-[color:var(--color-ink)]">{complaint.company?.name}</span>
        </span>
        <span className="font-mono">{dateLabel}</span>
      </div>
    </Link>
  )
}
