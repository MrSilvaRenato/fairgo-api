import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'

const STARS = [
  { value: '5', label: 'Excellent' },
  { value: '4', label: 'Good' },
  { value: '3', label: 'OK' },
  { value: '2', label: 'Poor' },
  { value: '1', label: 'Terrible' },
]

export default function ResolvePage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [form, setForm] = useState({ resolved: '', rating: '', comment: '', would_deal_again: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hover, setHover] = useState(0)

  useEffect(() => {
    api.get(`/complaints/${id}`).then((res) => {
      const c = res.data
      if (!user || user.id !== c.consumer_id || c.feedback) {
        navigate(`/complaints/${id}`)
      } else {
        setComplaint(c)
      }
    })
  }, [id])

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.post(`/complaints/${id}/feedback`, {
        resolved:         form.resolved === 'true',
        rating:           form.rating ? Number(form.rating) : null,
        comment:          form.comment || null,
        would_deal_again: form.would_deal_again,
      })
      navigate(`/complaints/${id}`)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (!complaint) return (
    <div className="py-16 text-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <Link to={`/complaints/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to complaint
        </Link>
        <h1 className="page-header">Close your complaint</h1>
        <p className="text-gray-500 text-sm mt-1">
          <span className="font-medium text-gray-700">"{complaint.title}"</span> — {complaint.company?.name}
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-7">

          {/* Resolved? */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Was your issue resolved? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'true',  label: 'Yes, resolved',        icon: '✅', color: 'border-green-400 bg-green-50 text-green-700' },
                { value: 'false', label: 'No, still unresolved',  icon: '❌', color: 'border-red-400 bg-red-50 text-red-700' },
              ].map((opt) => (
                <button
                  key={opt.value} type="button"
                  onClick={() => setForm({ ...form, resolved: opt.value })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition font-medium text-sm ${
                    form.resolved === opt.value ? opt.color : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Would deal again */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Would you deal with {complaint.company?.name} again?{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true,  label: 'Yes, I would',    icon: '👍', color: 'border-blue-400 bg-blue-50 text-blue-700' },
                { value: false, label: 'No, I would not', icon: '👎', color: 'border-orange-400 bg-orange-50 text-orange-700' },
              ].map((opt) => (
                <button
                  key={String(opt.value)} type="button"
                  onClick={() => setForm({ ...form, would_deal_again: form.would_deal_again === opt.value ? null : opt.value })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition font-medium text-sm ${
                    form.would_deal_again === opt.value ? opt.color : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Star rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Rate your experience <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n} type="button"
                  onClick={() => setForm({ ...form, rating: form.rating === String(n) ? '' : String(n) })}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <svg className={`w-8 h-8 transition-colors ${n <= (hover || Number(form.rating)) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </button>
              ))}
              {form.rating && (
                <span className="ml-2 text-sm text-gray-500">
                  {STARS.find(s => s.value === form.rating)?.label}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Final comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="comment" value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={3}
              placeholder="Anything else you'd like to add about your experience…"
              className="input resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !form.resolved} className="btn-primary w-full justify-center flex">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Submitting…
              </span>
            ) : 'Submit & close complaint'}
          </button>
        </form>
      </div>
    </div>
  )
}
