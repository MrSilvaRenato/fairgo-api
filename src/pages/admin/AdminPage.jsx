import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import CompanyLogo from '../../components/CompanyLogo'
import Icon from '../../components/Icon'

/* ─── Status map ─────────────────────────────────────────── */
const STATUS = {
  open:              { label: 'Open',              fg: 'var(--color-eucalyptus)',  bg: 'var(--color-eucalyptus-3)' },
  awaiting_response: { label: 'Awaiting',          fg: '#8A5A1F',                  bg: '#F3E2C3' },
  responded:         { label: 'Responded',          fg: '#3B4B7A',                  bg: '#DAE0EE' },
  resolved:          { label: 'Resolved',           fg: 'var(--color-eucalyptus)',  bg: '#E7EEDF' },
  unresolved:        { label: 'Unresolved',         fg: 'var(--color-clay)',        bg: 'var(--color-clay-soft)' },
  removed:           { label: 'Removed',            fg: 'var(--color-muted)',       bg: 'var(--color-paper-2)' },
  expired:           { label: 'Expired',            fg: 'var(--color-muted)',       bg: 'var(--color-paper-2)' },
}

const MOD_STATUS = {
  pending:  { label: 'Pending',  fg: '#8A5A1F',                  bg: '#F3E2C3' },
  approved: { label: 'Approved', fg: 'var(--color-eucalyptus)',  bg: 'var(--color-eucalyptus-3)' },
  edited:   { label: 'Edited',   fg: '#3B4B7A',                  bg: '#DAE0EE' },
  flagged:  { label: 'Flagged',  fg: 'var(--color-clay)',        bg: 'var(--color-clay-soft)' },
  rejected: { label: 'Rejected', fg: 'var(--color-clay)',        bg: 'var(--color-clay-soft)' },
}

