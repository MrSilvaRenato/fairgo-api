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
  const [stubs, setStubs]           = useState([])
  const [claims, setClaims]         = useState([])
  const [claimFilter, setClaimFilter] = useState('pending')
  const [users, setUsers]           = useState([])
  const [moderation, setModeration] = useState([])
  const [q, setQ]               = useState('')
  const [loading, setLoading]   = useState(false)
  const [companyFilter, setCompanyFilter] = useState('all')
  const [companySort,   setCompanySort]   = useState('latest')
  const [companiesPage, setCompaniesPage] = useState(1)
  const [companiesMeta, setCompaniesMeta] = useState(null)
  const [modFilter, setModFilter]         = useState('flagged')
  const [idVerifications, setIdVerifications] = useState([])
  const [idFilter, setIdFilter]               = useState('pending')
  const [expandedMod, setExpandedMod]     = useState(null)
  const [renamingStub, setRenamingStub]   = useState(null)
  const [renameValue, setRenameValue]     = useState('')
  const [deleteTarget, setDeleteTarget]   = useState(null) // { id, name, complaintsCount }

  // Complaints-tab filters
  const [cStatus,   setCStatus]   = useState('')
  const [cCategory, setCCategory] = useState('')
  const [cModStatus,setCModStatus]= useState('')
  const [cSort,     setCSort]     = useState('latest')
  const [cPage,     setCPage]     = useState(1)
  const [cMeta,     setCMeta]     = useState(null)
  const [cSearchTimer, setCSearchTimer] = useState(null)
  const [adminCounts, setAdminCounts] = useState({ category: {}, status: {} })

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data))
  }, [])

  // Refresh counts when complaints tab filters change
  useEffect(() => {
    if (tab !== 'complaints') return
    api.get('/admin/complaints/category-counts', {
      params: {
        ...(cStatus    ? { status: cStatus }               : {}),
        ...(cModStatus ? { moderation_status: cModStatus } : {}),
        ...(cCategory  ? { category: cCategory }           : {}),
      },
    })
      .then(r => setAdminCounts({ category: r.data?.category ?? {}, status: r.data?.status ?? {} }))
      .catch(() => {})
  }, [tab, cStatus, cModStatus, cCategory])

  const load = useCallback(() => {
    setLoading(true)
    if (tab === 'moderation') {
      api.get('/admin/moderation', { params: { status: modFilter, ...(q ? { q } : {}) } })
        .then((r) => setModeration(r.data.data))
        .finally(() => setLoading(false))
      return
    }
    if (tab === 'unregistered') {
      api.get('/admin/stub-companies', { params: q ? { q } : {} })
        .then((r) => setStubs(r.data.data))
        .finally(() => setLoading(false))
      return
    }
    if (tab === 'claims') {
      api.get('/admin/claims', { params: { status: claimFilter } })
        .then((r) => setClaims(r.data.data))
        .finally(() => setLoading(false))
      return
    }
    if (tab === 'companies') {
      const params = {
        ...(q ? { q } : {}),
        ...(companyFilter !== 'all' ? { filter: companyFilter } : {}),
        ...(companySort !== 'latest' ? { sort: companySort } : {}),
        page: companiesPage,
      }
      api.get('/admin/companies', { params })
        .then((r) => {
          setCompanies(r.data.data)
          setCompaniesMeta({ total: r.data.total, last_page: r.data.last_page, current_page: r.data.current_page })
        })
        .finally(() => setLoading(false))
      return
    }

    if (tab === 'users') {
      api.get('/admin/users', { params: q ? { q } : {} })
        .then((r) => setUsers(r.data.data))
        .finally(() => setLoading(false))
      return
    }

    if (tab === 'id-verifications') {
      api.get('/admin/id-verifications', { params: { status: idFilter } })
        .then((r) => setIdVerifications(r.data.data))
        .finally(() => setLoading(false))
      return
    }

    // complaints
    api.get('/admin/complaints', {
      params: {
        ...(q          ? { q }                         : {}),
        ...(cStatus    ? { status: cStatus }           : {}),
        ...(cCategory  ? { category: cCategory }       : {}),
        ...(cModStatus ? { moderation_status: cModStatus } : {}),
        sort: cSort,
        page: cPage,
        per_page: 25,
      },
    })
      .then((r) => {
        setComplaints(r.data.data)
        setCMeta({ total: r.data.total, last_page: r.data.last_page, current_page: r.data.current_page })
      })
      .finally(() => setLoading(false))
  }, [tab, q, companyFilter, companySort, companiesPage, modFilter, claimFilter, idFilter, cStatus, cCategory, cModStatus, cSort, cPage])

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

  /* Claim actions */
  const approveClaim = async (id) => {
    await api.post(`/admin/claims/${id}/approve`)
    setClaims((p) => p.filter((c) => c.id !== id))
    api.get('/admin/stats').then((r) => setStats(r.data))
  }
  const rejectClaim = async (id, reason) => {
    await api.post(`/admin/claims/${id}/reject`, { rejection_reason: reason })
    setClaims((p) => p.filter((c) => c.id !== id))
    api.get('/admin/stats').then((r) => setStats(r.data))
  }

  /* Promote stub company to registered */
  const promoteStub = async (id) => {
    await api.post(`/admin/stub-companies/${id}/promote`)
    setStubs((p) => p.filter((c) => c.id !== id))
    api.get('/admin/stats').then((r) => setStats(r.data))
  }
    
