import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import Icon from '../../components/Icon'
import useSeoMeta from '../../hooks/useSeoMeta'

/* ── constants ─────────────────────────────────────────────── */
const STATUS_OPTS = [
  { value: '',                 label: 'All',        dot: null },
  { value: 'open',             label: 'Open',       dot: 'var(--color-eucalyptus)' },
  { value: 'responded',        label: 'Responded',  dot: '#5A6FA8' },
  { value: 'resolved',         label: 'Resolved',   dot: '#3E7560' },
  { value: 'unresolved',       label: 'Unresolved', dot: 'var(--color-clay)' },
  { value: 'awaiting_response',label: 'Awaiting',   dot: '#D8A24A' },
  { value: 'expired',          label: 'Expired',    dot: 'var(--color-muted)' },
]

const CATEGORY_OPTS = [
  { value: '',          label: 'All categories', emoji: null  },
  { value: 'billing',   label: 'Billing',        emoji: '💳' },
  { value: 'delivery',  label: 'Delivery',       emoji: '📦' },
  { value: 'service',   label: 'Service',        emoji: '🎧' },
  { value: 'refund',    label: 'Refund',         emoji: '↩️' },
  { value: 'fraud',     label: 'Fraud',          emoji: '⚠️' },
]

const STATUS_STYLE = {
  open:              { label: 'Open',        fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)', dot: 'var(--color-eucalyptus)' },
  awaiting_response: { label: 'Awaiting',    fg: '#8A5A1F',                 bg: '#F3E2C3',                   dot: '#D8A24A' },
  responded:         { label: 'Responded',   fg: '#3B4B7A',                 bg: '#DAE0EE',                   dot: '#5A6FA8' },
  resolved:          { label: 'Resolved',    fg: 'var(--color-eucalyptus)', bg: '#E7EEDF',                   dot: '#3E7560' },
  unresolved:        { label: 'Unresolved',  fg: 'var(--color-clay)',       bg: 'var(--color-clay-soft)',    dot: 'var(--color-clay)' },
  expired:           { label: 'Expired',     fg: 'var(--color-muted)',      bg: 'var(--color-paper-2)',      dot: 'var(--color-muted)' },
}

