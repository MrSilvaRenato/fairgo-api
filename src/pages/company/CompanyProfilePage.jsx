import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/axios'
import Icon from '../../components/Icon'
import ScoreMeter, { BAND } from '../../components/ScoreMeter'
import useSeoMeta from '../../hooks/useSeoMeta'
import PerformancePanel from '../../components/PerformancePanel'

/* ── Display config ─────────────────────────────────────── */
const STATUS_STYLE = {
  open:              { label: 'Open',              fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)', dot: 'var(--color-eucalyptus)' },
  awaiting_response: { label: 'Awaiting response', fg: '#8A5A1F',                 bg: '#F3E2C3',                   dot: '#D8A24A' },
  responded:         { label: 'Responded',         fg: '#3B4B7A',                 bg: '#DAE0EE',                   dot: '#5A6FA8' },
  resolved:          { label: 'Resolved',          fg: 'var(--color-eucalyptus)', bg: '#E7EEDF',                   dot: '#3E7560' },
  unresolved:        { label: 'Unresolved',        fg: 'var(--color-clay)',       bg: 'var(--color-clay-soft)',    dot: 'var(--color-clay)' },
  expired:           { label: 'Expired',           fg: 'var(--color-muted)',      bg: 'var(--color-paper-2)',      dot: 'var(--color-muted)' },
}

const CATEGORIES = [
  { id: 'all',      label: 'All categories' },
  { id: 'billing',  label: 'Billing' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'service',  label: 'Service' },
  { id: 'refund',   label: 'Refund' },
  { id: 'fraud',    label: 'Fraud' },
  { id: 'other',    label: 'Other' },
]

const STATUSES = [
  { id: 'all',                label: 'All status' },
  { id: 'open',               label: 'Open' },
  { id: 'awaiting_response',  label: 'Awaiting response' },
  { id: 'responded',          label: 'Responded' },
  { id: 'resolved',           label: 'Resolved' },
  { id: 'unresolved',         label: 'Unresolved' },
]

/* ────────────────────────────────────────────────────────── */
export default function CompanyProfilePage() {
  const { slug } = useParams()
  const [company, setCompany] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [openComplaint, setOpenComplaint] = useState(null)

  useEffect(() => {
    api.get(`/companies/${slug}`)
      .then((res) => {
        setCompany(res.data)
        return api.get('/complaints', { params: { company_id: res.data.id, per_page: 50 } })
      })
      .then((res) => setComplaints(res.data.data ?? []))
      .finally(() => setLoading(false))
  }, [slug])

  const score = company?.score
  const band  = score?.badge ?? 'not_rated'

  useSeoMeta({
    title:       company ? `${company.name} reviews & complaints` : undefined,
    description: company
      ? `Read ${complaints.length} consumer complaints about ${company.name}. Aus Fair Go score: ${score ? Math.round(score.score) : 'not rated'}. See how ${company.name} handles customer issues.`
      : undefined,
    url: company ? `${window.location.origin}/companies/${company.slug}` : undefined,
    type: 'profile',
  })

  // Schema.org JSON-LD structured data
  useEffect(() => {
    if (!company) return

    const schemaId = 'schema-company-profile'
    const existing = document.getElementById(schemaId)
    if (existing) existing.remove()

    const ratingCount = complaints.length
    const ratingValue = score ? Math.round(score.score * 10) / 10 : null

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: company.name,
      url: company.website ?? undefined,
      description: `Consumer complaints and reviews for ${company.name} on Aus Fair Go.`,
      ...(company.industry ? { knowsAbout: company.industry } : {}),
      ...(ratingValue && ratingCount > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: ratingValue,
              bestRating: 100,
              worstRating: 0,
              ratingCount: ratingCount,
              description: `Aus Fair Go accountability score out of 100`,
            },
          }
        : {}),
      sameAs: company.website ? [company.website] : undefined,
    }

    const script = document.createElement('script')
    script.id = schemaId
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)

    return () => {
      document.getElementById(schemaId)?.remove()
    }
  }, [company, complaints, score])

  if (loading) return <ProfileSkeleton />
  if (!company) return <NotFound />

  return (
    <div className="max-w-6xl mx-auto px-6">
      <Breadcrumb company={company} />
      <Hero company={company} score={score} band={band} />
      <StatsStrip score={score} />
      {score && <PerformancePanel slug={company.slug} companyName={company.name} />}
      {score && <CategoryBreakdown complaints={complaints} />}
      <ComplaintsBlock
        company={company}
        complaints={complaints}
        onOpen={setOpenComplaint}
      />
      <FileCTA company={company} />
      {openComplaint && (
        <DetailSheet
          complaint={openComplaint}
          company={company}
          onClose={() => setOpenComplaint(null)}
        />
      )}
    </div>
  )
}

