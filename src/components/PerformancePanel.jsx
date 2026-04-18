import { useEffect, useRef, useState } from 'react'
import api from '../lib/axios'

const PERIODS = [
  { id: '6months',  label: '6 months' },
  { id: '12months', label: '12 months' },
  { id: 'year',     label: new Date().getFullYear().toString() },
  { id: 'all',      label: 'All time' },
]

/* ── Animated number counter ──────────────────────────────── */
function CountUp({ to, duration = 700, suffix = '' }) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const start = performance.now()
    const from  = 0
    cancelAnimationFrame(raf.current)
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(from + (to - from) * ease))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [to, duration])

  return <>{val}{suffix}</>
}

/* ── Animated bar ─────────────────────────────────────────── */
function Bar({ pct, color, duration = 800, delay = 0 }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay)
    return () => clearTimeout(t)
  }, [pct, delay])

  return (
    <div className="h-2 rounded-full overflow-hidden"
      style={{ background: 'var(--color-line)' }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          background: color,
          transition: `width ${duration}ms cubic-bezier(0.34,1.56,0.64,1)`,
        }}
      />
    </div>
  )
}

/* ── Metric row ───────────────────────────────────────────── */
function Metric({ icon, label, value, suffix = '%', bar = true, color, subtext, delay = 0 }) {
  const pct = typeof value === 'number' ? Math.min(100, Math.max(0, value)) : 0

  const autoColor = color ?? (
    pct >= 80 ? 'var(--color-eucalyptus)' :
    pct >= 50 ? 'var(--color-ochre)' :
    'var(--color-clay)'
  )

  return (
    <div className="space-y-1.5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{icon}</span>
          <span className="text-sm text-[color:var(--color-ink-2)]">{label}</span>
        </div>
        <span className="font-display text-[17px] font-semibold shrink-0 tabular-nums"
          style={{ color: autoColor }}>
          {value !== null && value !== undefined
            ? <><CountUp to={value} />{suffix}</>
            : <span className="text-[color:var(--color-muted)] text-sm">—</span>
          }
        </span>
      </div>
      {bar && value !== null && value !== undefined && (
        <Bar pct={pct} color={autoColor} delay={delay + 100} />
      )}
      {subtext && (
        <p className="text-[11px] text-[color:var(--color-muted)] pl-7">{subtext}</p>
      )}
    </div>
  )
}

/* ── Stars display ────────────────────────────────────────── */
function Stars({ rating }) {
  if (!rating) return <span className="text-[color:var(--color-muted)] text-sm">No ratings yet</span>
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((n) => (
          <span key={n} className="text-sm transition-all duration-300"
            style={{ color: n <= Math.round(rating) ? 'var(--color-ochre)' : 'var(--color-line)', filter: n <= Math.round(rating) ? 'none' : 'grayscale(1)' }}>
            ★
          </span>
        ))}
      </div>
      <span className="font-display text-[17px] font-semibold" style={{ color: 'var(--color-ochre)' }}>
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-[color:var(--color-muted)]">/ 5</span>
    </div>
  )
}

