import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/axios'
import CompanyLogo from '../components/CompanyLogo'
import Icon from '../components/Icon'
import { BAND } from '../components/ScoreMeter'
import useSeoMeta from '../hooks/useSeoMeta'

const PERIODS = [
  { id: 'week',  label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'year',  label: 'This year' },
  { id: 'all',   label: 'All time' },
]

const CATEGORIES = [
  { id: '',         label: 'All categories' },
  { id: 'billing',  label: 'Billing' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'service',  label: 'Service' },
  { id: 'refund',   label: 'Refund' },
  { id: 'fraud',    label: 'Fraud' },
  { id: 'other',    label: 'Other' },
]

export default function MostComplainedPage() {
  const [period, setPeriod]     = useState('month')
  const [category, setCategory] = useState('')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)

  useSeoMeta({
    title: 'Most complained about companies',
    description: 'See which Australian businesses receive the most consumer complaints on Fair Go. Updated in real-time.',
  })

  useEffect(() => {
    setLoading(true)
    api.get('/most-complained', { params: { period, category: category || undefined } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false))
  }, [period, category])

  const companies = data?.data ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Most complained about</h1>
        <p className="text-sm text-[color:var(--color-muted)] mt-0.5">
          Australian businesses ranked by volume of consumer complaints filed on Fair Go.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {PERIODS.map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`chip ${period === p.id ? 'chip-active' : ''}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input text-sm py-1.5 pr-8">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-[color:var(--color-paper-2)] rounded-2xl" />)}
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          {companies.length === 0 ? (
            <div className="card p-14 text-center">
              <p className="font-display italic-display text-[22px] text-[color:var(--color-muted)]">No complaints in this period.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <ul className="divide-y divide-[color:var(--color-border)]">
                {companies.map((c, i) => {
                  const b = BAND[c.badge] ?? BAND.not_rated
                  return (
                    <li key={c.id} className="p-4 flex items-center gap-4 hover:bg-[color:var(--color-paper-2)] transition">
                      {/* Rank */}
                      <div className={`w-8 text-center font-display font-semibold shrink-0 ${
                        i === 0 ? 'text-[color:var(--color-clay)] text-xl' :
                        i === 1 ? 'text-[color:var(--color-ochre)] text-lg' :
                        i === 2 ? 'text-[color:var(--color-ink-2)]' :
                        'text-[color:var(--color-muted)] text-sm'
                      }`}>
                        {i === 0 ? '🔴' : i === 1 ? '🟠' : i === 2 ? '🟡' : `#${i + 1}`}
                      </div>

                      <CompanyLogo company={c} size="sm" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/companies/${c.slug}`}
                            className="font-semibold text-sm text-[color:var(--color-ink)] hover:text-[color:var(--color-eucalyptus)] transition">
                            {c.name}
                          </Link>
                          {c.not_recommended && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                              ⚠ Not recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                          <span className="capitalize">{c.industry}</span>
                          {c.top_category && (
                            <span className="ml-1">
                              · Top complaint: <span className="capitalize font-medium text-[color:var(--color-ink-2)]">{c.top_category}</span>
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <p className="font-display text-xl font-semibold text-[color:var(--color-clay)] leading-none">
                            {c.complaint_count}
                          </p>
                          <p className="text-[10px] text-[color:var(--color-muted)] mt-0.5">complaints</p>
                        </div>
                        {c.score != null && (
                          <div className="hidden sm:block">
                            <p className="font-display text-lg font-semibold leading-none" style={{ color: b.text }}>
                              {Math.round(c.score)}
                            </p>
                            <p className="text-[10px] text-[color:var(--color-muted)] mt-0.5">{b.label}</p>
                          </div>
                        )}
                        <Link to={`/companies/${c.slug}`}
                          className="text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition">
                          <Icon name="arrow-r" size={15} />
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {data && (
            <p className="text-xs text-[color:var(--color-muted)] text-center">
              Showing {companies.length} of {data.total} companies · Updated in real-time
            </p>
          )}
        </>
      )}
    </div>
  )
}