/* ─── Breadcrumb ─────────────────────────────────────────── */
function Breadcrumb({ company }) {
  return (
    <div className="pt-6 pb-3 flex items-center justify-between text-xs text-[color:var(--color-muted)] font-mono">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-[color:var(--color-ink)]">ausfairgo.com.au</Link>
        <Icon name="chevron-r" size={12} />
        <Link to="/" className="hover:text-[color:var(--color-ink)]">companies</Link>
        {company.industry && (
          <>
            <Icon name="chevron-r" size={12} />
            <Link to="/" className="hover:text-[color:var(--color-ink)] capitalize">{company.industry}</Link>
          </>
        )}
        <Icon name="chevron-r" size={12} />
        <span className="text-[color:var(--color-ink)]">{company.slug}</span>
      </div>
      <div className="hidden md:block">
        Last updated · {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
    </div>
  )
}

/* ─── Hero ───────────────────────────────────────────────── */
function Hero({ company, score, band }) {
  return (
    <section className="pt-2 pb-10">
      <div className="grid md:grid-cols-[1fr_auto] gap-10 items-start">
        <div className="rise">
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {company.industry && (
              <span className="chip capitalize">
                <Icon name="building" size={13} /> {company.industry}
              </span>
            )}
            {company.claimed && company.abn_verified && (
              <span className="chip font-semibold"
                style={{ color: '#1d4ed8', borderColor: '#93c5fd', background: '#eff6ff' }}>
                <Icon name="verified" size={13} /> ABN Verified
              </span>
            )}
            {company.claimed && (
              <span className="chip font-semibold"
                style={{ color: '#166534', borderColor: '#86efac', background: '#f0fdf4' }}>
                ✅ Actively Managed
              </span>
            )}
            {company.verified_badge && (
              <span className="chip font-semibold"
                style={{ color: 'var(--color-eucalyptus)', borderColor: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)' }}>
                <Icon name="verified" size={13} /> Aus Fair Go Verified
              </span>
            )}
            {company.not_recommended && (
              <span className="chip font-semibold"
                style={{ color: 'var(--color-clay)', borderColor: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                <Icon name="flag" size={13} /> Not Recommended
              </span>
            )}
            {company.website && (
              <span className="chip"><Icon name="globe" size={13} /> {company.website}</span>
            )}
          </div>

          <h1 className="font-display text-[44px] sm:text-[56px] leading-[1.02] font-semibold tracking-tight mb-4">
            {company.name}
          </h1>

          {company.description && (
            <p className="text-[17px] text-[color:var(--color-ink-2)] max-w-[54ch] leading-relaxed">
              {company.description}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Link to={`/complaints/new?company_id=${company.id}`} className="btn btn-primary">
              File a complaint <Icon name="arrow-r" size={14} />
            </Link>
            <button className="btn btn-secondary">Follow this company</button>
            <button className="btn btn-ghost text-sm">
              <Icon name="share" size={14} /> Share
            </button>
          </div>

          {/* Claim CTA — only show when not yet claimed */}
          {!company.claimed && (
            <div className="mt-5">
              <Link
                to={`/companies/${company.slug}/claim`}
                className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all group"
                style={{
                  borderColor: 'var(--color-eucalyptus)',
                  background: 'var(--color-eucalyptus-3)',
                  color: 'var(--color-eucalyptus)',
                }}
              >
                <span className="text-xl">🏢</span>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-tight">Is this your business?</p>
                  <p className="text-xs opacity-80 leading-tight mt-0.5">Claim this profile and manage complaints</p>
                </div>
                <span className="ml-1 font-bold text-lg leading-none group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          )}

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 max-w-xl text-sm">
            {company.claimed && company.abn && <Meta label="ABN" value={company.abn} mono />}
            <Meta label="On Aus Fair Go since" value={company.created_at ? new Date(company.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : '—'} />
            {score && score.total_complaints > 0 && (
              <Meta
                label="Avg response"
                value={score.avg_response_hours < 1 ? '<1h' : `${Math.round(score.avg_response_hours)}h`}
                accent
              />
            )}
          </div>
        </div>

        <div className="rise" style={{ animationDelay: '80ms' }}>
          {score?.is_rated ? (
            <div className="card p-6 sm:p-7 w-full md:w-[300px]">
              <div className="caps mb-3">Aus Fair Go score</div>
              <div className="flex justify-center">
                <ScoreMeter score={score.score ?? 0} band={band} />
              </div>
              <p className="text-xs text-[color:var(--color-muted)] text-center mt-3 leading-relaxed">
                Weighted from {(score.total_complaints ?? 0).toLocaleString()} public complaints,
                response rate and resolution quality.
              </p>
            </div>
          ) : (
            <div className="card p-6 sm:p-7 w-full md:w-[300px] space-y-4">
              <div className="caps">Aus Fair Go score</div>
              {/* Not enough data yet */}
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  style={{ background: 'var(--color-paper-2)' }}>
                  📊
                </div>
                <div>
                  <p className="font-semibold text-sm text-[color:var(--color-ink)]">Not enough data yet</p>
                  <p className="text-xs text-[color:var(--color-muted)] mt-1 leading-relaxed">
                    {score?.total_complaints > 0
                      ? `${score.complaints_needed} more complaint${score.complaints_needed !== 1 ? 's' : ''} needed to generate a rating`
                      : 'No complaints have been filed yet'}
                  </p>
                </div>
              </div>
              {/* Raw stats while below threshold */}
              {score && score.total_complaints > 0 && (
                <div className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--color-line)' }}>
                  <StatRow label="Complaints filed" value={score.total_complaints} />
                  <StatRow label="Response rate"    value={`${Math.round((score.response_rate ?? 0) * 100)}%`} />
                </div>
              )}
              <p className="text-[11px] text-[color:var(--color-muted)] leading-relaxed text-center">
                A minimum of 10 complaints is required to generate a fair and reliable score.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Meta({ label, value, mono, accent }) {
  return (
    <div>
      <div className="caps mb-1">{label}</div>
      <div
        className={`${mono ? 'font-mono text-[13px]' : 'text-[14px]'} ${
          accent ? 'text-[color:var(--color-eucalyptus)] font-medium' : 'text-[color:var(--color-ink)]'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function TrendBadge({ trend }) {
  const up = trend >= 0
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
      style={{
        color: up ? 'var(--color-eucalyptus)' : 'var(--color-clay)',
        background: up ? 'var(--color-eucalyptus-3)' : 'var(--color-clay-soft)',
      }}
    >
      <Icon name={up ? 'arrow-up' : 'arrow-dn'} size={12} /> {up ? '+' : ''}{trend} · 30d
    </span>
  )
}

/* ─── Stats strip ────────────────────────────────────────── */
function StatsStrip({ score }) {
  if (!score) return null
  const rated = score.is_rated
  const none  = score.total_complaints < 1
  const items = [
    { k: 'Public complaints', v: score.total_complaints.toLocaleString(), sub: 'on record' },
    { k: 'Response rate',     v: none ? '—' : `${Math.round(score.response_rate * 100)}%`,   sub: rated ? 'within 7 days' : 'early data' },
    { k: 'Resolution rate',   v: (!rated || none) ? '—' : `${Math.round(score.resolution_rate * 100)}%`, sub: rated ? 'of responded cases' : 'not enough data' },
    { k: 'Avg. response time',v: none ? '—' : score.avg_response_hours < 1 ? '<1h' : `${Math.round(score.avg_response_hours)}h`, sub: 'median' },
  ]
  return (
    <section className="pb-12">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 hairline-2">
          {items.map((it) => (
            <div key={it.k} className="p-6">
              <div className="caps mb-2">{it.k}</div>
              <div className="font-display text-[34px] leading-none font-semibold tracking-tight">{it.v}</div>
              <div className="text-xs text-[color:var(--color-muted)] mt-2">{it.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Performance panel (Reclame Aqui style) ─────────────── */
/* ─── Category breakdown ─────────────────────────────────── */
function CategoryBreakdown({ complaints }) {
  const breakdown = useMemo(() => {
    const tally = {}
    complaints.forEach((c) => { tally[c.category] = (tally[c.category] ?? 0) + 1 })
    const total = complaints.length || 1
    return Object.entries(tally)
      .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [complaints])

  if (breakdown.length === 0) return null
  const palette = ['var(--color-ochre)', 'var(--color-eucalyptus)', 'var(--color-amber)', 'var(--color-sage)', 'var(--color-line)']

  return (
    <section className="pb-14">
      <div className="card p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="caps">What complaints are about</div>
            <h3 className="font-display text-[22px] font-semibold mt-1">Category breakdown</h3>
          </div>
          <span className="text-xs text-[color:var(--color-muted)] font-mono">{complaints.length} complaints</span>
        </div>
        <div className="space-y-4">
          {breakdown.map((row, i) => (
            <div key={row.label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm text-[color:var(--color-ink)] capitalize">{row.label}</span>
                <span className="text-xs font-mono text-[color:var(--color-muted)]">
                  {row.count} <span className="text-[color:var(--color-ink)] font-medium">· {row.pct}%</span>
                </span>
              </div>
              <div className="progress">
                <span style={{ width: `${row.pct}%`, background: palette[i] }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Complaints block ───────────────────────────────────── */
function ComplaintsBlock({ company, complaints, onOpen }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [stat, setStat] = useState('all')
  const [sort, setSort] = useState('recent')

  const filtered = useMemo(() => {
    let list = complaints.slice()
    if (cat !== 'all') list = list.filter((c) => c.category === cat)
    if (stat !== 'all') list = list.filter((c) => c.status === stat)
    if (q.trim()) {
      const t = q.toLowerCase()
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(t) ||
          c.description?.toLowerCase().includes(t) ||
          c.consumer?.name?.toLowerCase().includes(t)
      )
    }
    if (sort === 'unresolved') {
      list.sort((a, b) => (b.status === 'unresolved' ? 1 : 0) - (a.status === 'unresolved' ? 1 : 0))
    } else if (sort === 'oldest') {
      list.sort((a, b) => new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at))
    } else {
      list.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    }
    return list
  }, [complaints, q, cat, stat, sort])

  return (
    <section className="pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="caps">Public record</div>
          <h2 className="font-display text-[32px] sm:text-[36px] font-semibold leading-tight mt-1">
            Complaints against {company.name}
          </h2>
          <p className="text-[color:var(--color-muted)] text-sm mt-1">
            {filtered.length.toLocaleString()} shown · {complaints.length.toLocaleString()} total
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-[300px]">
            <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search complaints…"
              className="field pl-9"
            />
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="field pr-8 appearance-none cursor-pointer"
            >
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
              <option value="unresolved">Unresolved first</option>
            </select>
            <Icon name="chevron-d" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[color:var(--color-muted)]" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="caps mr-1 self-center">Category</span>
        {CATEGORIES.map((i) => (
          <button
            key={i.id}
            onClick={() => setCat(i.id)}
            className={`chip ${cat === i.id ? 'chip-active' : ''}`}
          >
            {i.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="caps mr-1 self-center">Status</span>
        {STATUSES.map((i) => (
          <button
            key={i.id}
            onClick={() => setStat(i.id)}
            className={`chip ${stat === i.id ? 'chip-active' : ''}`}
          >
            {i.label}
          </button>
        ))}
        {(q || cat !== 'all' || stat !== 'all') && (
          <button
            onClick={() => { setQ(''); setCat('all'); setStat('all') }}
            className="chip"
            style={{ color: 'var(--color-clay)', borderColor: 'var(--color-clay)' }}
          >
            <Icon name="x" size={12} /> Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="font-display italic-display text-[22px] mb-2">Nothing matches that.</div>
          <p className="text-sm text-[color:var(--color-muted)]">Try clearing filters or a different search term.</p>
        </div>
      ) : (
        <ul className="card divide-y hairline-2 overflow-hidden">
          {filtered.map((c) => (
            <ComplaintRow key={c.id} c={c} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ComplaintRow({ c, onOpen }) {
  const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.open
  const ts       = new Date(c.updated_at || c.created_at)
  const daysAgo  = Math.floor((Date.now() - ts) / 86400000)
  const timeStr  = ts.toLocaleString('en-AU', { hour: '2-digit', minute: '2-digit' }).toLowerCase()
  const dateLabel = daysAgo === 0
    ? `today · ${timeStr}`
    : daysAgo === 1
      ? `1 day ago · ${timeStr}`
      : `${daysAgo}d ago`

  return (
    <li>
      <button
        onClick={() => onOpen(c)}
        className="w-full text-left flex items-start gap-5 p-5 sm:p-6 hover:bg-[color:var(--color-paper-2)]/60 transition group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ color: st.fg, background: st.bg }}
            >
              <i className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
              {st.label}
            </span>
            <span className="chip capitalize">{c.category}</span>
            <span className="text-xs text-[color:var(--color-muted)] font-mono">#{c.id}</span>
          </div>
          <h3 className="font-display text-[20px] font-semibold leading-snug group-hover:underline decoration-[color:var(--color-ink)]/30 underline-offset-4">
            {c.title}
          </h3>
          {c.description && (
            <p className="text-sm text-[color:var(--color-ink-2)] mt-2 max-w-[68ch] leading-relaxed line-clamp-2">
              <span className="italic-display text-[color:var(--color-ink)]">“</span>
              {c.description}
              <span className="italic-display text-[color:var(--color-ink)]">”</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs text-[color:var(--color-muted)]">
            {c.consumer?.name && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="user" size={12} /> {c.consumer.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" size={12} /> {dateLabel}
            </span>
            {c.feedback?.rating && (
              <span className="inline-flex items-center gap-1.5 text-[color:var(--color-ochre)] font-medium">
                Rated {c.feedback.rating}/5
              </span>
            )}
          </div>
        </div>
        <div className="hidden md:flex items-center self-center text-[color:var(--color-muted)] group-hover:text-[color:var(--color-ink)] group-hover:translate-x-0.5 transition">
          <Icon name="arrow-r" size={18} />
        </div>
      </button>
    </li>
  )
}

/* ─── Detail sheet ───────────────────────────────────────── */
function DetailSheet({ complaint, company, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const c = complaint
  const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.open

  return (
    <div className="fixed inset-0 z-50 flex justify-end sheet-backdrop" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="sheet w-full max-w-[640px] h-full bg-[color:var(--color-paper)] overflow-y-auto shadow-2xl border-l hairline"
      >
        <div className="sticky top-0 z-10 bg-[color:var(--color-paper)]/90 backdrop-blur border-b hairline-2 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[color:var(--color-muted)]">
            <span>#{c.id}</span><span>·</span>
            <span>{new Date(c.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-[color:var(--color-paper-2)]" aria-label="Share"><Icon name="share" size={16} /></button>
            <button className="p-2 rounded-lg hover:bg-[color:var(--color-paper-2)]" aria-label="Flag"><Icon name="flag" size={16} /></button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[color:var(--color-paper-2)]" aria-label="Close"><Icon name="x" size={16} /></button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ color: st.fg, background: st.bg }}
            >
              <i className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
              {st.label}
            </span>
            <span className="chip capitalize">{c.category}</span>
          </div>

          <h2 className="font-display text-[28px] sm:text-[32px] font-semibold leading-[1.15] tracking-tight mb-4">
            {c.title}
          </h2>

          {c.consumer && (
            <div className="flex items-center gap-4 text-sm text-[color:var(--color-muted)] mb-6">
              <span className="inline-flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs"
                  style={{ background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}
                >
                  {c.consumer.name?.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                </span>
                <span className="text-[color:var(--color-ink)] font-medium">{c.consumer.name}</span>
              </span>
            </div>
          )}

          {c.description && (
            <div className="card p-6 mb-6">
              <p className="text-[15px] leading-relaxed text-[color:var(--color-ink)]">
                <span className="font-display italic text-[32px] leading-none text-[color:var(--color-ochre)] float-left mr-1 -mt-1">“</span>
                {c.description}
              </p>
            </div>
          )}

          {c.response && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-eucalyptus)' }}>
                  <span className="text-[color:var(--color-paper)] font-display font-semibold text-sm">{company.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {company.name} <Icon name="verified" size={13} className="inline text-[color:var(--color-eucalyptus)]" />
                  </div>
                  <div className="text-xs text-[color:var(--color-muted)]">Official response</div>
                </div>
              </div>
              <div className="rounded-2xl p-5 border" style={{ background: 'var(--color-eucalyptus-3)', borderColor: 'var(--color-eucalyptus-2)' }}>
                <p className="text-[15px] leading-relaxed text-[color:var(--color-ink)]">{c.response.content}</p>
              </div>
            </div>
          )}

          {c.status === 'awaiting_response' && (
            <div className="card p-5 mb-6 flex items-center gap-3">
              <Icon name="clock" size={18} className="text-[color:var(--color-ochre)] shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">Awaiting company response</div>
                <div className="text-xs text-[color:var(--color-muted)]">{company.name} must respond publicly within 7 days.</div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-4 border-t hairline-2">
            <button className="btn btn-secondary text-xs"><Icon name="thumb" size={14} /> Helpful</button>
            <button className="btn btn-ghost text-xs"><Icon name="reply" size={14} /> Comment</button>
            <div className="flex-1" />
            <Link to={`/complaints/${c.id}`} className="btn btn-primary text-xs">
              Open full thread <Icon name="arrow-r" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── File CTA ───────────────────────────────────────────── */
function FileCTA({ company }) {
  return (
    <section className="pb-20">
      <div className="relative rounded-[28px] overflow-hidden" style={{ background: 'var(--color-ink)' }}>
        <div
          className="absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-ochre) 0%, transparent 70%)' }}
        />
        <div className="relative px-8 py-12 sm:px-14 sm:py-16 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <div className="caps" style={{ color: 'var(--color-ochre-2)' }}>Had a problem with {company.name}?</div>
            <h2 className="font-display text-[36px] sm:text-[44px] leading-[1.05] font-semibold tracking-tight mt-3" style={{ color: 'var(--color-paper)' }}>
              File it once.{' '}
              <span className="italic-display" style={{ color: 'var(--color-ochre-2)' }}>
                They must reply on the record.
              </span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: '#C9CFC8' }}>
              Aus Fair Go complaints are public, searchable, and permanent. The company's score moves when they do the right thing.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to={`/complaints/new?company_id=${company.id}`} className="btn" style={{ background: 'var(--color-ochre)', color: 'var(--color-ink)' }}>
                Start a complaint <Icon name="arrow-r" size={14} />
              </Link>
              <Link to="/" className="btn btn-ghost" style={{ color: 'var(--color-paper)' }}>
                How it works
              </Link>
            </div>
          </div>
          <ul className="space-y-4 text-sm" style={{ color: '#DCD7C6' }}>
            {[
              ['Takes 3–5 minutes', 'Plain-language form. No jargon.'],
              ['Public by default', 'Anonymous posting available if needed.'],
              ['No fee, ever', 'Free for consumers. Always.'],
              ['You control closure', 'Only you can mark it resolved.'],
            ].map(([h, d]) => (
              <li key={h} className="flex gap-3">
                <span
                  className="mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-ochre)', color: 'var(--color-ink)' }}
                >
                  <Icon name="check" size={12} />
                </span>
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-paper)' }}>{h}</div>
                  <div className="text-xs">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ─── States ─────────────────────────────────────────────── */
function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span className="font-semibold text-[color:var(--color-ink)]">{value}</span>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6 animate-pulse">
      <div className="card h-48" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[color:var(--color-paper-2)] rounded-2xl" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-[color:var(--color-paper-2)] rounded-2xl" />)}
    </div>
  )
}

function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <div className="font-display italic-display text-[36px] mb-3 text-[color:var(--color-ochre)]">Not found.</div>
      <h2 className="font-display text-[28px] font-semibold mb-3">That company isn't on Aus Fair Go yet.</h2>
      <p className="text-sm text-[color:var(--color-muted)] mb-6">It may have been removed, or the link is misspelled.</p>
      <Link to="/" className="btn btn-primary">Back to home <Icon name="arrow-r" size={14} /></Link>
    </div>
  )
}
