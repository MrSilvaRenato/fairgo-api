import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import Icon from './Icon'

const TYPE_ICON = {
  complaint_reply:  { icon: 'reply',    color: 'var(--color-eucalyptus)' },
  company_response: { icon: 'building', color: 'var(--color-eucalyptus)' },
  new_complaint:    { icon: 'flag',     color: 'var(--color-clay)' },
  claim_approved:   { icon: 'verified', color: 'var(--color-eucalyptus)' },
  claim_rejected:   { icon: 'x',        color: 'var(--color-clay)' },
  verdict:          { icon: 'thumb',    color: 'var(--color-ochre-2)' },
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationPanel({ open, onClose, notifications, unreadCount, onMarkRead, onMarkAllRead, onClearAll }) {
  const panelRef = useRef(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll when panel is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleClick = useCallback((notif) => {
    if (!notif.read_at) onMarkRead(notif.id)
    onClose()
    if (notif.url) navigate(notif.url)
  }, [onMarkRead, onClose, navigate])

  if (!open) return null

  return (
    <>
      {/* Backdrop — semi-transparent on all screens */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications"
        className="fixed z-50 flex flex-col shadow-2xl
          inset-x-0 bottom-0 rounded-t-2xl
          sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-auto sm:w-[380px] sm:max-h-[calc(100vh-80px)] sm:rounded-2xl sm:mt-[72px] sm:mr-4"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-line)',
          maxHeight: '85vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b shrink-0"
          style={{ borderColor: 'var(--color-line)' }}>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>Notifications</h2>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-clay)', color: 'var(--color-paper)' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs px-2.5 py-1 rounded-lg transition-colors font-medium"
                style={{ color: 'var(--color-eucalyptus)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-eucalyptus-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs px-2.5 py-1 rounded-lg transition-colors font-medium"
                style={{ color: 'var(--color-muted)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-paper-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--color-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-paper-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              aria-label="Close notifications">
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--color-paper-2)', color: 'var(--color-muted)' }}>
                <Icon name="bell" size={22} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-ink-2)' }}>No notifications yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                You'll see complaint updates, responses, and more here.
              </p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
              {notifications.map((n) => {
                const meta  = TYPE_ICON[n.type] ?? { icon: 'bell', color: 'var(--color-muted)' }
                const unread = !n.read_at
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className="w-full text-left flex gap-3 px-4 py-3.5 transition-colors"
                      style={{
                        background: unread ? 'var(--color-eucalyptus-3)' : 'transparent',
                        cursor: n.url ? 'pointer' : 'default',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-paper-2)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = unread ? 'var(--color-eucalyptus-3)' : 'transparent' }}
                    >
                      {/* Icon dot */}
                      <div className="shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--color-paper-2)', color: meta.color }}>
                        <Icon name={meta.icon} size={15} strokeWidth={2} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug"
                          style={{ color: 'var(--color-ink)', fontWeight: unread ? 600 : 400 }}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-ink-2)' }}>
                            {n.body}
                          </p>
                        )}
                        <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                          {timeAgo(n.created_at)}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {unread && (
                        <div className="shrink-0 mt-2 w-2 h-2 rounded-full"
                          style={{ background: 'var(--color-eucalyptus)' }} />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
