import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import Icon from '../../components/Icon'

const STARS = [
  { value: '5', label: 'Excellent' },
  { value: '4', label: 'Good' },
  { value: '3', label: 'OK' },
  { value: '2', label: 'Poor' },
  { value: '1', label: 'Terrible' },
]

export default function ResolvePage() {
  const { id }   = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [complaint, setComplaint] = useState(null)
  const [isReopen, setIsReopen]   = useState(false)
  const [form, setForm] = useState({
    resolved: '', rating: '', comment: '', would_deal_again: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [hover, setHover]     = useState(0)

  useEffect(() => {
    api.get(`/complaints/${id}`).then((res) => {
      const c = res.data

      // Allowed if: consumer owns it AND (no feedback yet OR was re-opened)
      const isOwner   = user?.id === c.consumer_id
      const canClose  = !c.feedback || c.reopened_at

      if (!isOwner || !canClose) {
        navigate(`/complaints/${id}`)
        return
      }

      setComplaint(c)
      setIsReopen(!!c.reopened_at && !!c.feedback)

      // Pre-fill previous answers when re-closing after re-open
      if (c.feedback) {
        setForm({
          resolved:         c.feedback.resolved ? 'true' : 'false',
          rating:           c.feedback.rating ? String(c.feedback.rating) : '',
          comment:          c.feedback.comment ?? '',
          would_deal_again: c.feedback.would_deal_again ?? null,
        })
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
      <div className="w-8 h-8 border-2 border-[color:var(--color-eucalyptus)] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-8">

      {/* Back link */}
      <Link to={`/complaints/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] mb-6 transition">
        <Icon name="arrow-r" size={14} className="rotate-180" /> Back to complaint
      </Link>

      {/* Header */}
      <div className="mb-6">
        {isReopen && (
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-3"
            style={{ color: 'var(--color-ochre)', background: '#FDF6E8', border: '1px solid var(--color-ochre)' }}>
            <Icon name="arrow-up" size={12} /> Re-opened complaint
          </div>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {isReopen ? 'Update your verdict' : 'Close your complaint'}
        </h1>
        <p className="text-sm text-[color:var(--color-ink-2)] mt-1.5">
          <span className="font-medium text-[color:var(--color-ink)]">"{complaint.title}"</span>
          {' — '}{complaint.company?.name}
        </p>
        {isReopen && (
          <p className="text-xs text-[color:var(--color-muted)] mt-2">
            Your previous rating is pre-filled. Update anything that changed — only the latest counts towards the score.
          </p>
        )}
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-7">

          {/* Resolved? */}
          <div>
            <label className="block text-sm font-semibold text-[color:var(--color-ink)] mb-3">
              Was your issue resolved? <span className="text-[color:var(--color-clay)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'true',  label: 'Yes, resolved',       icon: 'check', fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)', border: 'var(--color-eucalyptus)' },
                { value: 'false', label: 'No, still unresolved', icon: 'x',     fg: 'var(--color-clay)',        bg: 'var(--color-clay-soft)',    border: 'var(--color-clay)' },
              ].map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setForm({ ...form, resolved: opt.value })}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition font-medium text-sm"
                  style={form.resolved === opt.value
                    ? { color: opt.fg, background: opt.bg, borderColor: opt.border }
                    : { color: 'var(--color-muted)', background: 'var(--color-paper)', borderColor: 'var(--color-line)' }
                  }>
                  <Icon name={opt.icon} size={22}
                    style={{ color: form.resolved === opt.value ? opt.fg : 'var(--color-line)' }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Would deal again */}
          <div>
            <label className="block text-sm font-semibold text-[color:var(--color-ink)] mb-3">
              Would you deal with {complaint.company?.name} again?{' '}
              <span className="text-[color:var(--color-muted)] font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true,  label: 'Yes, I would',    icon: 'thumb', fg: 'var(--color-eucalyptus)', bg: 'var(--color-eucalyptus-3)', border: 'var(--color-eucalyptus)' },
                { value: false, label: 'No, I would not', icon: 'flag',  fg: 'var(--color-clay)',        bg: 'var(--color-clay-soft)',    border: 'var(--color-clay)' },
              ].map((opt) => (
                <button key={String(opt.value)} type="button"
                  onClick={() => setForm({ ...form, would_deal_again: form.would_deal_again === opt.value ? null : opt.value })}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition font-medium text-sm"
                  style={form.would_deal_again === opt.value
                    ? { color: opt.fg, background: opt.bg, borderColor: opt.border }
                    : { color: 'var(--color-muted)', background: 'var(--color-paper)', borderColor: 'var(--color-line)' }
                  }>
                  <Icon name={opt.icon} size={22}
                    style={{ color: form.would_deal_again === opt.value ? opt.fg : 'var(--color-line)' }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Star rating */}
          <div>
            <label className="block text-sm font-semibold text-[color:var(--color-ink)] mb-3">
              Rate your overall experience{' '}
              <span className="text-[color:var(--color-muted)] font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button"
                  onClick={() => setForm({ ...form, rating: form.rating === String(n) ? '' : String(n) })}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110 p-0.5">
                  <svg className={`w-8 h-8 transition-colors ${n <= (hover || Number(form.rating)) ? 'text-[color:var(--color-ochre)]' : 'text-[color:var(--color-line)]'}`}
                    fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </button>
              ))}
              {form.rating && (
                <span className="ml-2 text-sm text-[color:var(--color-ink-2)]">
                  {STARS.find(s => s.value === form.rating)?.label}
                  {isReopen && complaint.feedback?.rating && Number(form.rating) !== complaint.feedback.rating && (
                    <span className="ml-1 text-[color:var(--color-muted)]">
                      (was {complaint.feedback.rating})
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-[color:var(--color-ink)] mb-1.5">
              Final comment{' '}
              <span className="text-[color:var(--color-muted)] font-normal">(optional)</span>
            </label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={3}
              placeholder="Anything else you'd like to add about your experience…"
              className="input resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-[color:var(--color-clay)] bg-[color:var(--color-clay-soft)] p-3 text-sm text-[color:var(--color-clay)] flex items-center gap-2">
              <Icon name="x" size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading || !form.resolved} className="btn btn-primary w-full justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Submitting…
              </span>
            ) : isReopen ? 'Update & close complaint' : 'Submit & close complaint'}
          </button>

        </form>
      </div>

      {isReopen && (
        <p className="text-xs text-center text-[color:var(--color-muted)] mt-4">
          Only the latest rating counts towards {complaint.company?.name}'s Fair Go score — no double counting.
        </p>
      )}
    </div>
  )
}
