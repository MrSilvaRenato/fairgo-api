import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'

function Bar({ value, max, color = 'bg-green-500', label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-xs text-gray-500 w-16 shrink-0 truncate">{label}</span>}
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={`${color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-6 text-right">{value}</span>
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function CompanyAnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    api.get('/dashboard/analytics')
      .then((res) => setData(res.data))
      .catch((err) => { if (err.response?.status === 403) setLocked(true) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-1/4" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}
    </div>
  )

  if (locked) return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="card p-10">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Analytics — Standard & Pro</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Upgrade to <strong>Standard ($149/mo)</strong> or <strong>Pro ($399/mo)</strong> to access
          complaint trends, response time analytics, and satisfaction scores over time.
        </p>
        <Link to="/company/billing" className="btn-primary w-full justify-center flex">
          View plans & upgrade
        </Link>
        <Link to="/company/dashboard" className="block mt-3 text-sm text-gray-500 hover:text-gray-700">
          Back to dashboard
        </Link>
      </div>
    </div>
  )

  if (!data) return null

  const maxVolume   = Math.max(...data.volume_by_month.map((d) => d.count), 1)
  const maxCategory = Math.max(...data.by_category.map((d) => d.count), 1)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-header">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance overview for your company</p>
        </div>
        <Link to="/company/dashboard" className="btn-secondary text-sm">← Dashboard</Link>
      </div>

      {/* Score summary */}
      {data.score && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Reputation score" value={`${Math.round(data.score.score)}`} sub="/100" />
          <StatCard label="Response rate"   value={`${Math.round(data.score.response_rate * 100)}%`} />
          <StatCard label="Resolution rate" value={`${Math.round(data.score.resolution_rate * 100)}%`} />
          <StatCard label="Avg response"    value={`${Math.round(data.score.avg_response_hours)}h`} />
        </div>
      )}

      {/* Volume by month */}
      <div className="card p-6">
        <h2 className="section-title mb-5">Complaints per month</h2>
        {data.volume_by_month.length === 0 ? (
          <Empty text="Not enough data yet." />
        ) : (
          <div className="space-y-3">
            {data.volume_by_month.map((d) => (
              <Bar key={d.month} label={d.month} value={d.count} max={maxVolume} color="bg-green-500" />
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* By category */}
        <div className="card p-6">
          <h2 className="section-title mb-5">By category</h2>
          {data.by_category.length === 0 ? (
            <Empty text="No data yet." />
          ) : (
            <div className="space-y-3">
              {data.by_category.map((d) => (
                <Bar key={d.category} label={d.category} value={d.count} max={maxCategory} color="bg-blue-400" />
              ))}
            </div>
          )}
        </div>

        {/* Avg response time */}
        <div className="card p-6">
          <h2 className="section-title mb-5">Avg response time (hours)</h2>
          {data.avg_response_by_month.length === 0 ? (
            <Empty text="No responses yet." />
          ) : (
            <div className="space-y-3">
              {data.avg_response_by_month.map((d) => (
                <div key={d.month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16 shrink-0">{d.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-yellow-400 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (d.avg_hours / 168) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-600 w-10 text-right">{d.avg_hours}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Satisfaction */}
      <div className="card p-6">
        <h2 className="section-title mb-5">Satisfaction rating over time</h2>
        {data.satisfaction_by_month.length === 0 ? (
          <Empty text="No ratings yet." />
        ) : (
          <div className="space-y-3">
            {data.satisfaction_by_month.map((d) => (
              <div key={d.month} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 shrink-0">{d.month}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-green-400 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${(d.avg_rating / 5) * 100}%` }} />
                </div>
                <div className="flex items-center gap-1 w-12">
                  <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span className="text-xs font-medium text-gray-600">{d.avg_rating}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Empty({ text }) {
  return <p className="text-sm text-gray-400 text-center py-4">{text}</p>
}
