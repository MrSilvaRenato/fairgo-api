import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/axios'
import CompanyLogo from '../components/CompanyLogo'
import Icon from '../components/Icon'
import useSeoMeta from '../hooks/useSeoMeta'
import { BAND } from '../components/ScoreMeter'

export default function SearchPage() {
  const [input, setInput]       = useState('')
  const [companies, setCompanies] = useState([])
  const [loading, setLoading]   = useState(true)

  useSeoMeta({
    title: 'Search businesses — Aus Fair Go',
    description: 'Browse and search all Australian businesses on Aus Fair Go.',
    url: 'https://ausfairgo.com.au/search',
  })

  useEffect(() => {
    api.get('/complaints/company-search')
      .then((r) => setCompanies(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase()
    if (!q) return companies
    return companies.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q)
    )
  }, [input, companies])

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <div className="caps mb-1">Directory</div>
        <h1 className="font-display text-[32px] sm:text-[40px] font-semibold tracking-tight">
          Search businesses
        </h1>
        <p className="text-sm text-[color:var(--color-muted)] mt-1">
          {loading ? 'Loading…' : `${companies.length} businesses registered on Aus Fair Go`}
        </p>
      </div>

      {/* Search input */}
      <div className="relative max-w-lg">
        <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] pointer-events-none" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Filter by name or industry…"
          className="input pl-10 w-full"
          autoFocus
        />
        {input && (
          <button
            onClick={() => setInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition">
            <Icon name="x" size={14} />
          </button>
        )}
      </div>

      {/* Results count when filtering */}
      {input.trim() && !loading && (
        <p className="text-sm text-[color:var(--color-muted)] -mt-2">
          {filtered.length === 0
            ? `No businesses match "${input}"`
            : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${input}"`}
        </p>
      )}

      {/* Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-[color:var(--color-paper-2)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[color:var(--color-paper-2)] rounded w-2/3" />
                <div className="h-3 bg-[color:var(--color-paper-2)] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <p className="font-display italic-display text-[22px] text-[color:var(--color-muted)] mb-2">No businesses found.</p>
          <p className="text-sm text-[color:var(--color-muted)]">Try a different search term.</p>
          <button onClick={() => setInput('')} className="btn btn-secondary mt-4 inline-flex">
            Clear filter
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => {
            const b = BAND[c.badge] ?? BAND.not_rated
            return (
              <div key={c.id} className="card p-4 flex flex-col gap-2">
                <Link to={`/companies/${c.slug}`} className="flex items-center gap-3 group">
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
                      Verified &amp; actively managed
                    </span>
                  </div>
                ) : (
                  <div className="pt-1 border-t hairline">
                    <Link to="/register?role=business"
                      className="text-[11px] text-[color:var(--color-muted)] hover:text-[color:var(--color-eucalyptus)] transition">
                      Is this your business?{' '}
                      <span className="underline underline-offset-2">Claim your free dashboard →</span>
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