/* ── Category pill bar ────────────────────────────────────── */
function CategoryBar({ breakdown }) {
  if (!breakdown || Object.keys(breakdown).length === 0) return null
  const entries = Object.entries(breakdown).sort((a, b) => b[1].count - a[1].count).slice(0, 5)
  const max = entries[0][1].count

  const palette = [
    'var(--color-clay)',
    'var(--color-ochre)',
    '#3B4B7A',
    'var(--color-eucalyptus)',
    'var(--color-muted)',
  ]

  return (
    <div className="space-y-2 pt-2">
      {entries.map(([cat, { count, pct }], i) => (
        <div key={cat} className="flex items-center gap-3">
          <span className="text-xs text-[color:var(--color-ink-2)] capitalize w-20 shrink-0 truncate">{cat}</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-line)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(count / max) * 100}%`, background: palette[i] }} />
          </div>
          <span className="text-[11px] text-[color:var(--color-muted)] w-8 text-right shrink-0">{count}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Main component ───────────────────────────────────────── */
export default function PerformancePanel({ slug, companyName }) {
  const [period, setPeriod] = useState('6months')
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    api.get(`/companies/${slug}/performance`, { params: { period } })
      .then((r) => { setData(r.data); setAnimKey((k) => k + 1) })
      .finally(() => setLoading(false))
  }, [slug, period])

  const fmt = (hours) => {
    if (hours <= 0) return null
    if (hours < 1) return 'Under 1 hour'
    if (hours < 24) return `${Math.round(hours)} hour${Math.round(hours) !== 1 ? 's' : ''}`
    const days = Math.round(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  const periodLabel = PERIODS.find((p) => p.id === period)?.label ?? ''
  const dateRange   = data?.since
    ? `${new Date(data.since).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} → ${new Date(data.until).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : `Up to ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <section className="pb-12">
      <div className="card overflow-hidden" style={{ background: 'var(--color-paper-2)' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b hairline-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[color:var(--color-ink)] text-[15px]">
                Performance of {companyName}
              </h3>
              <p className="text-[11px] text-[color:var(--color-muted)] mt-0.5">{dateRange}</p>
            </div>

            {/* Period tabs */}
            <div className="flex gap-1 p-1 rounded-xl shrink-0"
              style={{ background: 'var(--color-paper)' }}>
              {PERIODS.map((p) => (
                <button key={p.id} onClick={() => setPeriod(p.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={period === p.id ? {
                    background: 'var(--color-eucalyptus)',
                    color: 'var(--color-paper)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  } : {
                    color: 'var(--color-muted)',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-5 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-4 bg-[color:var(--color-line)] rounded w-40" />
                    <div className="h-4 bg-[color:var(--color-line)] rounded w-10" />
                  </div>
                  <div className="h-2 bg-[color:var(--color-line)] rounded-full" />
                </div>
              ))}
            </div>
          ) : !data || data.total === 0 ? (
            <p className="text-sm text-[color:var(--color-muted)] text-center py-8">
              No complaints recorded in this period.
            </p>
          ) : (
            <div key={animKey} className="space-y-5">

              {/* Volume */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl"
                style={{ background: 'var(--color-paper)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <span className="text-sm text-[color:var(--color-ink-2)]">Complaints received</span>
                </div>
                <span className="font-display text-[22px] font-semibold text-[color:var(--color-ink)]">
                  <CountUp to={data.total} />
                </span>
              </div>

              <div className="space-y-5 pt-1">
                <Metric
                  icon="📣"
                  label="Response rate"
                  value={data.response_rate}
                  suffix="%"
                  subtext={data.awaiting > 0 ? `${data.awaiting} complaint${data.awaiting !== 1 ? 's' : ''} still awaiting a response` : 'All complaints have been responded to'}
                  delay={0}
                />
                <Metric
                  icon="✅"
                  label="Resolution rate"
                  value={data.resolution_rate}
                  suffix="%"
                  subtext="Consumers who confirmed their issue was resolved"
                  delay={80}
                />
                {data.deal_again_pct !== null && (
                  <Metric
                    icon="🔁"
                    label="Would deal again"
                    value={data.deal_again_pct}
                    suffix="%"
                    subtext={`Out of ${data.rated_count} consumer${data.rated_count !== 1 ? 's' : ''} who left feedback`}
                    delay={160}
                  />
                )}
                {data.satisfaction_pct !== null && (
                  <Metric
                    icon="😊"
                    label="Positive ratings"
                    value={data.satisfaction_pct}
                    suffix="%"
                    subtext="Consumers who gave 4 or 5 stars"
                    delay={240}
                  />
                )}
              </div>

              {/* Star rating */}
              {data.avg_rating !== null && (
                <div className="flex items-center justify-between py-3 px-4 rounded-xl"
                  style={{ background: 'var(--color-paper)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <span className="text-sm text-[color:var(--color-ink-2)]">Average consumer rating</span>
                  </div>
                  <Stars rating={data.avg_rating} />
                </div>
              )}

              {/* Response time */}
              {data.avg_response_hours > 0 && (
                <div className="flex items-center justify-between py-3 px-4 rounded-xl"
                  style={{ background: 'var(--color-paper)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏱</span>
                    <span className="text-sm text-[color:var(--color-ink-2)]">Avg. response time</span>
                  </div>
                  <span className="font-semibold text-sm"
                    style={{ color: data.avg_response_hours <= 24 ? 'var(--color-eucalyptus)' : data.avg_response_hours <= 72 ? 'var(--color-ochre)' : 'var(--color-clay)' }}>
                    {fmt(data.avg_response_hours)}
                  </span>
                </div>
              )}

              {/* Top complaint categories */}
              {data.category_breakdown && Object.keys(data.category_breakdown).length > 0 && (
                <div className="pt-2 border-t hairline-2">
                  <p className="caps text-[color:var(--color-muted)] mb-3">Top complaint categories</p>
                  <CategoryBar breakdown={data.category_breakdown} />
                </div>
              )}

              {/* Footer */}
              <p className="text-[11px] text-[color:var(--color-muted)] pt-2 border-t hairline-2">
                Data corresponds to the period{data.since ? ` from ${new Date(data.since).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} to ${new Date(data.until).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}` : ' — all time'}.
                Updated in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
