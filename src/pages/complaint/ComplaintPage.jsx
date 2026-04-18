import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import CompanyResponseForm from '../../components/CompanyResponseForm'
import useSeoMeta from '../../hooks/useSeoMeta'

const STATUS_CONFIG = {
  open:              { label: 'Open',               style: 'badge badge-blue' },
  awaiting_response: { label: 'Awaiting Response',  style: 'badge badge-yellow' },
  responded:         { label: 'Responded',           style: 'badge badge-purple' },
  resolved:          { label: 'Resolved',            style: 'badge badge-green' },
  unresolved:        { label: 'Unresolved',          style: 'badge badge-red' },
  expired:           { label: 'Expired',             style: 'badge badge-gray' },
}

export default function ComplaintPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [complaint, setComplaint] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.get(`/complaints/${id}`),
      api.get(`/complaints/${id}/replies`).catch(() => ({ data: [] })),
    ])
      .then(([cRes, rRes]) => {
        setComplaint(cRes.data)
        setReplies(rRes.data)
        // Scroll to bottom after paint so latest message is visible
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 80)
        // Refresh user so navbar unread badge updates (replies marked read server-side above)
        useAuthStore.getState().fetchUser()
      })
      .catch(() => setError('Complaint not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const submitReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return
    setReplyError(''); setReplyLoading(true)
    try {
      const res = await api.post(`/complaints/${id}/replies`, { content: replyContent })
      setReplies((prev) => [...prev, res.data])
      setReplyContent('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setReplyError(err.response?.data?.message ?? 'Could not post reply.')
    } finally {
      setReplyLoading(false)
    }
  }

  useSeoMeta({
    title: complaint
      ? `${complaint.title} — complaint against ${complaint.company?.name}`
      : undefined,
    description: complaint
      ? `Consumer complaint filed against ${complaint.company?.name} on Fair Go. Category: ${complaint.category}. Status: ${complaint.status}. ${complaint.description?.slice(0, 120)}…`
      : undefined,
    url: `${window.location.origin}/complaints/${id}`,
  })

  if (loading) return <LoadingSkeleton />
  if (error) return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Complaint not found</h2>
      <p className="text-gray-500 text-sm">It may have been removed or made private.</p>
      <Link to="/" className="inline-block mt-6 btn-secondary">Back to home</Link>
    </div>
  )

  const isOwner     = user?.id === complaint.consumer_id
  const isCompany   = user?.role === 'company_admin' && user?.company_id === complaint.company_id
  const hasResponse = !!complaint.response
  const hasFeedback = !!complaint.feedback
  const isClosed    = ['resolved', 'unresolved', 'expired'].includes(complaint.status)
  const canReply    = (isOwner || isCompany) && hasResponse && !isClosed
  const status      = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG.open

  // Days until expiry
  const expiresAt    = complaint.expires_at ? new Date(complaint.expires_at) : null
  const daysLeft     = expiresAt ? Math.ceil((expiresAt - Date.now()) / 86400000) : null
  const showExpiry   = daysLeft !== null && !isClosed && complaint.status === 'open' && !hasResponse

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/" className="hover:text-gray-600">Home</Link>
        <span>/</span>
        <Link to={`/companies/${complaint.company?.slug}`} className="hover:text-gray-600">
          {complaint.company?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-600">Complaint #{complaint.id}</span>
      </div>

      {/* Expiry warning */}
      {showExpiry && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-center gap-2 ${daysLeft <= 2 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {daysLeft > 0
            ? `This complaint expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} if not answered.`
            : 'This complaint expires today if not answered.'}
        </div>
      )}

      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={status.style}>{status.label}</span>
          <span className="badge badge-gray capitalize">{complaint.category}</span>
          {complaint.is_public && <span className="badge badge-gray">Public</span>}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{complaint.title}</h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
          <span>By <span className="font-medium text-gray-700">{complaint.consumer?.name}</span></span>
          <span className="text-gray-300">·</span>
          <span>Against{' '}
            <Link to={`/companies/${complaint.company?.slug}`} className="text-green-600 hover:underline font-medium">
              {complaint.company?.name}
            </Link>
          </span>
          <span className="text-gray-300">·</span>
          <span>{new Date(complaint.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Complaint body */}
      <div className="card p-6 space-y-5">
        {complaint.moderation_edited && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: 'var(--color-paper-2)', color: 'var(--color-muted)', border: '1px solid var(--color-line)' }}>
            <span className="shrink-0 mt-0.5">✏️</span>
            <span>
              <strong style={{ color: 'var(--color-ink-2)' }}>Edited by Fair Go</strong>
              {' '}— Some content was automatically removed to comply with our community guidelines (e.g. personal information or offensive language).
            </span>
          </div>
        )}
        <Section title="What happened">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{complaint.description}</p>
        </Section>
        {complaint.expected_resolution && (
          <Section title="Expected resolution">
            <p className="text-gray-700 whitespace-pre-wrap text-sm">{complaint.expected_resolution}</p>
          </Section>
        )}
      </div>

      {/* Company response */}
      {hasResponse && (
        <div className="card p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Response from {complaint.company?.name}</h3>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{complaint.response.content}</p>
          <p className="text-xs text-gray-400 mt-3">
            Responded {new Date(complaint.response.responded_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Thread / replies */}
      {(replies.length > 0 || canReply) && (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b hairline-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-[color:var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
            </svg>
            <span className="text-sm font-semibold text-[color:var(--color-ink)]">Follow-up conversation</span>
            <span className="ml-auto text-xs text-[color:var(--color-muted)]">{replies.length} message{replies.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Bubbles — oldest first, newest at bottom (WhatsApp order) */}
          <div className="px-5 py-4 space-y-2 bg-[color:var(--color-paper-2)]">
            {replies.length === 0 && (
              <p className="text-xs text-[color:var(--color-muted)] text-center py-4">
                No messages yet. Be the first to follow up.
              </p>
            )}
            {replies.map((reply, i) => {
              const isConsumer = reply.author_type === 'consumer'
              const prev = replies[i - 1]
              const showName = !prev || prev.author_type !== reply.author_type

              return (
                <div key={reply.id} className={`flex items-end gap-2 ${isConsumer ? '' : 'flex-row-reverse'}`}>
                  {/* Avatar — only on first bubble of a run */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mb-0.5 ${
                    showName ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  } ${isConsumer
                    ? 'bg-[color:var(--color-paper)] border hairline text-[color:var(--color-ink)]'
                    : 'bg-[color:var(--color-eucalyptus)] text-[color:var(--color-paper)]'
                  }`}>
                    {reply.user?.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className={`flex flex-col gap-0.5 max-w-[75%] ${isConsumer ? 'items-start' : 'items-end'}`}>
                    {showName && (
                      <span className={`text-[11px] font-semibold px-1 ${
                        isConsumer ? 'text-[color:var(--color-ink-2)]' : 'text-[color:var(--color-eucalyptus)]'
                      }`}>
                        {isConsumer ? reply.user?.name : complaint.company?.name}
                      </span>
                    )}
                    <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      isConsumer
                        ? 'bg-[color:var(--color-card)] border hairline text-[color:var(--color-ink)] rounded-2xl rounded-bl-sm'
                        : 'text-[color:var(--color-paper)] rounded-2xl rounded-br-sm'
                    }`}
                      style={!isConsumer ? { background: 'var(--color-eucalyptus)' } : {}}>
                      {reply.content}
                    </div>
                    <span className="text-[10px] text-[color:var(--color-muted)] px-1">
                      {new Date(reply.created_at).toLocaleString('en-AU', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )
            })}
            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </div>

          {/* Reply input — attached to bottom of card */}
          {canReply && (
            <div className="border-t hairline-2 px-4 py-3 bg-[color:var(--color-card)]">
              <form onSubmit={submitReply}>
                <div className="flex items-end gap-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(e) } }}
                    rows={1}
                    placeholder="Write a follow-up… (Enter to send, Shift+Enter for new line)"
                    className="input resize-none flex-1 text-sm py-2.5 leading-snug"
                    style={{ minHeight: '42px', maxHeight: '120px', overflowY: 'auto' }}
                    maxLength={2000}
                  />
                  <button type="submit" disabled={replyLoading || !replyContent.trim()}
                    className="btn btn-primary shrink-0 h-[42px] px-4 text-sm">
                    {replyLoading ? '…' : 'Send'}
                  </button>
                </div>
                {replyError && (
                  <p className="text-xs text-[color:var(--color-clay)] mt-1.5">{replyError}</p>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {/* Resolution feedback */}
      {hasFeedback && (
        <div className={`card p-6 border-l-4 ${complaint.feedback.resolved ? 'border-green-500' : 'border-red-400'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{complaint.feedback.resolved ? '✅' : '❌'}</span>
            <h3 className="text-sm font-semibold text-gray-800">
              {complaint.feedback.resolved ? 'Issue resolved' : 'Issue unresolved'}
            </h3>
          </div>
          {complaint.feedback.rating && (
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map((n) => (
                <svg key={n} className={`w-4 h-4 ${n <= complaint.feedback.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
              <span className="text-xs text-gray-500 ml-1">{complaint.feedback.rating}/5</span>
            </div>
          )}
          {complaint.feedback.would_deal_again !== null && complaint.feedback.would_deal_again !== undefined && (
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-2 ${complaint.feedback.would_deal_again ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {complaint.feedback.would_deal_again ? '👍 Would deal again' : '👎 Would not deal again'}
            </div>
          )}
          {complaint.feedback.comment && (
            <p className="text-gray-600 text-sm italic">"{complaint.feedback.comment}"</p>
          )}
        </div>
      )}

      {/* Company response form */}
      {isCompany && !hasResponse && (
        <CompanyResponseForm
          complaintId={complaint.id}
          onSubmitted={(response) => setComplaint((c) => ({ ...c, response, status: 'responded' }))}
        />
      )}

      {/* Owner close action */}
      {isOwner && hasResponse && !isClosed && (!hasFeedback || complaint.reopened_at) && (
        <div className="card p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {complaint.reopened_at ? 'The company has replied to your follow-up' : 'The company has responded'}
              </p>
              <p className="text-xs text-amber-700 mt-0.5 mb-3">
                {complaint.reopened_at
                  ? 'Update your verdict — only the latest rating counts towards their score.'
                  : 'Was your issue resolved? Close this complaint to update the company\'s score.'}
              </p>
              <Link to={`/complaints/${complaint.id}/resolve`} className="btn-primary text-xs px-4 py-2">
                {complaint.reopened_at ? 'Update & close' : 'Close this complaint'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/3" />
      <div className="card p-6 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-7 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="card p-6 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-1/5" />
        <div className="h-4 bg-gray-100 rounded" />
        <div className="h-4 bg-gray-100 rounded" />
        <div className="h-4 bg-gray-100 rounded w-4/5" />
      </div>
    </div>
  )
}
