import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import CompanyLogo from '../components/CompanyLogo'
import Icon from '../components/Icon'
import useSeoMeta from '../hooks/useSeoMeta'
import { BAND } from '../components/ScoreMeter'

const STATUS = {
  open:              { label: 'Open',       fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)' },
  awaiting_response: { label: 'Awaiting',   fg: '#8A5A1F',                  bg: '#F3E2C3' },
  responded:         { label: 'Responded',  fg: '#3B4B7A',                  bg: '#DAE0EE' },
  resolved:          { label: 'Resolved',   fg: 'var(--color-eucalyptus)', bg: '#E7EEDF' },
  unresolved:        { label: 'Unresolved', fg: 'var(--color-clay)',       bg: 'var(--color-clay-soft)' },
  expired:           { label: 'Expired',    fg: 'var(--color-muted)',      bg: 'var(--color-paper-2)' },
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q') ?? ''
  const [input, setInput]             = useState(q)
  const [results, setResults]         = useState(null)
  const [loading, setLoading]         = useState(false)
  const [tab, setTab]                 = useState('all')

  // Live dropdown
  const [dropResults, setDropResults] = useState({ companies: [], complaints: [] })
  const [dropOpen, setDropOpen]       = useState(false)
  const [dropLoading, setDropLoading] = useState(false)
  const inputRef                      = useRef(null)
  const dropRef                       = useRef(null)

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (input.length < 2) { setDropResults({ companies: [], complaints: [] }); setDropOpen(false); return }
    const t = setTimeout(() => {
      setDropLoading(true)
      api.get('/search', { params: { q: input } })
        .then((r) => { setDropResults(r.data); setDropOpen(true) })
        .catch(() => {})
        .finally(() => setDropLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [input])

  useSeoMeta({
    title: q ? `Search: "${q}"` : 'Search',
    description: q ? `Search results for "${q}" — companies and complaints on Aus Fair Go.` : undefined,
    url: `https://ausfairgo.com.au/search${q ? `?q=${encodeURIComponent(q)}` : ''}`,
  })

  useEffect(() => {
    if (!q || q.length < 2) { setResults(null); return }
    setLoading(true)
    api.get('/search', { params: { q } })
      .then((r) => setResults(r.data))
      .finally(() => setLoading(false))
  }, [q])

  const submit = (e) => {
    e.preventDefault()
    if (input.trim().length < 2) return
    setParams({ q: input.trim() })
    setTab('all')
  }

  const companies  = results?.companies  ?? []
  const complaints = results?.complaints ?? []
  const total      = companies.length + complaints.length

  const tabs = [
    { id: 'all',        label: `All (${total})` },
    { id: 'companies',  label: `Companies (${companies.length})` },
    { id: 'complaints', label: `Complaints (${complaints.length})` },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Search bar */}
      <div className="relative" ref={dropRef}>
        <form onSubmit={submit} className="flex gap-2">
          <div className="relative flex-1">
            {dropLoading
              ? <Icon name="sparkle" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-eucalyptus)] animate-spin" />
              : <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]" />
            }
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => input.length >= 2 && dropResults.companies.length > 0 && setDropOpen(true)}
              placeholder="Search companies, complaints, categories…"
              className="input pl-10 w-full"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary px-5">Search</button>
        </form>

        {/* Live dropdown */}
        {dropOpen && (dropResults.companies.length > 0 || dropResults.complaints.length > 0) && (
          <div className="absolute z-20 left-0 right-0 mt-1.5 bg-[color:var(--color-card)] rounded-2xl shadow-2xl border hairline overflow-hidden">
            {dropResults.companies.length > 0 && (
              <>
                <p className="caps text-[color:var(--color-muted)] px-4 pt-3 pb-1">Companies</p>
                <ul>
                  {dropResults.companies.slice(0, 5).map((c) => {
                    const b = BAND[c.badge] ?? BAND.not_rated
                    return (
                      <li key={c.id}>
                        <Link to={`/companies/${c.slug}`}
                          onClick={() => setDropOpen(false)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-[color:var(--color-paper-2)] transition gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <CompanyLogo company={c} size="sm" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-[color:var(--color-ink)] truncate">{c.name}</p>
                              <p className="text-xs text-[color:var(--color-muted)] capitalize">{c.industry}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {c.claimed && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: '#166534', background: '#f0fdf4' }}>✅ Managed</span>
                            )}
                            <span className="text-xs font-medium" style={{ color: b.text }}>{b.label !== 'Not rated' ? b.label : ''}</span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
            {dropResults.complaints.length > 0 && (
              <div className="border-t hairline">
                <p className="caps text-[color:var(--color-muted)] px-4 pt-2 pb-1">Complaints</p>
                <ul>
                  {dropResults.complaints.slice(0, 3).map((c) => (
                    <li key={c.id}>
                      <Link to={`/complaints/${c.id}`}
                        onClick={() => setDropOpen(false)}
                        className="flex items-start gap-3 px-4 py-2.5 hover:bg-[color:var(--color-paper-2)] transition">
                        <div className="min-w-0">
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
              <button onClick={submit} className="text-xs text-[color:var(--color-eucalyptus)] hover:underline font-medium">
                See all results for "{input}" →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* No query yet */}
      {!q && (
        <div className="card p-14 text-center">
          <p className="font-display italic-display text-[22px] text-[color:var(--color-muted)] mb-2">What are you looking for?</p>
          <p className="text-sm text-[color:var(--color-muted)]">Search for a company name, complaint keyword, or category.</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[color:var(--color-paper-2)] rounded-2xl" />)}
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Summary + tabs */}
          <div>
            <p className="text-sm text-[color:var(--color-muted)] mb-3">
              {total === 0
                ? `No results for "${q}"`
                : `${total} result${total !== 1 ? 's' : ''} for "${q}"`}
            </p>
            {total > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {tabs.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`chip ${tab === t.id ? 'chip-active' : ''}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Companies */}
          {(tab === 'all' || tab === 'companies') && companies.length > 0 && (
            <section>
              {tab === 'all' && (
                <h2 className="caps text-[color:var(--color-muted)] mb-2">Companies</h2>
              )}
              <div className="card overflow-hidden">
                <ul className="divide-y divide-[color:var(--color-border)]">
                  {companies.map((c) => (
                    <li key={c.id}>
                      <Link to={`/companies/${c.slug}`}
                        className="flex items-center gap-3 p-4 hover:bg-[color:var(--color-paper-2)] transition">
                        <CompanyLogo company={c} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold text-[color:var(--color-ink)]">{c.name}</p>
                            {c.claimed && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                                style={{ color: '#166534', background: '#f0fdf4' }}>
                                ✅ Actively Managed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[color:var(--color-muted)] mt-0.5 capitalize">
                            {c.industry}
                            {c.total > 0 && <span className="ml-1">· {c.total} complaint{c.total !== 1 ? 's' : ''}</span>}
                          </p>
                        </div>
                        {c.score != null && (
                          <div className="text-right shrink-0">
                            <p className="font-display text-lg font-semibold text-[color:var(--color-ink)]">{Math.round(c.score)}</p>
                            <p className="text-[10px] text-[color:var(--color-muted)] capitalize">{c.badge?.replace('_', ' ')}</p>
                          </div>
                        )}
                        <Icon name="arrow-r" size={14} className="text-[color:var(--color-muted)] shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Complaints */}
          {(tab === 'all' || tab === 'complaints') && complaints.length > 0 && (
            <section>
              {tab === 'all' && (
                <h2 className="caps text-[color:var(--color-muted)] mb-2">Complaints</h2>
              )}
              <ul className="space-y-3">
                {complaints.map((c) => {
                  const st = STATUS[c.status] ?? STATUS.open
                  return (
                    <li key={c.id} className="card p-4 hover:shadow-md transition">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ color: st.fg, background: st.bg }}>
                          {st.label}
                        </span>
                        <span className="text-xs text-[color:var(--color-muted)] capitalize">{c.category}</span>
                      </div>
                      <Link to={`/complaints/${c.id}`}
                        className="font-semibold text-[color:var(--color-ink)] hover:text-[color:var(--color-eucalyptus)] transition block leading-snug mb-1">
                        {c.title}
                      </Link>
                      <p className="text-xs text-[color:var(--color-ink-2)] line-clamp-2 mb-2">{c.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-muted)]">
                        <span className="flex items-center gap-1">
                          <Icon name="user" size={11} />
                          {c.consumer?.name}
                        </span>
                        <span>·</span>
                        <Link to={`/companies/${c.company?.slug}`}
                          className="text-[color:var(--color-eucalyptus)] hover:underline font-medium">
                          {c.company?.name}
                        </Link>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Icon name="calendar" size={11} />
                          {new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {total === 0 && (
            <div className="card p-14 text-center">
              <p className="font-display italic-display text-[22px] text-[color:var(--color-muted)] mb-2">No results found.</p>
              <p className="text-sm text-[color:var(--color-muted)]">Try a different search term or browse companies.</p>
              <Link to="/" className="btn btn-secondary mt-4 inline-flex">Browse companies</Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