const FLAG_LABELS = {
  profanity:         '🤬 Profanity',
  defamation:        '⚖️ Defamation',
  personal_info:     '🔒 Personal info',
  threat:            '⚠️ Threat',
  spam:              '🗑 Spam',
  competitor_attack: '🎭 Competitor attack',
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function AdminPage() {
  const [tab, setTab]           = useState('complaints')
  const [stats, setStats]       = useState(null)
  const [complaints, setComplaints] = useState([])
  const [companies, setCompanies]   = useState([])
  const [users, setUsers]           = useState([])
  const [moderation, setModeration] = useState([])
  const [q, setQ]               = useState('')
  const [loading, setLoading]   = useState(false)
  const [companyFilter, setCompanyFilter] = useState('all')
  const [modFilter, setModFilter]         = useState('flagged')
  const [expandedMod, setExpandedMod]     = useState(null)

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data))
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    if (tab === 'moderation') {
      api.get('/admin/moderation', { params: { status: modFilter, ...(q ? { q } : {}) } })
        .then((r) => setModeration(r.data.data))
        .finally(() => setLoading(false))
      return
    }
    const map = { complaints: '/admin/complaints', companies: '/admin/companies', users: '/admin/users' }
    const params = { ...(q ? { q } : {}), ...(tab === 'companies' && companyFilter !== 'all' ? { filter: companyFilter } : {}) }
    api.get(map[tab], { params })
      .then((r) => {
        if (tab === 'complaints') setComplaints(r.data.data)
        if (tab === 'companies')  setCompanies(r.data.data)
        if (tab === 'users')      setUsers(r.data.data)
      })
      .finally(() => setLoading(false))
  }, [tab, q, companyFilter, modFilter])

  useEffect(() => { load() }, [load])

  /* Complaint actions */
  const updateComplaint = async (id, data) => {
    await api.put(`/admin/complaints/${id}`, data)
    setComplaints((p) => p.map((c) => c.id === id ? { ...c, ...data } : c))
  }

  /* Moderation actions */
  const moderationDecision = async (id, action, note = '') => {
    const res = await api.put(`/admin/moderation/${id}`, { action, note })
    setModeration((p) => p.filter((c) => c.id !== id))
    setExpandedMod(null)
    // refresh stats
    api.get('/admin/stats').then((r) => setStats(r.data))
  }

  /* Company actions */
  const updateCompany = async (id, data) => {
    const res = await api.put(`/admin/companies/${id}`, data)
    setCompanies((p) => p.map((c) => c.id === id ? { ...c, ...res.data } : c))
  }

  /* User actions */
  const updateUser = async (id, data) => {
    const res = await api.put(`/admin/users/${id}`, data)
    setUsers((p) => p.map((u) => u.id === id ? { ...u, ...res.data } : u))
  }

  const TABS = ['complaints', 'moderation', 'companies', 'users']

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-[color:var(--color-muted)] mt-0.5">Moderate content and manage the platform</p>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Users',       value: stats.total_users },
            { label: 'Companies',   value: stats.total_companies },
            { label: 'Complaints',  value: stats.total_complaints },
            { label: 'Open',        value: stats.open_complaints,        accent: stats.open_complaints > 0 },
            { label: 'Resolved',    value: stats.resolved,               green: true },
            { label: '🤖 Flagged',  value: stats.moderation_flagged,     accent: stats.moderation_flagged > 0 },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className={`font-display text-[28px] font-semibold leading-none ${
                s.green ? 'text-[color:var(--color-eucalyptus)]' : s.accent ? 'text-[color:var(--color-ochre)]' : 'text-[color:var(--color-ink)]'
              }`}>{s.value}</p>
              <p className="text-xs text-[color:var(--color-muted)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="card p-1 flex gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setQ('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition ${
              tab === t
                ? 'bg-[color:var(--color-eucalyptus)] text-[color:var(--color-paper)] shadow-sm'
                : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]'
            }`}>
            {t === 'moderation' && stats?.moderation_flagged > 0
              ? `Moderation (${stats.moderation_flagged})`
              : t.charAt(0).toUpperCase() + t.slice(1)
            }
          </button>
        ))}
      </div>

      {/* Search + sub-filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="input pl-9 text-sm w-full"
          />
        </div>
        {tab === 'companies' && (
          <div className="flex gap-1.5">
            {['all', 'verified', 'flagged'].map((f) => (
              <button key={f} onClick={() => setCompanyFilter(f)}
                className={`chip capitalize ${companyFilter === f ? 'chip-active' : ''}`}>
                {f}
              </button>
            ))}
          </div>
        )}
        {tab === 'moderation' && (
          <div className="flex gap-1.5">
            {['flagged', 'pending', 'edited', 'rejected'].map((f) => (
              <button key={f} onClick={() => setModFilter(f)}
                className={`chip capitalize ${modFilter === f ? 'chip-active' : ''}`}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[color:var(--color-paper-2)] rounded-2xl" />)}
        </div>
      )}

      {/* ── Complaints tab ── */}
      {tab === 'complaints' && !loading && (
        <div className="card overflow-hidden">
          {complaints.length === 0 && (
            <p className="p-10 text-sm text-[color:var(--color-muted)] text-center">No complaints found.</p>
          )}
          <ul className="divide-y divide-[color:var(--color-border)]">
            {complaints.map((c) => {
              const st  = STATUS[c.status] ?? STATUS.open
              const mst = MOD_STATUS[c.moderation_status]
              return (
                <li key={c.id} className={`p-4 flex items-start gap-3 hover:bg-[color:var(--color-paper-2)] transition ${
                  c.status === 'removed' ? 'opacity-50' : ''
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ color: st.fg, background: st.bg }}>
                        {st.label}
                      </span>
                      {mst && c.moderation_status !== 'approved' && (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ color: mst.fg, background: mst.bg }}>
                          🤖 {mst.label}
                        </span>
                      )}
                      <span className="text-xs text-[color:var(--color-muted)] capitalize">{c.category}</span>
                      {!c.is_public && (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ color: 'var(--color-muted)', background: 'var(--color-paper-2)' }}>
                          Private
                        </span>
                      )}
                    </div>
                    <Link to={`/complaints/${c.id}`}
                      className="text-sm font-semibold text-[color:var(--color-ink)] hover:text-[color:var(--color-eucalyptus)] transition line-clamp-1">
                      {c.title || c.description?.slice(0, 80)}
                    </Link>
                    <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                      <span className="font-medium text-[color:var(--color-ink-2)]">{c.consumer?.name}</span>
                      {' → '}
                      <span className="font-medium text-[color:var(--color-ink-2)]">{c.company?.name}</span>
                      {' · '}
                      {new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.status !== 'removed' ? (
                      <button onClick={() => updateComplaint(c.id, { status: 'removed', is_public: false })}
                        className="text-xs text-[color:var(--color-clay)] hover:bg-[color:var(--color-clay-soft)] px-2.5 py-1.5 rounded-xl transition font-medium">
                        Remove
                      </button>
                    ) : (
                      <button onClick={() => updateComplaint(c.id, { status: 'open', is_public: true })}
                        className="text-xs text-[color:var(--color-eucalyptus)] hover:bg-[color:var(--color-eucalyptus-3)] px-2.5 py-1.5 rounded-xl transition font-medium">
                        Restore
                      </button>
                    )}
                    <Link to={`/complaints/${c.id}`}
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

      {/* ── Moderation tab ── */}
      {tab === 'moderation' && !loading && (
        <div className="space-y-3">
          {moderation.length === 0 && (
            <div className="card p-10 text-sm text-[color:var(--color-muted)] text-center">
              <p className="text-3xl mb-3">✅</p>
              <p>No complaints with status <strong>{modFilter}</strong>.</p>
            </div>
          )}
          {moderation.map((c) => {
            const isExpanded = expandedMod === c.id
            const mst = MOD_STATUS[c.moderation_status] ?? MOD_STATUS.pending
            return (
              <div key={c.id} className="card overflow-hidden">
                {/* Summary row */}
                <div
                  className="p-4 flex items-start gap-3 cursor-pointer hover:bg-[color:var(--color-paper-2)] transition"
                  onClick={() => setExpandedMod(isExpanded ? null : c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ color: mst.fg, background: mst.bg }}>
                        🤖 {mst.label}
                      </span>
                      {(c.moderation_flags ?? []).map((f) => (
                        <span key={f} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                          {FLAG_LABELS[f] ?? f}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-[color:var(--color-ink)] line-clamp-1">{c.title}</p>
                    <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                      <span className="font-medium text-[color:var(--color-ink-2)]">{c.consumer?.name}</span>
                      {' → '}
                      <span className="font-medium text-[color:var(--color-ink-2)]">{c.company?.name}</span>
                      {' · '}
                      {new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {c.moderation_note && (
                      <p className="text-[11px] mt-1 text-[color:var(--color-ochre)] italic">
                        AI: "{c.moderation_note}"
                      </p>
                    )}
                  </div>
                  <Icon name="chevron-d" size={14}
                    className={`shrink-0 mt-1 text-[color:var(--color-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Expanded review panel */}
                {isExpanded && (
                  <div className="border-t hairline-2 p-4 space-y-4"
                    style={{ background: 'var(--color-paper-2)' }}>

                    {/* Content */}
                    <div className="space-y-3">
                      <div>
                        <p className="caps text-[color:var(--color-muted)] mb-1">Complaint title</p>
                        <p className="text-sm text-[color:var(--color-ink)]">{c.title}</p>
                      </div>
                      <div>
                        <p className="caps text-[color:var(--color-muted)] mb-1">Description</p>
                        <p className="text-sm text-[color:var(--color-ink-2)] whitespace-pre-wrap leading-relaxed">{c.description}</p>
                      </div>
                      {c.expected_resolution && (
                        <div>
                          <p className="caps text-[color:var(--color-muted)] mb-1">Expected resolution</p>
                          <p className="text-sm text-[color:var(--color-ink-2)]">{c.expected_resolution}</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        onClick={() => moderationDecision(c.id, 'approved')}
                        className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition"
                        style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
                        ✅ Approve & publish
                      </button>
                      <button
                        onClick={() => moderationDecision(c.id, 'rejected')}
                        className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition"
                        style={{ background: 'var(--color-clay-soft)', color: 'var(--color-clay)' }}>
                        ❌ Reject & hide
                      </button>
                      <Link to={`/complaints/${c.id}`} target="_blank"
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper)]">
                        <Icon name="arrow-r" size={13} /> View
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Companies tab ── */}
      {tab === 'companies' && !loading && (
        <div className="card overflow-hidden">
          {companies.length === 0 && (
            <p className="p-10 text-sm text-[color:var(--color-muted)] text-center">No companies found.</p>
          )}
          <ul className="divide-y divide-[color:var(--color-border)]">
            {companies.map((c) => (
              <li key={c.id} className="p-4 flex items-center gap-3 hover:bg-[color:var(--color-paper-2)] transition">
                <CompanyLogo company={c} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/companies/${c.slug}`}
                      className="text-sm font-semibold text-[color:var(--color-ink)] hover:text-[color:var(--color-eucalyptus)] transition">
                      {c.name}
                    </Link>
                    {c.verified_badge && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)' }}>
                        <Icon name="verified" size={10} /> Verified
                      </span>
                    )}
                    {c.not_recommended && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                        ⚠ Not Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                    {c.user?.email}
                    {' · '}
                    <span className="capitalize">{c.subscription?.plan ?? 'free'} plan</span>
                    {' · '}
                    {c.complaints_count ?? 0} complaint{c.complaints_count !== 1 ? 's' : ''}
                    {c.score && (
                      <span className="font-semibold text-[color:var(--color-ink-2)] ml-1">
                        · Score {Math.round(c.score.score)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateCompany(c.id, { verified_badge: !c.verified_badge })}
                    title={c.verified_badge ? 'Remove verified badge' : 'Grant verified badge'}
                    className={`p-1.5 rounded-lg transition ${
                      c.verified_badge
                        ? 'text-[color:var(--color-eucalyptus)] bg-[color:var(--color-eucalyptus-3)]'
                        : 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-paper-2)]'
                    }`}>
                    <Icon name="verified" size={16} />
                  </button>
                  <button
                    onClick={() => updateCompany(c.id, { not_recommended: !c.not_recommended })}
                    title={c.not_recommended ? 'Remove flag' : 'Flag as not recommended'}
                    className={`p-1.5 rounded-lg transition text-sm leading-none ${
                      c.not_recommended
                        ? 'text-[color:var(--color-clay)] bg-[color:var(--color-clay-soft)]'
                        : 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-paper-2)]'
                    }`}>
                    ⚠
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Users tab ── */}
      {tab === 'users' && !loading && (
        <div className="card overflow-hidden">
          {users.length === 0 && (
            <p className="p-10 text-sm text-[color:var(--color-muted)] text-center">No users found.</p>
          )}
          <ul className="divide-y divide-[color:var(--color-border)]">
            {users.map((u) => (
              <li key={u.id} className={`p-4 flex items-center gap-3 hover:bg-[color:var(--color-paper-2)] transition ${
                u.banned ? 'opacity-50' : ''
              }`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[color:var(--color-ink)]">{u.name}</span>
                    <RoleBadge role={u.role} />
                    {u.reputation_flag === 'serial_complainer' && (
                      <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                        ⚠ Serial complainer
                      </span>
                    )}
                    {u.reputation_flag === 'verified_consumer' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ color: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)' }}>
                        <Icon name="verified" size={10} /> Trusted consumer
                      </span>
                    )}
                    {u.banned && (
                      <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                        Banned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                    {u.email}
                    {u.company && <span className="ml-1">· {u.company.name}</span>}
                    {u.complaints_count > 0 && (
                      <span className="ml-1">· {u.complaints_count} complaint{u.complaints_count !== 1 ? 's' : ''}</span>
                    )}
                    {u.reputation_score != null && u.role === 'consumer' && (
                      <span className="ml-1">· Rep: {u.reputation_score}/100</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => updateUser(u.id, { banned: !u.banned })}
                      className={`text-xs px-2.5 py-1.5 rounded-xl transition font-medium ${
                        u.banned
                          ? 'text-[color:var(--color-eucalyptus)] hover:bg-[color:var(--color-eucalyptus-3)]'
                          : 'text-[color:var(--color-clay)] hover:bg-[color:var(--color-clay-soft)]'
                      }`}>
                      {u.banned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Unresolved',          value: stats.unresolved,          accent: 'clay' },
            { label: 'Removed complaints',  value: stats.removed,             accent: 'muted' },
            { label: 'Verified companies',  value: stats.verified_companies,  accent: 'eucalyptus' },
            { label: 'Flagged companies',   value: stats.flagged_companies,   accent: 'clay' },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className={`font-display text-[24px] font-semibold leading-none text-[color:var(--color-${s.accent})]`}>
                {s.value}
              </p>
              <p className="text-xs text-[color:var(--color-muted)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Role badge ─────────────────────────────────────────── */
function RoleBadge({ role }) {
  const map = {
    admin:         { fg: 'var(--color-clay)',        bg: 'var(--color-clay-soft)',     label: 'Admin' },
    company_admin: { fg: '#3B4B7A',                  bg: '#DAE0EE',                    label: 'Company' },
    consumer:      { fg: 'var(--color-muted)',        bg: 'var(--color-paper-2)',       label: 'Consumer' },
  }
  const s = map[role] ?? map.consumer
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
      style={{ color: s.fg, background: s.bg }}>
      {s.label}
    </span>
  )
}
