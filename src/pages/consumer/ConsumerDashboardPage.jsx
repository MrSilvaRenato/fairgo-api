import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import Icon from '../../components/Icon'
import EmailVerifyBanner from '../../components/EmailVerifyBanner'

const STATUS = {
  open:              { label: 'Open',              fg: 'var(--color-eucalyptus)',  bg: 'var(--color-eucalyptus-3)' },
  awaiting_response: { label: 'Awaiting response', fg: '#8A5A1F',                  bg: '#F3E2C3' },
  responded:         { label: 'Responded',          fg: '#3B4B7A',                  bg: '#DAE0EE' },
  resolved:          { label: 'Resolved',           fg: 'var(--color-eucalyptus)',  bg: '#E7EEDF' },
  unresolved:        { label: 'Unresolved',         fg: 'var(--color-clay)',        bg: 'var(--color-clay-soft)' },
  expired:           { label: 'Expired',            fg: 'var(--color-muted)',       bg: 'var(--color-paper-2)' },
}

export default function ConsumerDashboardPage() {
  const { user } = useAuthStore()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  const load = () => {
    api.get('/dashboard/consumer').then((res) => setData(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <Skeleton />
  if (!data)   return null

  const { stats, complaints, claims = [] } = data
  const filtered = filter === 'all' ? complaints : complaints.filter((c) => c.status === filter)

  const needsAction  = complaints.filter((c) => c.status === 'responded').length
  const totalUnread  = stats.unread ?? 0

  const statItems = [
    { label: 'Total',        value: stats.total,      key: 'all' },
    { label: 'Open',         value: stats.open,        key: 'open' },
    { label: 'Responded',    value: stats.responded,   key: 'responded' },
    { label: 'Resolved',     value: stats.resolved,    key: 'resolved' },
    { label: 'Unresolved',   value: stats.unresolved,  key: 'unresolved' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <EmailVerifyBanner />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="caps mb-1">Consumer dashboard</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Hi, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-[color:var(--color-ink-2)] mt-1">
            Track and manage your complaints on the public record.
          </p>
        </div>
        <Link to="/complaints/new" className="btn btn-primary shrink-0">
          <Icon name="plus" size={14} /> New complaint
        </Link>
      </div>

      {/* Unread replies banner */}
      {totalUnread > 0 && (
        <div className="rounded-2xl border border-[color:var(--color-clay)] bg-[color:var(--color-clay-soft)] p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-clay)' }}>
            <Icon name="reply" size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
              {totalUnread} unread repl{totalUnread > 1 ? 'ies' : 'y'} from companies
            </p>
            <p className="text-xs text-[color:var(--color-ink-2)] mt-0.5">
              Open the complaint to read — replies are marked as read automatically.
            </p>
          </div>
        </div>
      )}

      {/* Claim notifications */}
      {claims.map(claim => (
        <ClaimNotification key={claim.id} claim={claim} />
      ))}

      {/* Action banner */}
      {needsAction > 0 && (
        <div className="rounded-2xl border border-[color:var(--color-ochre)] bg-[#FDF6E8] p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[color:var(--color-ochre)] flex items-center justify-center shrink-0">
            <Icon name="flag" size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
              {needsAction} complaint{needsAction > 1 ? 's' : ''} waiting for your verdict
            </p>
            <p className="text-xs text-[color:var(--color-ink-2)] mt-0.5">
              A company has replied — only you can mark it resolved or unresolved.
            </p>
          </div>
          <button onClick={() => setFilter('responded')}
            className="btn btn-secondary shrink-0 text-xs">View</button>
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

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="font-display italic-display text-[24px] mb-2 text-[color:var(--color-muted)]">Nothing here yet.</div>
          <p className="text-sm text-[color:var(--color-muted)] mb-6">
            {filter === 'all' ? 'Had a bad experience? Put it on the public record.' : 'No complaints with this status.'}
          </p>
          {filter === 'all' && (
            <Link to="/complaints/new" className="btn btn-primary">Submit your first complaint</Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <ComplaintRow key={c.id} complaint={c} onReopen={load} />
          ))}
        </ul>
      )}

    </div>
  )
}

/* ─── Complaint row ──────────────────────────────────────── */
function ComplaintRow({ complaint: c, onReopen }) {
  const st = STATUS[c.status] ?? STATUS.open
  const needsClose  = c.status === 'responded'
  const canReopen   = (c.status === 'resolved' || c.status === 'unresolved') && !c.reopened_at
  const unreadCount = c.unread_count ?? 0
  const [reopening, setReopening] = useState(false)

  const handleReopen = async () => {
    setReopening(true)
    try {
      await api.post(`/complaints/${c.id}/reopen`)
      onReopen()
    } catch { /* ignore */ } finally {
      setReopening(false)
    }
  }

  return (
    <li className={`card p-5 transition hover:shadow-md ${needsClose ? 'border-[color:var(--color-ochre)]' : ''} ${unreadCount > 0 ? 'border-l-[3px] border-l-[color:var(--color-clay)]' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">

          {/* Status + category */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ color: st.fg, background: st.bg }}>
              {c.status === 'resolved' && <Icon name="check" size={10} />}
              {st.label}
            </span>
            <span className="text-xs text-[color:var(--color-muted)] capitalize">{c.category}</span>
            {c.moderation_status === 'flagged' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: '#92400e', background: '#fef3c7' }}>
                ⏳ Under review
              </span>
            )}
            {c.status === 'removed' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                🚫 Removed
              </span>
            )}
            {c.is_public && c.moderation_status !== 'flagged' && c.status !== 'removed' && (
              <span className="text-xs text-[color:var(--color-muted)] flex items-center gap-1">
                <Icon name="globe" size={10} /> Public
              </span>
            )}
          </div>

          {/* Title + unread badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <Link to={`/complaints/${c.id}`}
              className="font-semibold text-[color:var(--color-ink)] hover:text-[color:var(--color-eucalyptus)] transition leading-snug">
              {c.title}
            </Link>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: 'var(--color-clay)', color: 'var(--color-paper)' }}>
                {unreadCount} new repl{unreadCount > 1 ? 'ies' : 'y'}
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-muted)]">
            <Link to={`/companies/${c.company?.slug}`}
              className="font-medium text-[color:var(--color-ink-2)] hover:text-[color:var(--color-eucalyptus)] transition flex items-center gap-1">
              <Icon name="building" size={11} /> {c.company?.name}
            </Link>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Icon name="calendar" size={11} />
              {new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {needsClose && (
            <Link to={`/complaints/${c.id}/resolve`}
              className="btn btn-primary text-xs">
              Close it <Icon name="arrow-r" size={12} />
            </Link>
          )}
          {canReopen && (
            <button onClick={handleReopen} disabled={reopening}
              className="btn btn-secondary text-xs">
              {reopening ? 'Reopening…' : 'Re-open'}
            </button>
          )}
        </div>
      </div>

      {/* Company response preview */}
      {c.response && (
        <div className="mt-4 pt-4 border-t hairline-2 flex items-start gap-2.5">
          <div className="w-6 h-6 bg-[color:var(--color-eucalyptus-3)] rounded-lg flex items-center justify-center shrink-0">
            <Icon name="reply" size={12} className="text-[color:var(--color-eucalyptus)]" />
          </div>
          <p className="text-xs text-[color:var(--color-ink-2)] line-clamp-2 flex-1">
            <span className="font-medium text-[color:var(--color-ink)]">Company replied: </span>
            {c.response.content}
          </p>
        </div>
      )}

      {/* Feedback summary */}
      {c.feedback && (
        <div className="mt-3 pt-3 border-t hairline-2 flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
          <Icon name={c.feedback.resolved ? 'check' : 'x'} size={13}
            className={c.feedback.resolved ? 'text-[color:var(--color-eucalyptus)]' : 'text-[color:var(--color-clay)]'} />
          <span>
            {c.feedback.resolved ? 'You marked this resolved' : 'You marked this unresolved'}
            {c.feedback.rating ? ` · ${c.feedback.rating}/5` : ''}
          </span>
          {c.reopened_at && ['open', 'awaiting_response', 'responded'].includes(c.status) && (
            <span className="ml-2 text-[color:var(--color-ochre)] font-medium flex items-center gap-1">
              <Icon name="arrow-up" size={11} /> Re-opened
            </span>
          )}
        </div>
      )}
    </li>
  )
}

/* ─── Claim notification ─────────────────────────────────── */
function ClaimNotification({ claim }) {
  const cfg = {
    pending:  { icon: '⏳', label: 'Under review',  border: 'var(--color-ochre)',      bg: '#FDF6E8', fg: '#8A5A1F' },
    approved: { icon: '✅', label: 'Approved',       border: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)', fg: 'var(--color-eucalyptus)' },
    rejected: { icon: '❌', label: 'Not approved',   border: 'var(--color-clay)',       bg: 'var(--color-clay-soft)',    fg: 'var(--color-clay)' },
  }[claim.status] ?? {}

  return (
    <div className="rounded-2xl border p-4 flex items-start gap-4"
      style={{ borderColor: cfg.border, background: cfg.bg }}>
      <span className="text-2xl mt-0.5 shrink-0">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold text-[color:var(--color-ink)]">
            Company claim — {claim.company_name}
          </p>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: cfg.fg, background: 'white', border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
        </div>

        {claim.status === 'pending' && (
          <p className="text-xs text-[color:var(--color-ink-2)]">
            Your claim is being reviewed. We'll update you here once a decision is made.
          </p>
        )}
        {claim.status === 'approved' && (
          <p className="text-xs text-[color:var(--color-ink-2)]">
            Your claim was approved! You now have access to the company dashboard.
          </p>
        )}
        {claim.status === 'rejected' && (
          <p className="text-xs text-[color:var(--color-ink-2)]">
            Your claim was not approved.
            {claim.rejection_reason && <span className="ml-1">Reason: <em>{claim.rejection_reason}</em></span>}
          </p>
        )}
      </div>

      {claim.status === 'approved' && (
        <Link to="/company/dashboard" className="btn btn-secondary shrink-0 text-xs">
          Go to dashboard →
        </Link>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="h-9 bg-[color:var(--color-paper-2)] rounded w-1/3" />
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[color:var(--color-paper-2)] rounded-2xl" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-[color:var(--color-paper-2)] rounded-2xl" />)}
    </div>
  )
}

