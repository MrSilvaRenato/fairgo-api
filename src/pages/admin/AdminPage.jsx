import { useEffect, useState } from 'react'
import api from '../../lib/axios'

const STATUS_CONFIG = {
  open:       'badge badge-blue',
  responded:  'badge badge-purple',
  resolved:   'badge badge-green',
  unresolved: 'badge badge-red',
  removed:    'badge badge-gray',
}

function StatCard({ label, value, color = 'text-gray-800' }) {
  return (
    <div className="stat-card">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState('complaints')
  const [stats, setStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = q ? { q } : {}
    const map = { complaints: '/admin/complaints', companies: '/admin/companies', users: '/admin/users' }
    api.get(map[tab], { params }).then((r) => {
      if (tab === 'complaints') setComplaints(r.data.data)
      if (tab === 'companies')  setCompanies(r.data.data)
      if (tab === 'users')      setUsers(r.data.data)
    }).finally(() => setLoading(false))
  }, [tab, q])

  const removeComplaint = async (id) => {
    await api.put(`/admin/complaints/${id}`, { status: 'removed', is_public: false })
    setComplaints((p) => p.map((c) => c.id === id ? { ...c, status: 'removed', is_public: false } : c))
  }

  const restoreComplaint = async (id) => {
    await api.put(`/admin/complaints/${id}`, { status: 'open', is_public: true })
    setComplaints((p) => p.map((c) => c.id === id ? { ...c, status: 'open', is_public: true } : c))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-header">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">Moderate content and manage the platform</p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <StatCard label="Users"      value={stats.total_users} />
          <StatCard label="Companies"  value={stats.total_companies} />
          <StatCard label="Complaints" value={stats.total_complaints} />
          <StatCard label="Open"       value={stats.open_complaints} color={stats.open_complaints > 0 ? 'text-amber-600' : 'text-gray-800'} />
          <StatCard label="Resolved"   value={stats.resolved} color="text-green-600" />
        </div>
      )}

      {/* Tabs */}
      <div className="card p-1 flex gap-1">
        {['complaints', 'companies', 'users'].map((t) => (
          <button key={t} onClick={() => { setTab(t); setQ('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition ${
              tab === t ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text" placeholder={`Search ${tab}…`}
          value={q} onChange={(e) => setQ(e.target.value)}
          className="input pl-10 max-w-sm"
        />
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}
        </div>
      )}

      {/* Complaints */}
      {tab === 'complaints' && !loading && (
        <div className="card divide-y divide-gray-50">
          {complaints.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">No complaints found.</p>}
          {complaints.map((c) => (
            <div key={c.id} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.description?.slice(0, 80)}…</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="font-medium text-gray-600">{c.consumer?.name}</span> → {c.company?.name} · <span className="capitalize">{c.category}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={STATUS_CONFIG[c.status] ?? 'badge badge-gray'}>{c.status}</span>
                {c.status !== 'removed' ? (
                  <button onClick={() => removeComplaint(c.id)}
                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition">
                    Remove
                  </button>
                ) : (
                  <button onClick={() => restoreComplaint(c.id)}
                    className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded-lg transition">
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Companies */}
      {tab === 'companies' && !loading && (
        <div className="card divide-y divide-gray-50">
          {companies.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">No companies found.</p>}
          {companies.map((c) => (
            <div key={c.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-gray-500">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.user?.email} · <span className="capitalize">{c.subscription?.plan ?? 'free'} plan</span></p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.score && (
                  <span className="text-sm font-bold text-gray-700">{Math.round(c.score.score)}</span>
                )}
                <span className={`badge ${c.score?.badge === 'excellent' ? 'badge-green' : 'badge-gray'} capitalize`}>
                  {c.score?.badge?.replace('_', ' ') ?? 'not rated'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && !loading && (
        <div className="card divide-y divide-gray-50">
          {users.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">No users found.</p>}
          {users.map((u) => (
            <div key={u.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-green-600">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{u.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'company_admin' ? 'badge-blue' : 'badge-gray'} capitalize`}>
                  {u.role.replace('_', ' ')}
                </span>
                {u.company && (
                  <span className="text-xs text-gray-400 hidden sm:block">{u.company.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