const rejectStub = async (id) => {
  const note = window.prompt(
    'Reason for rejecting this company/complaint?',
    'Invalid company or ABN mismatch.'
  )

  if (note === null) return

  await api.post(`/admin/stub-companies/${id}/reject`, { note })
  setStubs((p) => p.filter((c) => c.id !== id))
  api.get('/admin/stats').then((r) => setStats(r.data))
}
  /* Rename stub company */
  const saveRenameStub = async (id) => {
    const name = renameValue.trim()
    if (!name) return
    const res = await api.put(`/admin/companies/${id}`, { name, abn_entity_name: name })
    setStubs((p) => p.map((c) => c.id === id ? { ...c, name: res.data.name, abn_entity_name: res.data.abn_entity_name } : c))
    setRenamingStub(null)
    setRenameValue('')
  }

  /* Delete company */
  const handleDeleteConfirm = async (deleteComplaints) => {
    if (!deleteTarget) return
    const { id } = deleteTarget
    setDeleteTarget(null)
    await api.delete(`/admin/companies/${id}`, { params: { delete_complaints: deleteComplaints } })
    setCompanies((p) => p.filter((c) => c.id !== id))
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

  /* ID verification actions */
  const approveId = async (userId) => {
    await api.post(`/admin/id-verifications/${userId}/approve`)
    setIdVerifications((p) => p.filter((u) => u.id !== userId))
    api.get('/admin/stats').then((r) => setStats(r.data))
  }
  const rejectId = async (userId, note) => {
    await api.post(`/admin/id-verifications/${userId}/reject`, { note })
    setIdVerifications((p) => p.filter((u) => u.id !== userId))
    api.get('/admin/stats').then((r) => setStats(r.data))
  }

  const TABS = ['complaints', 'moderation', 'companies', 'unregistered', 'claims', 'users', 'id-verifications']

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-[color:var(--color-muted)] mt-0.5">Moderate content and manage the platform</p>
      </div>


      {/* Unregistered companies alert banner */}
      {stats?.stub_companies > 0 && (
        <div className="rounded-2xl border border-[color:var(--color-ochre)] bg-[#FDF6E8] p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[color:var(--color-ochre)] flex items-center justify-center shrink-0 text-lg">
            🏢
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
              {stats.stub_companies} unregistered compan{stats.stub_companies === 1 ? 'y' : 'ies'} need to be added to the database
            </p>
            <p className="text-xs text-[color:var(--color-ink-2)] mt-0.5">
              Consumers filed complaints against companies not yet in Aus Fair Go. Review their ABN and register them.
            </p>
          </div>
          <button onClick={() => setTab('unregistered')}
            className="btn btn-secondary shrink-0 text-xs">
            Review
          </button>
        </div>
      )}

      {/* Tabs + inline stats */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Clickable nav tabs */}
        {TABS.map((t) => {
          const active = tab === t
          const { count, urgent } = {
            complaints:          { count: stats?.total_complaints,           urgent: false },
            moderation:          { count: stats?.moderation_flagged,         urgent: (stats?.moderation_flagged ?? 0) > 0 },
            companies:           { count: stats?.total_companies,            urgent: false },
            unregistered:        { count: stats?.stub_companies,             urgent: (stats?.stub_companies ?? 0) > 0 },
            claims:              { count: stats?.pending_claims,             urgent: (stats?.pending_claims ?? 0) > 0 },
            users:               { count: stats?.total_users,                urgent: false },
            'id-verifications':  { count: stats?.pending_id_verifications,   urgent: (stats?.pending_id_verifications ?? 0) > 0 },
          }[t] ?? { count: null, urgent: false }

          const label =
            t === 'moderation'         ? 'Moderation'
            : t === 'unregistered'     ? 'Unregistered'
            : t === 'id-verifications' ? 'ID Verify'
            : t.charAt(0).toUpperCase() + t.slice(1)

          return (
            <button key={t}
              onClick={() => { setTab(t); setQ(''); setCStatus(''); setCCategory(''); setCModStatus(''); setCSort('latest'); setCPage(1) }}
              className={`inline-flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-full border transition ${
                active
                  ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                  : 'border-[color:var(--color-line)] text-[color:var(--color-ink-2)] hover:border-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]'
              }`}>
              {label}
              {count != null && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none ${
                  active
                    ? 'bg-white/20 text-white'
                    : urgent
                      ? 'bg-[color:var(--color-clay)]/15 text-[color:var(--color-clay)]'
                      : 'bg-[color:var(--color-ink)]/10 text-[color:var(--color-ink)]'
                }`}>{count}</span>
              )}
            </button>
          )
        })}

        {/* Divider */}
        {stats && <span className="w-px h-5 bg-[color:var(--color-line)] mx-1" />}

        {/* Read-only stat pills — Open, Resolved, Flagged */}
        {stats && [
          { label: 'Open',     value: stats.open_complaints, color: '#8A5A1F',                  bg: '#F3E2C3' },
          { label: 'Resolved', value: stats.resolved,        color: 'var(--color-eucalyptus)',   bg: 'var(--color-eucalyptus-3)' },
          { label: 'Flagged',  value: stats.moderation_flagged, color: 'var(--color-clay)',      bg: 'var(--color-clay-soft)' },
        ].map(s => (
          <span key={s.label}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background: s.bg, color: s.color }}>
            {s.label}
            <span className="text-[10px] font-mono font-bold">{s.value}</span>
          </span>
        ))}
      </div>

      {/* ── Complaints filter panel ────────────────────────── */}
      {tab === 'complaints' && (
        <div className="card p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] pointer-events-none" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setCPage(1) }}
              placeholder="Search title, description, company, consumer…"
              className="input pl-9 text-sm w-full"
            />
            {q && (
              <button onClick={() => { setQ(''); setCPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition">
                <Icon name="x" size={13} />
              </button>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="caps text-[10px] text-[color:var(--color-muted)] mb-2">Status</p>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { value: '',                  label: 'All',        dot: null },
                { value: 'open',              label: 'Open',       dot: 'var(--color-eucalyptus)' },
                { value: 'responded',         label: 'Responded',  dot: '#5A6FA8' },
                { value: 'resolved',          label: 'Resolved',   dot: '#3E7560' },
                { value: 'unresolved',        label: 'Unresolved', dot: 'var(--color-clay)' },
                { value: 'awaiting_response', label: 'Awaiting',   dot: '#D8A24A' },
                { value: 'expired',           label: 'Expired',    dot: 'var(--color-muted)' },
                { value: 'removed',           label: 'Removed',    dot: '#aaa' },
              ].map(opt => {
                const count = opt.value
                  ? (adminCounts.status[opt.value] ?? 0)
                  : Object.values(adminCounts.status).reduce((a, b) => a + b, 0)
                const active = cStatus === opt.value
                return (
                  <button key={opt.value}
                    onClick={() => { setCStatus(opt.value); setCPage(1) }}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border transition ${
                      active
                        ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                        : 'border-[color:var(--color-line)] bg-[color:var(--color-card)] text-[color:var(--color-ink-2)] hover:border-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]'
                    }`}>
                    {opt.dot && <span className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: active ? 'var(--color-paper)' : opt.dot }} />}
                    {opt.label}
                    {count > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-[color:var(--color-ink)]/10 text-[color:var(--color-ink)]'
                      }`}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Category + Moderation status — side by side on md+ */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="caps text-[10px] text-[color:var(--color-muted)] mb-2">Category</p>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: '',          label: 'All',      emoji: null  },
                  { value: 'billing',   label: 'Billing',  emoji: '💳' },
                  { value: 'delivery',  label: 'Delivery', emoji: '📦' },
                  { value: 'service',   label: 'Service',  emoji: '🎧' },
                  { value: 'refund',    label: 'Refund',   emoji: '↩️' },
                  { value: 'fraud',     label: 'Fraud',    emoji: '⚠️' },
                ].map(opt => {
                  const count = opt.value
                    ? (adminCounts.category[opt.value] ?? 0)
                    : Object.values(adminCounts.category).reduce((a, b) => a + b, 0)
                  const active = cCategory === opt.value
                  return (
                    <button key={opt.value}
                      onClick={() => { setCCategory(opt.value); setCPage(1) }}
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-full border transition ${
                        active
                          ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                          : 'border-[color:var(--color-line)] bg-transparent text-[color:var(--color-ink-2)] hover:border-[color:var(--color-ink-2)]'
                      }`}>
                      {opt.emoji && <span className="text-[10px]">{opt.emoji}</span>}
                      {opt.label}
                      {count > 0 && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-[color:var(--color-ink)]/10 text-[color:var(--color-ink)]'
                        }`}>{count}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="caps text-[10px] text-[color:var(--color-muted)] mb-2">Moderation</p>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: '',          label: 'All' },
                  { value: 'pending',   label: '🕐 Pending',  fg: '#8A5A1F',                 bg: '#F3E2C3' },
                  { value: 'approved',  label: '✅ Approved', fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)' },
                  { value: 'flagged',   label: '🚩 Flagged',  fg: 'var(--color-clay)',       bg: 'var(--color-clay-soft)' },
                  { value: 'rejected',  label: '❌ Rejected', fg: 'var(--color-clay)',       bg: 'var(--color-clay-soft)' },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => { setCModStatus(opt.value); setCPage(1) }}
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-full border transition ${
                      cModStatus === opt.value
                        ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                        : 'border-[color:var(--color-line)] bg-transparent text-[color:var(--color-ink-2)] hover:border-[color:var(--color-ink-2)]'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sort + active summary row */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t hairline flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="caps text-[10px] text-[color:var(--color-muted)]">Sort:</span>
              {[['latest', 'Newest'], ['oldest', 'Oldest']].map(([v, l]) => (
                <button key={v} onClick={() => { setCSort(v); setCPage(1) }}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition ${
                    cSort === v
                      ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                      : 'border-[color:var(--color-line)] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]'
                  }`}>{l}</button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {cMeta?.total > 0 && (
                <span className="text-[11px] text-[color:var(--color-muted)] font-mono">
                  {cMeta.total.toLocaleString()} result{cMeta.total !== 1 ? 's' : ''}
                </span>
              )}
              {(q || cStatus || cCategory || cModStatus) && (
                <button
                  onClick={() => { setQ(''); setCStatus(''); setCCategory(''); setCModStatus(''); setCSort('latest'); setCPage(1) }}
                  className="text-[11px] text-[color:var(--color-clay)] hover:underline font-medium transition">
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search + sub-filters for other tabs */}
      <div className={`flex flex-col gap-2 ${tab === 'complaints' ? 'hidden' : ''}`}>
        <div className="relative w-full">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]" />
          <input
            value={q} onChange={(e) => { setQ(e.target.value); setCompaniesPage(1) }}
            placeholder={`Search ${tab}…`}
            className="input pl-9 text-sm w-full"
          />
        </div>
        {tab === 'companies' && (
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <div className="flex gap-1.5 min-w-max">
              {['all', 'verified', 'flagged'].map((f) => (
                <button key={f} onClick={() => { setCompanyFilter(f); setCompaniesPage(1) }}
                  className={`chip capitalize ${companyFilter === f ? 'chip-active' : ''}`}>
                  {f}
                </button>
              ))}
              <span className="w-px bg-[color:var(--color-border)] mx-1 self-stretch" />
              {[
                { value: 'latest',     label: 'Newest' },
                { value: 'name',       label: 'A → Z'  },
                { value: 'name_desc',  label: 'Z → A'  },
                { value: 'complaints', label: 'Most complained' },
                { value: 'score',      label: 'Top score' },
              ].map((s) => (
                <button key={s.value} onClick={() => { setCompanySort(s.value); setCompaniesPage(1) }}
                  className={`chip ${companySort === s.value ? 'chip-active' : ''}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === 'moderation' && (
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <div className="flex gap-1.5 min-w-max">
              {['flagged', 'pending', 'edited', 'rejected'].map((f) => (
                <button key={f} onClick={() => setModFilter(f)}
                  className={`chip capitalize ${modFilter === f ? 'chip-active' : ''}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === 'claims' && (
          <div className="flex gap-1.5 flex-wrap">
            {['pending', 'approved', 'rejected', 'all'].map((f) => (
              <button key={f} onClick={() => setClaimFilter(f)}
                className={`chip capitalize ${claimFilter === f ? 'chip-active' : ''}`}>
                {f}
              </button>
            ))}
          </div>
        )}
        {tab === 'id-verifications' && (
          <div className="flex gap-1.5 flex-wrap">
            {['pending', 'approved', 'rejected', 'all'].map((f) => (
              <button key={f} onClick={() => setIdFilter(f)}
                className={`chip capitalize ${idFilter === f ? 'chip-active' : ''}`}>
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
        <>
        <div className="card overflow-hidden">
          {complaints.length === 0 && (
            <p className="p-10 text-sm text-[color:var(--color-muted)] text-center">No complaints match your filters.</p>
          )}
          <ul className="divide-y divide-[color:var(--color-border)]">
            {complaints.map((c) => {
              const st  = STATUS[c.status] ?? STATUS.open
              const mst = MOD_STATUS[c.moderation_status]
              return (
                <li key={c.id} className={`p-3 sm:p-4 hover:bg-[color:var(--color-paper-2)] transition ${
                  c.status === 'removed' ? 'opacity-50' : ''
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: st.fg, background: st.bg }}>
                          {st.label}
                        </span>
                        {mst && c.moderation_status !== 'approved' && (
                          <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: mst.fg, background: mst.bg }}>
                            🤖 {mst.label}
                          </span>
                        )}
                        <span className="text-[11px] text-[color:var(--color-muted)] capitalize">{c.category}</span>
                        {!c.is_public && (
                          <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: 'var(--color-muted)', background: 'var(--color-paper-2)' }}>
                            Private
                          </span>
                        )}
                      </div>
                      <Link to={`/complaints/${c.id}`}
                        className="text-sm font-semibold text-[color:var(--color-ink)] hover:text-[color:var(--color-eucalyptus)] transition line-clamp-1">
                        {c.title || c.description?.slice(0, 80)}
                      </Link>
                      <p className="text-xs text-[color:var(--color-muted)] mt-0.5 line-clamp-1">
                        <span className="font-medium text-[color:var(--color-ink-2)]">{c.consumer?.name}</span>
                        {' → '}
                        <span className="font-medium text-[color:var(--color-ink-2)]">{c.company?.name}</span>
                        {' · '}
                        {new Date(c.updated_at || c.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {c.feedback?.rating && (
                          <span className="ml-2 font-medium text-[color:var(--color-ochre)]">
                            · {c.feedback.rating}/5 {c.feedback.would_deal_again != null ? (c.feedback.would_deal_again ? '👍' : '👎') : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.status !== 'removed' ? (
                        <button onClick={() => updateComplaint(c.id, { status: 'removed', is_public: false })}
                          className="text-xs text-[color:var(--color-clay)] hover:bg-[color:var(--color-clay-soft)] px-2 py-1.5 rounded-xl transition font-medium">
                          Remove
                        </button>
                      ) : (
                        <button onClick={() => updateComplaint(c.id, { status: 'open', is_public: true })}
                          className="text-xs text-[color:var(--color-eucalyptus)] hover:bg-[color:var(--color-eucalyptus-3)] px-2 py-1.5 rounded-xl transition font-medium">
                          Restore
                        </button>
                      )}
                      <Link to={`/complaints/${c.id}`}
                        className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition">
                        <Icon name="arrow-r" size={14} />
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        {cMeta && cMeta.last_page > 1 && (
          <Pagination
            current={cMeta.current_page}
            total={cMeta.last_page}
            totalItems={cMeta.total}
            itemLabel="complaints"
            onChange={setCPage}
          />
        )}
        </>
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
                      {new Date(c.updated_at || c.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
        <>
        <div className="card overflow-hidden">
          {companies.length === 0 && (
            <p className="p-10 text-sm text-[color:var(--color-muted)] text-center">No companies found.</p>
          )}
          <ul className="divide-y divide-[color:var(--color-border)]">
            {companies.map((c) => {
              const isDeleting = deleteTarget?.id === c.id
              return (
              <li key={c.id} className="transition" style={{ background: isDeleting ? 'var(--color-clay-soft)' : undefined }}>
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  <CompanyLogo company={c} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
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
                          ⚠ Not Rec.
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[color:var(--color-muted)] mt-0.5 truncate">
                      <span className="capitalize">{c.subscription?.plan ?? 'free'}</span>
                      {' · '}{c.complaints_count ?? 0} complaints
                      {c.score && <span className="font-semibold text-[color:var(--color-ink-2)]"> · {Math.round(c.score.score)}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateCompany(c.id, { verified_badge: !c.verified_badge })}
                      title={c.verified_badge ? 'Remove verified badge' : 'Grant verified badge'}
                      className={`p-1.5 rounded-lg transition ${
                        c.verified_badge
                          ? 'text-[color:var(--color-eucalyptus)] bg-[color:var(--color-eucalyptus-3)]'
                          : 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-paper-2)]'
                      }`}>
                      <Icon name="verified" size={15} />
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
                    <button
                      onClick={() => setDeleteTarget(isDeleting ? null : { id: c.id, name: c.name, complaintsCount: c.complaints_count ?? 0 })}
                      title="Delete company"
                      className={`p-1.5 rounded-lg transition text-sm leading-none ${isDeleting ? 'bg-red-100 text-red-600' : 'text-[color:var(--color-muted)] hover:bg-red-50 hover:text-red-600'}`}>
                      🗑
                    </button>
                  </div>
                </div>

                {/* Inline delete confirmation — expands inside the row */}
                {isDeleting && (
                  <div className="px-4 pb-4 flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-[color:var(--color-muted)] mr-1">Delete:</span>
                    <button
                      onClick={() => handleDeleteConfirm(false)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border transition"
                      style={{ borderColor: '#f59e0b', color: '#92400e', background: '#fef3c7' }}>
                      Company only
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                      style={{ background: 'var(--color-clay)', color: 'white' }}>
                      Company + all complaints
                    </button>
                    <button
                      onClick={() => setDeleteTarget(null)}
                      className="text-xs px-3 py-1.5 rounded-xl transition text-[color:var(--color-muted)] hover:bg-[color:var(--color-paper-2)]">
                      Cancel
                    </button>
                  </div>
                )}
              </li>
              )
            })}
          </ul>
        </div>
        {companiesMeta && companiesMeta.last_page > 1 && (
          <Pagination
            current={companiesMeta.current_page}
            total={companiesMeta.last_page}
            totalItems={companiesMeta.total}
            onChange={setCompaniesPage}
          />
        )}
        </>
      )}

      {/* ── Unregistered companies tab ── */}
      {tab === 'unregistered' && !loading && (
        <div className="space-y-3">
          {stubs.length === 0 && (
            <div className="card p-10 text-sm text-[color:var(--color-muted)] text-center">
              <p className="text-3xl mb-3">✅</p>
              <p>No unregistered companies. All complaints are against known businesses.</p>
            </div>
          )}
          {stubs.map((c) => {
            const abnStripped = (c.abn ?? '').replace(/\s+/g, '')
            const abrUrl = `https://abr.business.gov.au/ABN/View?id=${abnStripped}`
            const isRenaming = renamingStub === c.id
            const nameIsPending = !c.abn_entity_name
            return (
            <div key={c.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[color:var(--color-paper-2)] flex items-center justify-center shrink-0 text-lg font-bold text-[color:var(--color-muted)]">
                  {(c.abn_entity_name || c.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {isRenaming ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveRenameStub(c.id); if (e.key === 'Escape') { setRenamingStub(null); setRenameValue('') } }}
                          className="text-sm border rounded-lg px-2 py-1 flex-1 min-w-0"
                          style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper)' }}
                          placeholder="Enter verified company name…"
                        />
                        <button onClick={() => saveRenameStub(c.id)}
                          className="text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
                          Save
                        </button>
                        <button onClick={() => { setRenamingStub(null); setRenameValue('') }}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: 'var(--color-paper-2)', color: 'var(--color-muted)' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-[color:var(--color-ink)]">
                          {c.abn_entity_name || c.name}
                        </span>
                        {nameIsPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: '#92400e', background: '#fef3c7' }}>
                            ⏳ Name unverified
                          </span>
                        )}
                        {c.abn_verified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: '#1d4ed8', background: '#eff6ff' }}>
                            ✓ ABN OK
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--color-muted)]">
                    ABN: <span className="font-mono font-medium text-[color:var(--color-ink-2)]">{c.abn ?? '—'}</span>
                    <span className="ml-1">· {c.complaints_count ?? 0} complaints</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <a href={abrUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium px-3 py-2 rounded-xl transition border"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}>
                  🔍 Verify on ABR
                </a>
                {!isRenaming && (
                  <button
                    onClick={() => { setRenamingStub(c.id); setRenameValue(c.abn_entity_name || '') }}
                    className="text-xs font-medium px-3 py-2 rounded-xl transition border"
                    style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}>
                    ✏ Set name
                  </button>
                )}
                <Link to={`/companies/${c.slug}`} target="_blank"
                  className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] px-3 py-2 rounded-xl hover:bg-[color:var(--color-paper-2)] transition font-medium border border-[color:var(--color-border)]">
                  View profile
                </Link>
                <button
                  onClick={() => promoteStub(c.id)}
                  className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl transition"
                  style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
                  ✓ Mark registered
                </button>
                <button
                  onClick={() => rejectStub(c.id)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl transition"
                  style={{ background: 'var(--color-clay-soft)', color: 'var(--color-clay)', border: '1px solid var(--color-clay)' }}>
                  ✕ Reject
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* ── Claims tab ── */}
      {tab === 'claims' && !loading && (
        <div className="space-y-3">
          {claims.length === 0 && (
            <div className="card p-10 text-sm text-[color:var(--color-muted)] text-center">
              <p className="text-3xl mb-3">📋</p>
              <p>No {claimFilter === 'all' ? '' : claimFilter} claims.</p>
            </div>
          )}
          {claims.map((cl) => (
            <ClaimCard key={cl.id} claim={cl} onApprove={approveClaim} onReject={rejectClaim} />
          ))}
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
              <li key={u.id} className={`p-3 sm:p-4 hover:bg-[color:var(--color-paper-2)] transition ${
                u.banned ? 'opacity-50' : ''
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-[color:var(--color-ink)]">{u.name}</span>
                      <RoleBadge role={u.role} />
                      {u.reputation_flag === 'serial_complainer' && (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                          ⚠ Serial
                        </span>
                      )}
                      {u.reputation_flag === 'verified_consumer' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)' }}>
                          <Icon name="verified" size={10} /> Trusted
                        </span>
                      )}
                      {u.banned && (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: 'var(--color-clay)', background: 'var(--color-clay-soft)' }}>
                          Banned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[color:var(--color-muted)] mt-0.5 truncate">
                      {u.email}
                      {u.company && <span className="ml-1">· {u.company.name}</span>}
                      {u.complaints_count > 0 && <span className="ml-1">· {u.complaints_count} complaints</span>}
                    </p>
                  </div>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => updateUser(u.id, { banned: !u.banned })}
                      className={`text-xs px-2.5 py-1.5 rounded-xl transition font-medium shrink-0 ${
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

      {/* ── ID Verifications tab ── */}
      {tab === 'id-verifications' && !loading && (
        <div className="card overflow-hidden">
          {idVerifications.length === 0 ? (
            <p className="p-10 text-sm text-[color:var(--color-muted)] text-center">
              No {idFilter === 'all' ? '' : idFilter} ID verification requests.
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--color-border)]">
              {idVerifications.map((u) => (
                <IdVerificationRow key={u.id} user={u} onApprove={approveId} onReject={rejectId} />
              ))}
            </ul>
          )}
        </div>
      )}

    </div>
  )
}

/* ─── Claim card ─────────────────────────────────────────── */
/* ─── ID Verification row ────────────────────────────────── */
function IdVerificationRow({ user: u, onApprove, onReject }) {
  const [showReject, setShowReject] = useState(false)
  const [note, setNote]             = useState('')
  const [busy, setBusy]             = useState(false)

  const STATUS_CFG = {
    pending:  { label: '⏳ Pending',  fg: '#8A5A1F',                 bg: '#F3E2C3' },
    approved: { label: '✅ Approved', fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)' },
    rejected: { label: '❌ Rejected', fg: 'var(--color-clay)',       bg: 'var(--color-clay-soft)' },
  }
  const cfg = STATUS_CFG[u.id_verification_status] ?? STATUS_CFG.pending

  const handleApprove = async () => {
    setBusy(true)
    await onApprove(u.id)
    setBusy(false)
  }
  const handleReject = async () => {
    setBusy(true)
    await onReject(u.id, note)
    setBusy(false)
    setShowReject(false)
  }

  return (
    <li className="p-4 hover:bg-[color:var(--color-paper-2)] transition">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
          style={{ background: 'var(--color-eucalyptus-3)', color: 'var(--color-eucalyptus)' }}>
          {u.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold text-[color:var(--color-ink)]">{u.name}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: cfg.fg, background: cfg.bg }}>{cfg.label}</span>
          </div>
          <p className="text-xs text-[color:var(--color-muted)]">{u.email}</p>
          <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
            Submitted: {new Date(u.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            {u.id_verified_at && ` · Verified: ${new Date(u.id_verified_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
          {u.id_rejection_note && (
            <p className="text-xs mt-1 px-2 py-1 rounded-lg"
              style={{ background: 'var(--color-clay-soft)', color: 'var(--color-clay)' }}>
              Rejection note: {u.id_rejection_note}
            </p>
          )}
        </div>
        {u.id_verification_status === 'pending' && (
          <div className="flex gap-2 shrink-0">
            <button onClick={handleApprove} disabled={busy}
              className="btn text-xs px-3 py-1.5"
              style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
              Approve
            </button>
            <button onClick={() => setShowReject(!showReject)} disabled={busy}
              className="btn btn-secondary text-xs px-3 py-1.5"
              style={{ color: 'var(--color-clay)' }}>
              Reject
            </button>
          </div>
        )}
      </div>
      {showReject && (
        <div className="mt-3 pl-14 space-y-2">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Rejection reason (optional)…"
            rows={2}
            className="input w-full text-sm resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleReject} disabled={busy}
              className="btn text-xs px-3 py-1.5"
              style={{ background: 'var(--color-clay)', color: 'var(--color-paper)' }}>
              {busy ? 'Rejecting…' : 'Confirm reject'}
            </button>
            <button onClick={() => setShowReject(false)}
              className="btn btn-secondary text-xs">Cancel</button>
          </div>
        </div>
      )}
    </li>
  )
}

function ClaimCard({ claim, onApprove, onReject }) {
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason]         = useState('')

  const PROOF_LABELS = {
    asic_extract:         'ASIC Company Extract',
    director_certificate: 'Director Certificate',
    employment_contract:  'Employment Contract',
    business_card:        'Business Card',
    other:                'Other',
  }

  const statusColor = {
    pending:  { fg: '#8A5A1F', bg: '#F3E2C3' },
    approved: { fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)' },
    rejected: { fg: 'var(--color-clay)', bg: 'var(--color-clay-soft)' },
  }[claim.status] ?? {}

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[color:var(--color-paper-2)] flex items-center justify-center shrink-0 text-lg font-bold text-[color:var(--color-muted)]">
          {claim.company?.name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-semibold text-sm text-[color:var(--color-ink)]">{claim.company?.name ?? '—'}</span>
            <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{ color: statusColor.fg, background: statusColor.bg }}>
              {claim.status}
            </span>
          </div>
          <div className="text-xs text-[color:var(--color-muted)] mb-3 space-y-0.5">
            <p><span className="font-medium text-[color:var(--color-ink-2)]">{claim.claimant_name}</span> · {claim.claimant_position}</p>
            <p><a href={`mailto:${claim.claimant_email}`} className="hover:underline">{claim.claimant_email}</a> · {claim.claimant_phone}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
            <div>
              <span className="text-[color:var(--color-muted)]">ABN: </span>
              <span className="font-mono font-medium text-[color:var(--color-ink-2)]">{claim.abn_confirmation || '—'}</span>
            </div>
            <div>
              <span className="text-[color:var(--color-muted)]">Proof: </span>
              <span className="font-medium text-[color:var(--color-ink-2)]">{PROOF_LABELS[claim.proof_type] ?? claim.proof_type ?? '—'}</span>
            </div>
          </div>

          {claim.message && (
            <div className="bg-[color:var(--color-paper-2)] rounded-xl px-3 py-2 text-xs text-[color:var(--color-ink-2)] leading-relaxed mb-3">
              {claim.message}
            </div>
          )}

          <p className="text-[11px] text-[color:var(--color-muted)]">
            Submitted {new Date(claim.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>

          {/* Audit history — shown for reviewed claims */}
          {claim.status !== 'pending' && claim.reviewed_at && (
            <div className="mt-3 pt-3 border-t text-xs space-y-1" style={{ borderColor: 'var(--color-line)' }}>
              <p className="font-semibold text-[10px] uppercase tracking-wide text-[color:var(--color-muted)]">Review history</p>
              <p className="text-[color:var(--color-ink-2)]">
                <span className="font-medium">{claim.status === 'approved' ? '✅ Approved' : '❌ Rejected'}</span>
                {' '}by <span className="font-medium">{claim.reviewer?.name ?? 'Admin'}</span>
                {' '}on {new Date(claim.reviewed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {claim.rejection_reason && (
                <p className="text-[color:var(--color-clay)]">Reason: {claim.rejection_reason}</p>
              )}
              <p className="text-[color:var(--color-muted)] italic text-[10px]">Email notification sent to claimant.</p>
            </div>
          )}

          {claim.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onApprove(claim.id)}
                className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl transition"
                style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
                ✓ Approve
              </button>
              <button
                onClick={() => setShowReject(!showReject)}
                className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl border transition"
                style={{ color: 'var(--color-clay)', borderColor: 'var(--color-clay)' }}>
                ✗ Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {showReject && (
        <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--color-line)' }}>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: 'var(--color-ink-2)' }}>
              Rejection reason <span style={{ color: 'var(--color-clay)' }}>*</span>
            </label>
            <span className={`text-[11px] font-medium ${reason.trim().length >= 10 ? 'text-[color:var(--color-eucalyptus)]' : 'text-[color:var(--color-clay)]'}`}>
              {reason.trim().length}/10 min
            </span>
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why this claim is being rejected. This will be sent to the claimant by email."
            rows={3}
            className="input w-full text-sm resize-none mb-1.5"
          />
          {reason.trim().length < 10 && reason.length > 0 && (
            <p className="text-[11px] mb-2" style={{ color: 'var(--color-clay)' }}>
              Please provide at least 10 characters so the claimant understands the reason.
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { if (reason.trim().length >= 10) { onReject(claim.id, reason); setShowReject(false) } }}
              disabled={reason.trim().length < 10}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ background: 'var(--color-clay)', color: 'white' }}>
              Confirm rejection
            </button>
            <button onClick={() => setShowReject(false)} className="text-xs px-3 py-1.5 rounded-xl hover:bg-[color:var(--color-paper-2)] transition">
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

/* ─── Pagination ─────────────────────────────────────────── */
function Pagination({ current, total, totalItems, onChange, itemLabel = 'companies' }) {
  // Build page window: always show first, last, current ±2
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
      pages.push(i)
    }
  }
  // Insert ellipsis markers
  const withGaps = []
  let prev = 0
  for (const p of pages) {
    if (p - prev > 1) withGaps.push('…')
    withGaps.push(p)
    prev = p
  }

  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-xs text-[color:var(--color-muted)]">
        Page <span className="font-medium text-[color:var(--color-ink)]">{current}</span> of{' '}
        <span className="font-medium text-[color:var(--color-ink)]">{total}</span>
        {' '}· {totalItems.toLocaleString()} {itemLabel} total
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="p-1.5 rounded-lg text-sm disabled:opacity-30 hover:bg-[color:var(--color-paper-2)] transition"
        >
          ‹
        </button>
        {withGaps.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-[color:var(--color-muted)]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-[30px] h-7 px-1.5 rounded-lg text-xs font-medium transition ${
                p === current
                  ? 'bg-[color:var(--color-eucalyptus)] text-[color:var(--color-paper)]'
                  : 'hover:bg-[color:var(--color-paper-2)] text-[color:var(--color-ink-2)]'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(current + 1)}
          disabled={current === total}
          className="p-1.5 rounded-lg text-sm disabled:opacity-30 hover:bg-[color:var(--color-paper-2)] transition"
        >
          ›
        </button>
      </div>
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
