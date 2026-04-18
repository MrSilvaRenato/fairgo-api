import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import CompanyResponseForm from '../../components/CompanyResponseForm'

const STATUS_CONFIG = {
  open:              { label: 'Open',             style: 'badge badge-blue' },
  awaiting_response: { label: 'Awaiting Response', style: 'badge badge-yellow' },
  responded:         { label: 'Responded',          style: 'badge badge-purple' },
  resolved:          { label: 'Resolved',           style: 'badge badge-green' },
  unresolved:        { label: 'Unresolved',         style: 'badge badge-red' },
}

const BADGE_COLOR = {
  excellent: 'text-green-600', good: 'text-yellow-500',
  regular: 'text-orange-500',  poor: 'text-red-500', not_rated: 'text-gray-300',
}

function TrustBadgeSection({ slug }) {
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
          <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Trust Badge</h3>
        </div>
        <Link to="/company/billing" className="text-xs text-green-600 hover:underline">Manage plan →</Link>
      </div>
      <p className="text-xs text-gray-500 mb-3">Embed this on your website to display your Fair Go score.</p>
      <div className="relative">
        <pre className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all font-mono">
          {snippet}
        </pre>
        <button onClick={copy}
          className="absolute top-2 right-2 text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700 transition">
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export default function CompanyDashboardPage() {
  const { fetchUser } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [respondingTo, setRespondingTo] = useState(null)

  useEffect(() => {
    // Sync user first so company association is fresh, then load dashboard
    fetchUser().finally(() => {
      api.get('/dashboard/company')
        .then((res) => setData(res.data))
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    })
  }, [])

  const handleResponseSubmitted = (complaintId, response) => {
    setData((prev) => ({
      ...prev,
      complaints: prev.complaints.map((c) =>
        c.id === complaintId ? { ...c, response, status: 'responded' } : c
      ),
    }))
    setRespondingTo(null)
  }

  if (loading) return <DashboardSkeleton />
  if (!data) return <NoCompanyPrompt />

  const { company, stats, complaints } = data
  const score = company.score
  const badge = score?.badge ?? 'not_rated'

  const filtered = filter === 'all' ? complaints : complaints.filter((c) => c.status === filter)

  const statItems = [
    { label: 'Total',     value: stats.total },
    { label: 'Open',      value: stats.open,             alert: stats.open > 0 },
    { label: 'Responded', value: stats.responded },
    { label: 'Resolved',  value: stats.resolved },
    { label: 'Pending',   value: stats.pending_response, alert: stats.pending_response > 0 },
    { label: 'Unresolved',value: stats.unresolved },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="page-header">{company.name}</h1>
              <span className="badge badge-gray capitalize">{company.subscription?.plan ?? 'free'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <Link to={`/companies/${company.slug}`} className="text-green-600 hover:underline text-sm flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Public profile
              </Link>
              <Link to="/company/analytics" className="text-gray-500 hover:text-green-600 text-sm">Analytics →</Link>
              <Link to="/company/billing" className="text-gray-500 hover:text-green-600 text-sm">Billing →</Link>
            </div>
          </div>

          {score && (
            <div className="text-center">
              <p className={`text-5xl font-bold ${BADGE_COLOR[badge]}`}>
                {badge === 'not_rated' ? '—' : Math.round(score.score)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">reputation score</p>
              <p className={`text-xs font-medium mt-1 capitalize ${BADGE_COLOR[badge]}`}>{badge.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {(stats.open > 0 || stats.pending_response > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {stats.open + stats.pending_response} complaint{stats.open + stats.pending_response > 1 ? 's' : ''} need your attention
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Respond promptly to improve your reputation score.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {statItems.map((s) => (
          <div key={s.label} className={`stat-card ${s.alert ? 'border-amber-200 bg-amber-50' : ''}`}>
            <p className={`text-2xl font-bold ${s.alert ? 'text-amber-600' : 'text-gray-800'}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Trust badge */}
      <TrustBadgeSection slug={company.slug} />

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {['all', 'open', 'responded', 'resolved', 'unresolved'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-sm px-4 py-1.5 rounded-xl border transition capitalize ${
              filter === f
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
            }`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Complaints inbox */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="font-semibold text-gray-800 mb-1">No complaints here</h3>
          <p className="text-sm text-gray-500">
            {filter === 'all' ? 'No complaints have been submitted yet.' : `No ${filter} complaints.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => {
            const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.open
            return (
              <li key={c.id} className="card p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={st.style}>{st.label}</span>
                      <span className="text-xs text-gray-400 capitalize">{c.category}</span>
                    </div>
                    <Link to={`/complaints/${c.id}`}
                      className="font-semibold text-gray-900 hover:text-green-600 transition block">
                      {c.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                      <span className="font-medium text-gray-500">{c.consumer?.name}</span>
                      <span>·</span>
                      <span>{new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  {!c.response && (
                    <button
                      onClick={() => setRespondingTo(respondingTo === c.id ? null : c.id)}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                        respondingTo === c.id
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}>
                      {respondingTo === c.id ? 'Cancel' : 'Respond'}
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{c.description}</p>

                {c.response && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded shrink-0 flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      <span className="font-medium text-gray-700">Your response: </span>{c.response.content}
                    </p>
                  </div>
                )}

                {respondingTo === c.id && (
                  <div className="mt-4">
                    <CompanyResponseForm
                      complaintId={c.id}
                      onSubmitted={(response) => handleResponseSubmitted(c.id, response)}
                    />
                  </div>
                )}

                {c.feedback && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-sm">{c.feedback.resolved ? '✅' : '❌'}</span>
                    <span className="text-xs text-gray-500">
                      {c.feedback.resolved ? 'Consumer marked resolved' : 'Consumer marked unresolved'}
                      {c.feedback.rating && ` · ${c.feedback.rating}/5 ★`}
                      {c.feedback.comment && ` · "${c.feedback.comment}"`}
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

function NoCompanyPrompt() {
  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Register your business</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
        Your account is ready — now set up your business profile so customers can find you and you can manage complaints.
      </p>

      <div className="card p-6 text-left mb-6 space-y-4">
        {[
          { icon: '🔍', title: 'Get discovered', desc: 'Appear in company searches and the public rankings.' },
          { icon: '💬', title: 'Respond to complaints', desc: 'Manage and reply to customer issues in one place.' },
          { icon: '📈', title: 'Build your reputation', desc: 'Earn a public trust score that grows as you resolve issues.' },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">{f.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{f.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Link to="/companies/register" className="btn-primary w-full justify-center flex text-sm py-3">
        Set up my business profile
      </Link>
      <p className="text-xs text-gray-400 mt-3">Takes less than 2 minutes · Free forever</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="card p-6 h-28" />
      <div className="grid grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
    </div>
  )
}