/* ─────────────────────────────────────────────────────────── */
export default function ComplaintsPage() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  useSeoMeta({
    title: 'All complaints — Aus Fair Go',
    description: 'Browse every public complaint filed against Australian businesses. Filter by status, category, or search by company name.',
    url: 'https://ausfairgo.com.au/complaints',
  })

  // ── filter state (synced to URL) ──────────────────────────
  const [search,   setSearch]   = useState(searchParams.get('q')        ?? '')
  const [status,   setStatus]   = useState(searchParams.get('status')   ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')

  // ── data state ────────────────────────────────────────────
  const [items,   setItems]   = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [appending, setAppending] = useState(false)

  const searchTimer = useRef(null)
  const PER_PAGE    = 20

  // ── sync filters → URL ────────────────────────────────────
  useEffect(() => {
    const p = {}
    if (search)   p.q        = search
    if (status)   p.status   = status
    if (category) p.category = category
    setSearchParams(p, { replace: true })
  }, [search, status, category])

  // ── fetch (reset to page 1 on filter change) ──────────────
  const fetchPage = useCallback(async (pg, append = false) => {
    append ? setAppending(true) : setLoading(true)
    try {
      const r = await api.get('/complaints', {
        params: { q: search, status, category, page: pg, per_page: PER_PAGE },
      })
      const data = r.data.data ?? []
      setItems(prev => append ? [...prev, ...data] : data)
      setTotal(r.data.total ?? 0)
      setHasMore(r.data.current_page < r.data.last_page)
      setPage(r.data.current_page)
    } catch {
      /* silent */
    } finally {
      append ? setAppending(false) : setLoading(false)
    }
  }, [search, status, category])

  // reset + fetch when filters change
  useEffect(() => {
    fetchPage(1, false)
  }, [fetchPage])

  // debounced search
  const handleSearchInput = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
  }

  const loadMore = () => fetchPage(page + 1, true)

  // ── active filter count ───────────────────────────────────
  const activeCount = [search, status, category].filter(Boolean).length

  const clearAll = () => {
    setSearch('')
    setStatus('')
    setCategory('')
  }

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="caps mb-1" style={{ color: 'var(--color-eucalyptus)' }}>
            <span className="relative inline-flex mr-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75"
                style={{ background: 'var(--color-eucalyptus)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: 'var(--color-eucalyptus)' }} />
            </span>
            Public record
          </div>
          <h1 className="font-display text-[36px] sm:text-[44px] font-semibold tracking-tight leading-tight">
            All complaints
            {total > 0 && (
              <span className="ml-3 font-mono text-[22px] font-normal text-[color:var(--color-muted)]">
                {total.toLocaleString('en-AU')}
              </span>
            )}
          </h1>
        </div>
        {user && (
          <Link to="/complaints/new" className="btn btn-primary shrink-0">
            <Icon name="plus" size={14} /> Submit a complaint
          </Link>
        )}
      </div>

      {/* ── Filter panel ─────────────────────────────────────── */}
      <div className="card p-5 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Icon name="search" size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] pointer-events-none" />
          <input
            value={search}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Search by title or company name..."
            className="input pl-9 text-sm w-full"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Status */}
        <div>
          <p className="caps text-[10px] text-[color:var(--color-muted)] mb-2">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTS.map(opt => (
              <button key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                  status === opt.value
                    ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                    : 'border-[color:var(--color-line)] bg-[color:var(--color-card)] text-[color:var(--color-ink-2)] hover:border-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]'
                }`}>
                {opt.dot && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: status === opt.value ? 'currentColor' : opt.dot }} />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <p className="caps text-[10px] text-[color:var(--color-muted)] mb-2">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_OPTS.map(opt => (
              <button key={opt.value}
                onClick={() => setCategory(opt.value)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                  category === opt.value
                    ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                    : 'border-[color:var(--color-line)] bg-[color:var(--color-card)] text-[color:var(--color-ink-2)] hover:border-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]'
                }`}>
                {opt.emoji && <span className="text-[11px]">{opt.emoji}</span>}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters bar */}
        {activeCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t hairline">
            <p className="text-xs text-[color:var(--color-muted)]">
              {activeCount} filter{activeCount !== 1 ? 's' : ''} active
              {total > 0 && <> &mdash; {total.toLocaleString('en-AU')} result{total !== 1 ? 's' : ''}</>}
            </p>
            <button onClick={clearAll}
              className="text-xs font-medium text-[color:var(--color-clay)] hover:underline transition">
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────── */}
      {loading ? (
        <div className="card overflow-hidden divide-y hairline-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-[color:var(--color-paper-2)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[color:var(--color-paper-2)] rounded w-2/3" />
                <div className="h-3 bg-[color:var(--color-paper-2)] rounded w-1/3" />
              </div>
              <div className="h-5 w-20 bg-[color:var(--color-paper-2)] rounded-full shrink-0" />
              <div className="h-3 w-12 bg-[color:var(--color-paper-2)] rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="font-display italic-display text-[24px] mb-2 text-[color:var(--color-muted)]">
            No complaints found.
          </div>
          <p className="text-sm text-[color:var(--color-muted)] mb-5">
            {activeCount > 0 ? 'Try adjusting your filters.' : 'Be the first to file a complaint.'}
          </p>
          {activeCount > 0 ? (
            <button onClick={clearAll} className="btn btn-secondary">
              Clear filters
            </button>
          ) : (
            <Link to={user ? '/complaints/new' : '/register'} className="btn btn-primary inline-flex">
              Submit a complaint <Icon name="arrow-r" size={14} />
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="card overflow-hidden divide-y hairline-2">
            {items.map(c => <ComplaintRow key={c.id} complaint={c} />)}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-4 text-center">
              <button onClick={loadMore} disabled={appending}
                className="btn btn-secondary min-w-[200px]">
                {appending
                  ? <span className="flex items-center gap-2 justify-center">
                      <Icon name="sparkle" size={14} className="animate-spin" /> Loading...
                    </span>
                  : `Load more (${total - items.length} remaining)`
                }
              </button>
            </div>
          )}

          {/* Footer count */}
          {!hasMore && items.length > 0 && (
            <p className="text-center text-xs text-[color:var(--color-muted)] mt-6">
              Showing all {items.length.toLocaleString('en-AU')} complaint{items.length !== 1 ? 's' : ''}
            </p>
          )}
        </>
      )}
    </div>
  )
}

/* ── Individual complaint row ──────────────────────────────── */
function ComplaintRow({ complaint }) {
  const st = STATUS_STYLE[complaint.status] ?? STATUS_STYLE.open
  const daysAgo = Math.floor((Date.now() - new Date(complaint.created_at)) / 86400000)
  const dateLabel = daysAgo === 0 ? 'today' : daysAgo === 1 ? '1d ago' : `${daysAgo}d ago`

  return (
    <Link to={`/complaints/${complaint.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-[color:var(--color-paper-2)] transition group">

      <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: st.dot }} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-4 decoration-[color:var(--color-ink)]/30 leading-snug">
          {complaint.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs text-[color:var(--color-muted)]">vs</span>
          <span className="text-xs font-medium text-[color:var(--color-ink-2)]">
            {complaint.company?.name}
          </span>
          <span className="text-xs text-[color:var(--color-muted)] opacity-40">&middot;</span>
          <span className="text-xs text-[color:var(--color-muted)] capitalize">{complaint.category}</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-3 shrink-0">
        <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ color: st.fg, background: st.bg }}>
          {st.label}
        </span>
        <span className="text-[11px] text-[color:var(--color-muted)] font-mono w-14 text-right">
          {dateLabel}
        </span>
      </div>

      <div className="sm:hidden shrink-0">
        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: st.fg, background: st.bg }}>
          {st.label}
        </span>
      </div>
    </Link>
  )
}
