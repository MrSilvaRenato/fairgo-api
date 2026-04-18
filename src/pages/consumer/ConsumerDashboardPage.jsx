import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'

const STATUS_CONFIG = {
  open:              { label: 'Open',             style: 'badge badge-blue' },
  awaiting_response: { label: 'Awaiting Response', style: 'badge badge-yellow' },
  responded:         { label: 'Responded',          style: 'badge badge-purple' },
  resolved:          { label: 'Resolved',           style: 'badge badge-green' },
  unresolved:        { label: 'Unresolved',         style: 'badge badge-red' },
  expired:           { label: 'Expired',            style: 'badge badge-gray' },
}

export default function ConsumerDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/dashboard/consumer').then((res) => setData(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />
  const { stats, complaints } = data

  const filtered = filter === 'all' ? complaints : complaints.filter((c) => c.status === filter)

  const statItems = [
    { label: 'Total',      value: stats.total,      key: 'all' },
    { label: 'Open',       value: stats.open,        key: 'open',       alert: stats.open > 0 },
    { label: 'Responded',  value: stats.responded,   key: 'responded',  highlight: stats.responded > 0 },
    { label: 'Resolved',   value: stats.resolved,    key: 'resolved' },
    { label: 'Unresolved', value: stats.unresolved,  key: 'unresolved' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-header">My Complaints</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage your submitted complaints</p>
        </div>
        <Link to="/complaints/new" className="btn-primary shrink-0">
          <span className="hidden sm:inline">+ New complaint</span>
          <span className="sm:hidden">+</span>
        </Link>
      </div>

      {/* Action needed banner */}
      {stats.responded > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {stats.responded} complaint{stats.responded > 1 ? 's' : ''} waiting for your response
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Companies have replied — close them to update their scores.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {statItems.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`stat-card transition hover:shadow-md cursor-pointer ${
              filter === s.key ? 'ring-2 ring-green-500 ring-offset-1' : ''
            } ${s.alert ? 'border-amber-200 bg-amber-50' : ''}`}
          >
            <p className={`text-2xl font-bold ${s.alert ? 'text-amber-600' : s.highlight ? 'text-purple-600' : 'text-gray-800'}`}>
              {s.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Complaints list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-semibold text-gray-800 mb-1">
            {filter === 'all' ? 'No complaints yet' : `No ${filter} complaints`}
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            {filter === 'all'
              ? 'Had a bad experience? Put it on the record.'
              : 'Try a different filter.'}
          </p>
          {filter === 'all' && (
            <Link to="/complaints/new" className="btn-primary">Submit your first complaint</Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => {
            const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.open
            const needsClose = c.status === 'responded' && !c.feedback
            return (
              <li key={c.id} className={`card p-4 sm:p-5 hover:shadow-md transition ${needsClose ? 'border-amber-200' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={st.style}>{st.label}</span>
                      <span className="text-xs text-gray-400 capitalize">{c.category}</span>
                    </div>
                    <Link to={`/complaints/${c.id}`}
                      className="font-semibold text-gray-900 hover:text-green-600 transition block leading-snug">
                      {c.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-400">
                      <Link to={`/companies/${c.company?.slug}`} className="hover:text-green-600 font-medium text-gray-500">
                        {c.company?.name}
                      </Link>
                      <span>·</span>
                      <span>{new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {needsClose && (
                    <Link to={`/complaints/${c.id}/resolve`}
                      className="shrink-0 text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition font-medium">
                      Close
                    </Link>
                  )}
                </div>

                {c.response && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 flex-1">
                      <span className="font-medium text-gray-700">Company replied: </span>
                      {c.response.content}
                    </p>
                  </div>
                )}

                {c.feedback && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-sm">{c.feedback.resolved ? '✅' : '❌'}</span>
                    <span className="text-xs text-gray-500">
                      {c.feedback.resolved ? 'You marked this resolved' : 'You marked this unresolved'}
                      {c.feedback.rating && ` · ${c.feedback.rating}/5 ★`}
                    </span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-1/3" />
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
    </div>
  )
}
