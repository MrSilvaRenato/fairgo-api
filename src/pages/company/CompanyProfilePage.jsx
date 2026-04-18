import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/axios'

const BADGE_CONFIG = {
  excellent: { label: 'Excellent',  color: 'text-green-600',  bg: 'bg-green-100',  ring: '#16a34a' },
  good:      { label: 'Good',       color: 'text-yellow-600', bg: 'bg-yellow-100', ring: '#ca8a04' },
  regular:   { label: 'Regular',    color: 'text-orange-500', bg: 'bg-orange-100', ring: '#ea580c' },
  poor:      { label: 'Poor',       color: 'text-red-600',    bg: 'bg-red-100',    ring: '#dc2626' },
  not_rated: { label: 'Not rated',  color: 'text-gray-400',   bg: 'bg-gray-100',   ring: '#d1d5db' },
}

const STATUS_CONFIG = {
  open:       { label: 'Open',       style: 'badge badge-blue' },
  responded:  { label: 'Responded',  style: 'badge badge-purple' },
  resolved:   { label: 'Resolved',   style: 'badge badge-green' },
  unresolved: { label: 'Unresolved', style: 'badge badge-red' },
}

function ScoreMeter({ score, badge }) {
  const b = BADGE_CONFIG[badge] ?? BADGE_CONFIG.not_rated
  const pct = badge === 'not_rated' ? 0 : (score / 100) * 100
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={b.ring}
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${b.color}`}>
            {badge === 'not_rated' ? '—' : Math.round(score)}
          </span>
          {badge !== 'not_rated' && <span className="text-xs text-gray-400">/100</span>}
        </div>
      </div>
      <span className={`badge ${b.bg} ${b.color}`}>{b.label}</span>
    </div>
  )
}

export default function CompanyProfilePage() {
  const { slug } = useParams()
  const [company, setCompany] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/companies/${slug}`)
      .then((res) => {
        setCompany(res.data)
        return api.get('/complaints', { params: { company_id: res.data.id } })
      })
      .then((res) => setComplaints(res.data.data ?? []))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <ProfileSkeleton />
  if (!company) return (
    <div className="py-16 text-center">
      <div className="text-5xl mb-4">🏢</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Company not found</h2>
      <Link to="/" className="btn-secondary mt-4 inline-block">Back to home</Link>
    </div>
  )

  const score = company.score
  const badge = score?.badge ?? 'not_rated'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Main profile card */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {company.industry && (
                <span className="badge badge-gray capitalize">{company.industry}</span>
              )}
              {company.subscription?.plan !== 'free' && (
                <span className="badge badge-green">Verified</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
            {company.description && (
              <p className="text-gray-500 text-sm leading-relaxed max-w-lg">{company.description}</p>
            )}
            {company.abn && (
              <p className="text-xs text-gray-400 mt-2">ABN: {company.abn}</p>
            )}
          </div>
          <div className="shrink-0">
            <ScoreMeter score={score?.score ?? 0} badge={badge} />
          </div>
        </div>
      </div>

      {/* Score stats */}
      {score && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total complaints',  value: score.total_complaints },
            { label: 'Response rate',     value: score.total_complaints < 1 ? '—' : `${Math.round(score.response_rate * 100)}%` },
            { label: 'Resolution rate',   value: score.total_complaints < 1 ? '—' : `${Math.round(score.resolution_rate * 100)}%` },
            { label: 'Avg response time', value: score.total_complaints < 1 ? '—' : score.avg_response_hours < 1 ? '<1h' : `${Math.round(score.avg_response_hours)}h` },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Complaints section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Public complaints</h2>
            <p className="text-xs text-gray-400 mt-0.5">{complaints.length} total</p>
          </div>
          <Link
            to={`/complaints/new?company_id=${company.id}`}
            className="btn-primary text-sm"
          >
            Submit complaint
          </Link>
        </div>

        {complaints.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="font-semibold text-gray-800 mb-1">No complaints yet</h3>
            <p className="text-sm text-gray-500">Be the first to hold this company accountable.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {complaints.map((c) => {
              const st = STATUS_CONFIG[c.status] ?? { label: c.status, style: 'badge badge-gray' }
              return (
                <li key={c.id} className="card p-4 sm:p-5 hover:shadow-md transition">
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
                      <p className="text-xs text-gray-400 mt-1">
                        {c.consumer?.name} · {new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {c.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{c.description}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="card p-8 h-40" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
    </div>
  )
}
