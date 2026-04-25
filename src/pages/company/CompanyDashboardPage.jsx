import { useEffect, useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import CompanyResponseForm from '../../components/CompanyResponseForm'
import CompanyLogo from '../../components/CompanyLogo'
import Icon from '../../components/Icon'
import { BAND } from '../../components/ScoreMeter'
import DeleteAccountModal from '../../components/DeleteAccountModal'

const STATUS = {
  open:              { label: 'Open',              fg: 'var(--color-eucalyptus)',  bg: 'var(--color-eucalyptus-3)' },
  awaiting_response: { label: 'Awaiting response', fg: '#8A5A1F',                  bg: '#F3E2C3' },
  responded:         { label: 'Responded',          fg: '#3B4B7A',                  bg: '#DAE0EE' },
  resolved:          { label: 'Resolved',           fg: 'var(--color-eucalyptus)',  bg: '#E7EEDF' },
  unresolved:        { label: 'Unresolved',         fg: 'var(--color-clay)',        bg: 'var(--color-clay-soft)' },
  expired:           { label: 'Expired',            fg: 'var(--color-muted)',       bg: 'var(--color-paper-2)' },
}

export default function CompanyDashboardPage() {
  const { fetchUser, user } = useAuthStore()
  const location = useLocation()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [apiError, setApiError]   = useState(false)
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [respondingTo, setRespondingTo] = useState(null)

  const load = () => {
    api.get('/dashboard/company')
      .then((res) => setData(res.data))
      .catch(() => setApiError(true))
      .finally(() => setLoading(false))
  }

  // Re-fetch every time the user navigates to this page (location.key changes on every navigation)
  useEffect(() => {
    fetchUser().finally(load)
  }, [location.key])

  const markRead = (complaintId) => {
    setData(prev => {
      if (!prev) return prev
      const unreadDelta = prev.complaints.find(c => c.id === complaintId)?.unread_count ?? 0
      return {
        ...prev,
        complaints: prev.complaints.map(c =>
          c.id === complaintId ? { ...c, unread_count: 0 } : c
        ),
        stats: {
          ...prev.stats,
          unread: Math.max(0, (prev.stats.unread ?? 0) - unreadDelta),
        },
      }
    })
  }

  const handleResponseSubmitted = (complaintId, response) => {
    setData((prev) => ({
      ...prev,
      complaints: prev.complaints.map((c) =>
        c.id === complaintId ? { ...c, response, status: 'responded' } : c
      ),
    }))
    setRespondingTo(null)
  }

  const complaints = data?.complaints ?? []
  const stats      = data?.stats ?? {}
  const company    = data?.company ?? null

  const filtered = useMemo(() => {
    let list = filter === 'all' ? complaints : complaints.filter((c) => c.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) =>
        c.title?.toLowerCase().includes(q) ||
        c.consumer?.name?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      )
    }
    return list
  }, [complaints, filter, search])

  if (loading) return <Skeleton />

  // company_admin with no company linked — guide them to register or claim
  if (!user?.company_id) return <NoCompanyPrompt />

  // API failed but user HAS a company linked — transient error
  if (apiError && user?.company_id) {
    return (
      <div className="max-w-lg mx-auto py-24 px-4 text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="font-display text-xl font-semibold mb-2">Couldn't load your dashboard</h2>
        <p className="text-sm text-[color:var(--color-muted)] mb-6">There was a temporary error. Please refresh the page.</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Refresh</button>
      </div>
    )
  }

  if (!data) return <NoCompanyPrompt />

  const score = company.score
  const band  = score?.badge ?? 'not_rated'
  const b     = BAND[band]

  const needsResponse = complaints.filter((c) => c.status === 'open' && !c.response).length
  const totalUnread   = complaints.reduce((sum, c) => sum + (c.unread_count ?? 0), 0)

  const statItems = [
    { label: 'Total',       value: stats.total,            key: 'all' },
    { label: 'Open',        value: stats.open,             key: 'open' },
    { label: 'Responded',   value: stats.responded,        key: 'responded' },
    { label: 'Resolved',    value: stats.resolved,         key: 'resolved' },
    { label: 'Unresolved',  value: stats.unresolved,       key: 'unresolved' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Company header card */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <CompanyLogo company={company} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-display text-2xl font-semibold tracking-tight">{company.name}</h1>
              <span className="chip capitalize">{company.subscription?.plan ?? 'free'}</span>
              {company.verified_badge && (
                <span className="chip font-semibold text-[color:var(--color-eucalyptus)]"
                  style={{ borderColor: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)' }}>
                  <Icon name="verified" size={12} /> Verified
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link to={`/companies/${company.slug}`}
                className="flex items-center gap-1 text-[color:var(--color-eucalyptus)] hover:underline">
                <Icon name="arrow-ul" size={13} /> Public profile
              </Link>
              <Link to="/company/analytics" className="text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]">Analytics</Link>
              <Link to="/company/billing"   className="text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]">Billing</Link>
              <Link to="/company/settings"  className="text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]">Settings</Link>
            </div>
          </div>

          {/* Score pill */}
          {score && (
            <div className="card px-5 py-3 text-center shrink-0 bg-[color:var(--color-paper-2)]">
              <p className="font-display text-[40px] font-semibold leading-none" style={{ color: b.text }}>
                {band === 'not_rated' ? '—' : Math.round(score.score)}
              </p>
              <p className="caps mt-1" style={{ color: b.text }}>{b.label}</p>
              <p className="text-[10px] text-[color:var(--color-muted)] mt-0.5">Aus Fair Go score</p>
            </div>
          )}
        </div>
      </div>

      {/* Unread replies banner */}
      {totalUnread > 0 && (
        <div className="rounded-2xl border border-[color:var(--color-clay)] bg-[color:var(--color-clay-soft)] p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-clay)' }}>
            <Icon name="reply" size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
              {totalUnread} unread follow-up{totalUnread > 1 ? 's' : ''} from consumers
            </p>
            <p className="text-xs text-[color:var(--color-ink-2)] mt-0.5">
              Open the complaint to read — marked as read automatically.
            </p>
          </div>
        </div>
      )}

      {/* Needs response banner */}
      {needsResponse > 0 && (
        <div className="rounded-2xl border border-[color:var(--color-ochre)] bg-[#FDF6E8] p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[color:var(--color-ochre)] flex items-center justify-center shrink-0">
            <Icon name="clock" size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
              {needsResponse} complaint{needsResponse > 1 ? 's' : ''} need{needsResponse === 1 ? 's' : ''} a response
            </p>
            <p className="text-xs text-[color:var(--color-ink-2)] mt-0.5">
              You have 7 days from filing — unanswered complaints hurt your score.
            </p>
          </div>
          <button onClick={() => setFilter('open')} className="btn btn-secondary shrink-0 text-xs">
            View
          </button>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {statItems.map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`card p-4 text-left transition cursor-pointer hover:shadow-md ${
              filter === s.key ? 'ring-2 ring-[color:var(--color-eucalyptus)] ring-offset-1' : ''
            }`}>
            <p className="font-display text-[28px] font-semibold leading-none text-[color:var(--color-ink)]">{s.value}</p>
            <p className="text-xs text-[color:var(--color-muted)] mt-1">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaints, consumers, categories…"
            className="input pl-9 text-sm w-full"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'open', 'responded', 'resolved', 'unresolved'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`chip capitalize ${filter === f ? 'chip-active' : ''}`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints inbox */}
      {filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="font-display italic-display text-[24px] mb-2 text-[color:var(--color-muted)]">
            {search ? 'No results found.' : 'Inbox is clear.'}
          </div>
          <p className="text-sm text-[color:var(--color-muted)]">
            {search ? 'Try a different search term.' : filter === 'all' ? 'No complaints yet.' : `No ${filter} complaints.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              company={company}
              respondingTo={respondingTo}
              setRespondingTo={setRespondingTo}
              onResponseSubmitted={handleResponseSubmitted}
              onRead={markRead}
            />
          ))}
        </ul>
      )}

      {/* Trust badge embed */}
      <TrustBadge slug={company.slug} />
    </div>
  )
}

/* ─── Complaint card ─────────────────────────────────────── */
function ComplaintCard({ complaint: c, company, respondingTo, setRespondingTo, onResponseSubmitted, onRead }) {
  const st          = STATUS[c.status] ?? STATUS.open
  const unreadCount = c.unread_count ?? 0
  const daysLeft    = c.expires_at
    ? Math.ceil((new Date(c.expires_at) - Date.now()) / 86400000)
    : null
  const isUrgent    = !c.response && daysLeft !== null && daysLeft <= 2 && daysLeft > 0
  const isExpiring  = !c.response && daysLeft !== null && daysLeft <= 5 && daysLeft > 2

  return (
    <li className={`card p-5 transition hover:shadow-md ${
      unreadCount > 0 ? 'border-l-[3px] border-l-[color:var(--color-clay)]' : ''
    } ${isUrgent ? 'border-l-[3px] border-l-[color:var(--color-clay)]' : ''}`}>

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Status + category + urgency */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ color: st.fg, background: st.bg }}>
              {st.label}
            </span>
            <span className="text-xs text-[color:var(--color-muted)] capitalize">{c.category}</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-clay)', color: 'var(--color-paper)' }}>
                {unreadCount} new
              </span>
            )}
            {isUrgent && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                <Icon name="clock" size={10} /> {daysLeft}d left
              </span>
            )}
            {isExpiring && !isUrgent && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: '#8A5A1F', background: '#F3E2C3' }}>
                <Icon name="clock" size={10} /> {daysLeft}d left
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/complaints/${c.id}`}
            onClick={() => unreadCount > 0 && onRead?.(c.id)}
            className="font-semibold text-[color:var(--color-ink)] hover:text-[color:var(--color-eucalyptus)] transition block leading-snug mb-1.5">
            {c.title}
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-muted)]">
            <span className="flex items-center gap-1">
              <Icon name="user" size={11} />
              <span className="font-medium text-[color:var(--color-ink-2)]">{c.consumer?.name}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Icon name="calendar" size={11} />
              {new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {!c.response ? (
            <button
              onClick={() => setRespondingTo(respondingTo === c.id ? null : c.id)}
              className={`btn text-xs ${respondingTo === c.id ? 'btn-secondary' : 'btn-primary'}`}>
              {respondingTo === c.id ? 'Cancel' : 'Respond'}
            </button>
          ) : (
            <Link to={`/complaints/${c.id}`}
              onClick={() => unreadCount > 0 && onRead?.(c.id)}
              className="btn btn-secondary text-xs">
              View <Icon name="arrow-r" size={12} />
            </Link>
          )}
        </div>
      </div>

      {/* Description preview */}
      <p className="text-sm text-[color:var(--color-ink-2)] mt-3 line-clamp-2 leading-relaxed">
        {c.description}
      </p>

      {/* Response preview */}
      {c.response && (
        <div className="mt-3 pt-3 border-t hairline-2 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[color:var(--color-eucalyptus-3)]">
            <Icon name="check" size={12} className="text-[color:var(--color-eucalyptus)]" />
          </div>
          <p className="text-xs text-[color:var(--color-ink-2)] line-clamp-2 flex-1">
            <span className="font-medium text-[color:var(--color-ink)]">Your response: </span>
            {c.response.content}
          </p>
        </div>
      )}

      {/* Consumer feedback */}
      {c.feedback && (
        <div className="mt-3 pt-3 border-t hairline-2 flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
          <Icon name={c.feedback.resolved ? 'check' : 'x'} size={13}
            className={c.feedback.resolved ? 'text-[color:var(--color-eucalyptus)]' : 'text-[color:var(--color-clay)]'} />
          <span>
            {c.feedback.resolved ? 'Consumer marked resolved' : 'Consumer marked unresolved'}
            {c.feedback.rating ? ` · ${c.feedback.rating}/5` : ''}
            {c.feedback.would_deal_again !== null && (
              <span className="ml-1">
                · {c.feedback.would_deal_again ? '👍 Would deal again' : '👎 Would not deal again'}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Inline response form */}
      {respondingTo === c.id && (
        <div className="mt-4 pt-4 border-t hairline-2">
          <CompanyResponseForm
            complaintId={c.id}
            consumerName={c.consumer?.name || ''}
            refNumber={c.reference_number || ''}
            companyName={c.company?.name || user?.company?.name || ''}
            category={c.category || 'other'}
            onSubmitted={(response) => onResponseSubmitted(c.id, response)}
          />
        </div>
      )}
    </li>
  )
}

/* ─── Trust badge snippet ────────────────────────────────── */
function TrustBadge({ slug }) {
  const [copied, setCopied] = useState(false)
  const snippet = `<div id="fairgo-badge"></div>\n<script src="${window.location.origin}/api/badge/${slug}/embed.js"><\/script>`
  const copy = () => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[color:var(--color-eucalyptus-3)] rounded-lg flex items-center justify-center">
            <Icon name="verified" size={14} className="text-[color:var(--color-eucalyptus)]" />
          </div>
          <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">Trust Badge embed</h3>
        </div>
        <Link to="/company/billing" className="text-xs text-[color:var(--color-eucalyptus)] hover:underline">
          Manage plan →
        </Link>
      </div>
      <p className="text-xs text-[color:var(--color-muted)] mb-3">
        Paste this on your website to display your live Aus Fair Go score.
      </p>
      <div className="relative">
        <pre className="bg-[color:var(--color-paper-2)] border hairline rounded-xl p-3 text-xs text-[color:var(--color-ink-2)] overflow-x-auto whitespace-pre-wrap break-all font-mono">
          {snippet}
        </pre>
        <button onClick={copy}
          className="absolute top-2 right-2 btn btn-primary text-xs py-1 px-2.5">
          {copied ? <><Icon name="check" size={11} /> Copied</> : 'Copy'}
        </button>
      </div>
    </div>
  )
}

/* ─── No company prompt ──────────────────────────────────── */
function NoCompanyPrompt() {
  const [claims, setClaims]         = useState([])
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    api.get('/dashboard/consumer')
      .then((r) => setClaims(r.data.claims ?? []))
      .catch(() => {})
  }, [])

  const latestClaim = claims[claims.length - 1] ?? null

  return (
    <div className="max-w-lg mx-auto py-12 px-4">

      {/* Claim status banner — shown when there's a claim history */}
      {latestClaim && (
        <div className={`card p-5 mb-6 border-l-4 ${
          latestClaim.status === 'approved' ? 'border-[color:var(--color-eucalyptus)]' :
          latestClaim.status === 'rejected' ? 'border-[color:var(--color-clay)]' :
          'border-[color:var(--color-ochre)]'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">
              {latestClaim.status === 'approved' ? '✅' : latestClaim.status === 'rejected' ? '❌' : '⏳'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                Claim for {latestClaim.company_name}
              </p>
              {latestClaim.status === 'pending' && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-ink-2)' }}>
                  Your claim is under review. We'll notify you by email once a decision is made.
                </p>
              )}
              {latestClaim.status === 'approved' && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-eucalyptus)' }}>
                  Approved — please refresh the page to access your dashboard.
                </p>
              )}
              {latestClaim.status === 'rejected' && (
                <>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-clay)' }}>
                    Your claim was not approved.
                  </p>
                  {latestClaim.rejection_reason && (
                    <p className="text-xs mt-1.5 px-3 py-2 rounded-lg" style={{ background: 'var(--color-clay-soft)', color: 'var(--color-clay)' }}>
                      <span className="font-semibold">Reason: </span>{latestClaim.rejection_reason}
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                    You can submit a new claim with additional documentation, or contact{' '}
                    <a href="mailto:support@ausfairgo.com.au" className="underline">support@ausfairgo.com.au</a>.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main CTA */}
      <div className="text-center">
        <div className="w-16 h-16 bg-[color:var(--color-eucalyptus-3)] rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Icon name="building" size={28} className="text-[color:var(--color-eucalyptus)]" />
        </div>
        <h2 className="font-display text-2xl font-semibold mb-2">No business linked yet</h2>
        <p className="text-[color:var(--color-muted)] text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Register a new business or claim one already listed in our database.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/companies/register" className="btn btn-primary w-full justify-center text-sm py-3">
            Register a new business
          </Link>
          <Link to="/search" className="btn btn-secondary w-full justify-center text-sm py-3">
            Find &amp; claim your existing company →
          </Link>
        </div>
        <p className="text-xs text-[color:var(--color-muted)] mt-4">
          Already registered? <button onClick={() => window.location.reload()} className="underline hover:text-[color:var(--color-ink)]">Refresh the page</button>
        </p>
      </div>

      {/* Danger zone */}
      <div className="mt-10 card p-5 border border-[color:var(--color-clay)]">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Deactivate account</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Remove your login access and personal contact info.
            </p>
          </div>
          <button onClick={() => setShowDelete(true)}
            className="btn text-xs font-semibold shrink-0 px-4 py-2 rounded-xl"
            style={{ background: 'var(--color-clay-soft)', color: 'var(--color-clay)', border: '1px solid var(--color-clay)' }}>
            Deactivate account
          </button>
        </div>
      </div>

      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} isCompany />}
    </div>
  )
}

/* ─── Skeleton ───────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-pulse">
      <div className="card p-6 h-28" />
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[color:var(--color-paper-2)] rounded-2xl" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-[color:var(--color-paper-2)] rounded-2xl" />)}
    </div>
  )
}
