import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import CompanyResponseForm from '../../components/CompanyResponseForm'

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
      {replies.length > 0 && (
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
            </svg>
            Follow-up conversation
          </h3>

          <div className="space-y-3">
            {replies.map((reply) => {
              const isConsumerReply = reply.author_type === 'consumer'
              return (
                <div key={reply.id} className={`flex gap-3 ${isConsumerReply ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isConsumerReply ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {reply.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex-1 max-w-[85%] ${isConsumerReply ? '' : 'items-end flex flex-col'}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm ${isConsumerReply ? 'bg-gray-50 border border-gray-100 text-gray-700' : 'bg-green-50 border border-green-100 text-gray-700'}`}>
                      <p className={`text-xs font-semibold mb-1 ${isConsumerReply ? 'text-blue-600' : 'text-green-600'}`}>
                        {isConsumerReply ? reply.user?.name : `${complaint.company?.name}`}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 px-1">
                      {new Date(reply.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      {/* Reply form */}
      {canReply && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Add a follow-up</h3>
          <form onSubmit={submitReply} className="space-y-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={3}
              placeholder="Write a follow-up message…"
              className="input resize-none"
              maxLength={2000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{replyContent.length}/2000</span>
              <button type="submit" disabled={replyLoading || !replyContent.trim()} className="btn-primary text-xs px-4 py-2">
                {replyLoading ? 'Sending…' : 'Send reply'}
              </button>
            </div>
            {replyError && <p className="text-xs text-red-600">{replyError}</p>}
          </form>
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
      {isOwner && hasResponse && !hasFeedback && (
        <div className="card p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">The company has responded</p>
              <p className="text-xs text-amber-700 mt-0.5 mb-3">Was your issue resolved? Close this complaint to update the company's score.</p>
              <Link to={`/complaints/${complaint.id}/resolve`} className="btn-primary text-xs px-4 py-2">
                Close this complaint
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
