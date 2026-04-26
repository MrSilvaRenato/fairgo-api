import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import CompanyResponseForm from '../../components/CompanyResponseForm'
import CompanyLogo from '../../components/CompanyLogo'
import AiReviewedBadge from '../../components/AiReviewedBadge'
import Icon from '../../components/Icon'
import useSeoMeta from '../../hooks/useSeoMeta'

const STATUS_CONFIG = {
  open:              { label: 'Open',              badge: 'badge-blue',   dot: '#3B4B7A' },
  awaiting_response: { label: 'Awaiting Response', badge: 'badge-yellow', dot: '#8A5A1F' },
  responded:         { label: 'Responded',          badge: 'badge-purple', dot: '#5E3E7A' },
  resolved:          { label: 'Resolved',           badge: 'badge-green',  dot: 'var(--color-eucalyptus)' },
  unresolved:        { label: 'Unresolved',         badge: 'badge-red',    dot: 'var(--color-clay)' },
  expired:           { label: 'Expired',            badge: 'badge-gray',   dot: 'var(--color-muted)' },
}

const CATEGORY_ICONS = {
  billing: '💳', delivery: '📦', service: '🎧',
  refund: '💰', fraud: '🚨', other: '📝',
}

export default function ComplaintPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [complaint, setComplaint] = useState(null)
  const [replies, setReplies]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError]     = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.get(`/complaints/${id}`),
      api.get(`/complaints/${id}/replies`).catch(() => ({ data: [] })),
    ])
      .then(([cRes, rRes]) => {
        setComplaint(cRes.data)
        setReplies(rRes.data)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 80)
        if (localStorage.getItem('token')) {
          useAuthStore.getState().fetchUser()
          // Explicitly mark all unread replies as read for this user
          api.post(`/complaints/${id}/mark-read`).catch(() => {})
        }
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
      setReplies(prev => [...prev, res.data])
      setReplyContent('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setReplyError(err.response?.data?.message ?? 'Could not post reply.')
    } finally { setReplyLoading(false) }
  }

  useSeoMeta({
    title: complaint ? `${complaint.title} — complaint against ${complaint.company?.name}` : undefined,
    description: complaint
      ? `Consumer complaint filed against ${complaint.company?.name} on Aus Fair Go. Category: ${complaint.category}. Status: ${complaint.status}. ${complaint.description?.slice(0, 120)}…`
      : undefined,
    url: `${window.location.origin}/complaints/${id}`,
  })

  useEffect(() => {
    if (!complaint) return
    const schemaId = 'schema-complaint'
    document.getElementById(schemaId)?.remove()
    const script = document.createElement('script')
    script.id = schemaId
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'UserReview',
      name: complaint.title, reviewBody: complaint.description,
      datePublished: complaint.created_at, dateModified: complaint.updated_at,
      url: `${window.location.origin}/complaints/${complaint.id}`,
      author: { '@type': 'Person', name: 'Anonymous Consumer' },
      itemReviewed: {
        '@type': 'Organization', name: complaint.company?.name,
        ...(complaint.company?.slug ? { url: `${window.location.origin}/companies/${complaint.company.slug}` } : {}),
      },
    })
    document.head.appendChild(script)
    return () => { document.getElementById(schemaId)?.remove() }
  }, [complaint])

  if (loading) return <LoadingSkeleton />
  if (error) return (
    <div className="max-w-2xl mx-auto py-24 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="font-display text-2xl font-semibold mb-2">Complaint not found</h2>
      <p className="text-[color:var(--color-muted)] text-sm mb-6">It may have been removed or made private.</p>
      <Link to="/" className="btn-secondary">Back to home</Link>
    </div>
  )

  const isOwner     = user?.id === complaint.consumer_id
  const isCompany   = user?.role === 'company_admin' && user?.company_id === complaint.company_id
  const isAdmin     = user?.role === 'admin'
  const hasResponse = !!complaint.response
  const hasFeedback = !!complaint.feedback
  const isClosed    = ['resolved', 'unresolved', 'expired'].includes(complaint.status)
  const canReply    = (isOwner || isCompany) && hasResponse && !isClosed
  const status      = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG.open
  const attachments = complaint.attachments ?? []
  const contact     = complaint.consumer_contact ?? null
  const showPrivate = isOwner || isCompany || (isAdmin && contact)

  const expiresAt  = complaint.expires_at ? new Date(complaint.expires_at) : null
  const daysLeft   = expiresAt ? Math.ceil((expiresAt - Date.now()) / 86400000) : null
  const showExpiry = daysLeft !== null && !isClosed && complaint.status === 'open' && !hasResponse

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-muted)] pt-1">
        <Link to="/" className="hover:text-[color:var(--color-ink)] transition">Home</Link>
        <span>/</span>
        <Link to={`/companies/${complaint.company?.slug}`} className="hover:text-[color:var(--color-ink)] transition truncate max-w-[160px]">
          {complaint.company?.name}
        </Link>
        <span>/</span>
        <span className="text-[color:var(--color-ink-2)]">Complaint #{complaint.id}</span>
      </div>

      {/* ── Private company panel ── */}
      {showPrivate && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid var(--color-eucalyptus)' }}>
          <div className="px-5 py-3 flex items-center gap-2.5"
            style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span className="text-sm font-semibold">
              {isAdmin ? 'Admin view — consumer details' : isOwner ? 'Your private complaint details' : 'Private — visible to your company only'}
            </span>
          </div>
          <div className="p-5 space-y-5" style={{ background: 'var(--color-eucalyptus-3)' }}>
            {contact && (
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--color-eucalyptus)' }}>
                  Consumer contact details
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Full name', value: contact.name, href: null },
                    { label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
                    { label: 'Phone', value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : null },
                  ].map(({ label, value, href }) => (
                    <div key={label} className="rounded-xl p-3.5" style={{ background: 'var(--color-card)', border: '1px solid var(--color-line)' }}>
                      <p className="text-[10px] uppercase tracking-widest text-[color:var(--color-muted)] mb-1">{label}</p>
                      {value && href ? (
                        <a href={href} className="font-semibold text-sm break-all hover:underline" style={{ color: 'var(--color-eucalyptus)' }}>
                          {value}
                        </a>
                      ) : (
                        <p className={`text-sm font-semibold ${value ? 'text-[color:var(--color-ink)]' : 'italic text-[color:var(--color-muted)]'}`}>
                          {value ?? 'Not provided'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--color-eucalyptus)' }}>
                  Attachments ({attachments.length})
                </p>
                <div className="flex flex-wrap gap-3">
                  {attachments.map(att => (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                      className="group relative block rounded-xl overflow-hidden border hover:shadow-lg transition"
                      style={{ borderColor: 'var(--color-line)' }}>
                      {att.mime_type?.startsWith('image/') ? (
                        <div className="w-28 h-28">
                          <img src={att.url} alt={att.original_name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition flex items-center justify-center">
                            <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="w-28 h-28 bg-white flex flex-col items-center justify-center gap-2 px-2 group-hover:bg-[color:var(--color-paper-2)] transition">
                          <svg className="w-8 h-8 text-[color:var(--color-clay)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                          </svg>
                          <span className="text-[10px] text-center text-[color:var(--color-muted)] leading-tight line-clamp-2 px-1">{att.original_name}</span>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
                <p className="text-xs text-[color:var(--color-muted)] mt-2">Click any file to open or download.</p>
              </div>
            )}

            <p className="text-[11px] opacity-60 pt-1" style={{ color: 'var(--color-eucalyptus)' }}>
              🔒 {isOwner && !isCompany && !isAdmin
                ? 'Only you and the company receiving this complaint can see these details.'
                : 'This information is confidential and never shown to the public.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Expiry warning ── */}
      {showExpiry && (
        <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 text-sm ${
          daysLeft <= 2
            ? 'bg-[color:var(--color-clay-soft)] border-[color:var(--color-clay)] text-[color:var(--color-clay)]'
            : 'border-[color:var(--color-ochre)] text-[color:var(--color-ink-2)]'
        }`} style={daysLeft > 2 ? { background: '#FDF6E8' } : {}}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>
            {daysLeft > 0
              ? <><strong>{daysLeft} day{daysLeft === 1 ? '' : 's'}</strong> left for the company to respond before this complaint expires.</>
              : 'This complaint expires today if not answered.'}
          </span>
        </div>
      )}

      {/* ── Header card ── */}
      <div className="card p-6 sm:p-8">
        {/* Company + status row */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo company={complaint.company} size="md" />
            <div className="min-w-0">
              <Link to={`/companies/${complaint.company?.slug}`}
                className="font-semibold text-sm hover:underline transition truncate block"
                style={{ color: 'var(--color-eucalyptus)' }}>
                {complaint.company?.name}
              </Link>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                  style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-2)', border: '1px solid var(--color-line)' }}>
                  {CATEGORY_ICONS[complaint.category]} {complaint.category?.replace('_', ' ')}
                </span>
                {complaint.company?.abn_verified && complaint.company?.claimed && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: '#3B4B7A', background: '#DAE0EE' }}>
                    <Icon name="verified" size={10} /> ABN Verified
                  </span>
                )}
                {complaint.company?.claimed && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)' }}>
                    ✅ Actively Managed
                  </span>
                )}
                {complaint.company?.verified_badge && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: '#6B3FA0', background: '#EDE7F6' }}>
                    <Icon name="verified" size={10} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className={`badge ${status.badge} shrink-0`}>{status.label}</span>
        </div>

        <h1 className="font-display text-xl sm:text-2xl font-semibold text-[color:var(--color-ink)] leading-snug mb-4">
          {complaint.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-[color:var(--color-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink)' }}>
              {complaint.consumer?.name?.[0]?.toUpperCase()}
            </span>
            <span className="font-medium text-[color:var(--color-ink-2)]">{complaint.consumer?.name}</span>
            {complaint.consumer?.id_verification_status === 'approved' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: 'var(--color-eucalyptus)', background: 'var(--color-eucalyptus-3)' }}>
                <Icon name="verified" size={10} /> ID Verified
              </span>
            )}
          </span>
          <span>·</span>
          <span>{new Date(complaint.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          {!complaint.is_public && (
            <><span>·</span><span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> Private</span></>
          )}
          <AiReviewedBadge moderation_status={complaint.moderation_status} />
        </div>
      </div>

      {/* ── Complaint body ── */}
      <div className="card p-6 sm:p-8 space-y-6">
        {complaint.moderation_edited && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs"
            style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)' }}>
            <span className="shrink-0">✏️</span>
            <span className="text-[color:var(--color-ink-2)]">
              <strong>Edited by Aus Fair Go</strong> — Some content was automatically removed to comply with our community guidelines.
            </span>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="caps mb-2">What happened</h3>
          <p className="text-[color:var(--color-ink-2)] whitespace-pre-wrap leading-relaxed text-sm">
            {complaint.description}
          </p>
        </div>

        {complaint.expected_resolution && (
          <>
            <hr style={{ borderColor: 'var(--color-line)' }} />
            <div>
              <h3 className="caps mb-2">Expected resolution</h3>
              <p className="text-[color:var(--color-ink-2)] whitespace-pre-wrap text-sm leading-relaxed">
                {complaint.expected_resolution}
              </p>
            </div>
          </>
        )}

        {/* Evidence grid */}
        {(complaint.incident_date || complaint.reference_number || (complaint.amount_involved > 0) || complaint.contact_attempted !== undefined) && (
          <>
            <hr style={{ borderColor: 'var(--color-line)' }} />
            <div>
              <h3 className="caps mb-3">Evidence &amp; details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {complaint.incident_date && (
                  <EvidenceCard icon="📅" label="Incident date">
                    {new Date(complaint.incident_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </EvidenceCard>
                )}
                {complaint.amount_involved > 0 && (
                  <EvidenceCard icon="💰" label="Amount">
                    ${Number(complaint.amount_involved).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </EvidenceCard>
                )}
                {complaint.reference_number && (
                  <EvidenceCard icon="🔢" label="Reference">
                    <span className="font-mono text-xs">{complaint.reference_number}</span>
                  </EvidenceCard>
                )}
                <EvidenceCard icon={complaint.contact_attempted ? '✅' : '❌'} label="Contacted first">
                  {complaint.contact_attempted ? 'Yes' : 'No'}
                </EvidenceCard>
              </div>
            </div>
          </>
        )}
      </div>


      {/* ── Company response ── */}
      {hasResponse && (
        <div className="card p-6 sm:p-8" style={{ borderLeft: '4px solid var(--color-eucalyptus)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-eucalyptus-3)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--color-eucalyptus)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-[color:var(--color-ink)]">Response from {complaint.company?.name}</p>
              <p className="text-xs text-[color:var(--color-muted)]">
                {new Date(complaint.response.responded_at).toLocaleString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <p className="text-[color:var(--color-ink-2)] whitespace-pre-wrap leading-relaxed text-sm">
            {complaint.response.content}
          </p>
        </div>
      )}

      {/* ── Conversation thread ── */}
      {(replies.length > 0 || canReply) && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
            <svg className="w-4 h-4 text-[color:var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
            </svg>
            <span className="text-sm font-semibold text-[color:var(--color-ink)]">Follow-up conversation</span>
            {replies.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--color-paper-2)', color: 'var(--color-muted)' }}>
                {replies.length} message{replies.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="px-5 py-5 space-y-3" style={{ background: 'var(--color-paper-2)' }}>
            {replies.length === 0 && (
              <p className="text-xs text-[color:var(--color-muted)] text-center py-6">
                No messages yet — start the follow-up below.
              </p>
            )}
            {replies.map((reply, i) => {
              const isConsumer = reply.author_type === 'consumer'
              const prev = replies[i - 1]
              const showName = !prev || prev.author_type !== reply.author_type
              return (
                <div key={reply.id} className={`flex items-end gap-2 ${isConsumer ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mb-0.5 transition-opacity ${showName ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    style={isConsumer
                      ? { background: 'var(--color-paper)', border: '1px solid var(--color-line)', color: 'var(--color-ink)' }
                      : { background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
                    {reply.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex flex-col gap-0.5 max-w-[75%] ${isConsumer ? 'items-start' : 'items-end'}`}>
                    {showName && (
                      <span className="text-[11px] font-semibold px-1"
                        style={{ color: isConsumer ? 'var(--color-ink-2)' : 'var(--color-eucalyptus)' }}>
                        {isConsumer ? reply.user?.name : complaint.company?.name}
                      </span>
                    )}
                    <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      isConsumer
                        ? 'rounded-2xl rounded-bl-sm'
                        : 'rounded-2xl rounded-br-sm'
                    }`}
                      style={isConsumer
                        ? { background: 'var(--color-card)', border: '1px solid var(--color-line)', color: 'var(--color-ink)' }
                        : { background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
                      {reply.content}
                    </div>
                    <span className="text-[10px] px-1" style={{ color: 'var(--color-muted)' }}>
                      {new Date(reply.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {canReply && (
            <div className="border-t px-4 py-3" style={{ borderColor: 'var(--color-line)', background: 'var(--color-card)' }}>
              <form onSubmit={submitReply}>
                <div className="flex items-end gap-2">
                  <textarea
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(e) } }}
                    rows={1}
                    placeholder="Write a follow-up… (Enter to send)"
                    className="input resize-none flex-1 text-sm py-2.5 leading-snug"
                    style={{ minHeight: '42px', maxHeight: '120px', overflowY: 'auto' }}
                    maxLength={2000}
                  />
                  <button type="submit" disabled={replyLoading || !replyContent.trim()}
                    className="btn-primary shrink-0 h-[42px] px-4 text-sm">
                    {replyLoading ? '…' : 'Send'}
                  </button>
                </div>
                {replyError && <p className="text-xs mt-1.5" style={{ color: 'var(--color-clay)' }}>{replyError}</p>}
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── Resolution feedback ── */}
      {hasFeedback && (
        <div className="card p-6" style={{ borderLeft: `4px solid ${complaint.feedback.resolved ? 'var(--color-eucalyptus)' : 'var(--color-clay)'}` }}>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-2xl">{complaint.feedback.resolved ? '✅' : '❌'}</span>
            <div>
              <p className="font-semibold text-sm text-[color:var(--color-ink)]">
                {complaint.feedback.resolved ? 'Consumer marked this resolved' : 'Consumer marked this unresolved'}
              </p>
              <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                {complaint.feedback.consumer?.name && (
                  <span className="font-medium text-[color:var(--color-ink-2)]">{complaint.feedback.consumer.name}</span>
                )}
                {complaint.feedback.consumer?.name && complaint.feedback.created_at && ' · '}
                {complaint.feedback.created_at && new Date(complaint.feedback.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {complaint.feedback.rating && (
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(n => (
                <svg key={n} className="w-4 h-4" fill={n <= complaint.feedback.rating ? '#F59E0B' : 'var(--color-line)'} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
              <span className="text-xs text-[color:var(--color-muted)] ml-1">{complaint.feedback.rating}/5</span>
            </div>
          )}
          {complaint.feedback.would_deal_again !== null && complaint.feedback.would_deal_again !== undefined && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              complaint.feedback.would_deal_again ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {complaint.feedback.would_deal_again ? '👍 Would deal again' : '👎 Would not deal again'}
            </span>
          )}
          {complaint.feedback.comment && (
            <p className="text-sm italic mt-3 text-[color:var(--color-ink-2)]">"{complaint.feedback.comment}"</p>
          )}
        </div>
      )}

      {/* ── Company response form ── */}
      {isCompany && !hasResponse && (
        <CompanyResponseForm
          complaintId={complaint.id}
          consumerName={complaint.consumer_contact?.name || complaint.consumer?.name || ''}
          refNumber={complaint.reference_number || ''}
          companyName={complaint.company?.name || ''}
          category={complaint.category || 'other'}
          complaintDescription={complaint.description || ''}
          onSubmitted={response => setComplaint(c => ({ ...c, response, status: 'responded' }))}
        />
      )}

      {/* ── Owner close action ── */}
      {isOwner && hasResponse && !isClosed && (!hasFeedback || complaint.reopened_at) && (
        <div className="card p-6" style={{ background: '#FEF9EC', border: '1px solid var(--color-ochre)' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#F3E2C3' }}>
              <svg className="w-4 h-4" style={{ color: 'var(--color-ochre)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                {complaint.reopened_at ? 'The company replied to your follow-up' : 'The company has responded'}
              </p>
              <p className="text-xs text-[color:var(--color-muted)] mt-0.5 mb-4">
                {complaint.reopened_at
                  ? 'Update your verdict — only the latest rating counts towards their score.'
                  : 'Was your issue resolved? Let others know and update the company\'s score.'}
              </p>
              <Link to={`/complaints/${complaint.id}/resolve`} className="btn-primary text-sm">
                {complaint.reopened_at ? 'Update & close' : 'Close this complaint →'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  )
}

/* ── Evidence card ── */
function EvidenceCard({ icon, label, children }) {
  return (
    <div className="rounded-xl p-3.5 text-center" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-line)' }}>
      <p className="text-xl mb-1">{icon}</p>
      <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--color-muted)] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[color:var(--color-ink)]">{children}</p>
    </div>
  )
}

/* ── Skeleton ── */
function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse pt-2">
      <div className="h-3 bg-[color:var(--color-paper-2)] rounded w-1/3" />
      <div className="card p-8 space-y-4">
        <div className="flex gap-2"><div className="h-6 w-16 bg-[color:var(--color-paper-2)] rounded-full" /><div className="h-6 w-20 bg-[color:var(--color-paper-2)] rounded-full" /></div>
        <div className="h-7 bg-[color:var(--color-paper-2)] rounded w-3/4" />
        <div className="h-4 bg-[color:var(--color-paper-2)] rounded w-1/2" />
      </div>
      <div className="card p-8 space-y-3">
        <div className="h-3 bg-[color:var(--color-paper-2)] rounded w-1/5" />
        <div className="h-4 bg-[color:var(--color-paper-2)] rounded" />
        <div className="h-4 bg-[color:var(--color-paper-2)] rounded" />
        <div className="h-4 bg-[color:var(--color-paper-2)] rounded w-4/5" />
        <div className="grid grid-cols-4 gap-3 pt-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[color:var(--color-paper-2)] rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}
