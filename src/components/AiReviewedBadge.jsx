/**
 * AiReviewedBadge
 * Shows a small trust signal on complaints that have passed AI moderation.
 * Visible when moderation_status is 'approved' or 'edited'.
 */
export default function AiReviewedBadge({ moderation_status, size = 'sm' }) {
  if (!['approved', 'edited'].includes(moderation_status)) return null

  if (size === 'xs') {
    return (
      <span
        title="This complaint has been reviewed by our AI moderation system"
        className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full select-none"
        style={{
          background: 'var(--color-eucalyptus-3)',
          color: 'var(--color-eucalyptus)',
          border: '1px solid color-mix(in srgb, var(--color-eucalyptus) 20%, transparent)',
        }}
      >
        <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 1L2 3.5v5C2 12 5 14.5 8 15.5c3-1 6-3.5 6-7v-5L8 1z"
            fill="currentColor" opacity="0.18"
          />
          <path
            d="M8 1L2 3.5v5C2 12 5 14.5 8 15.5c3-1 6-3.5 6-7v-5L8 1z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
          />
          <path
            d="M5.5 8l1.8 1.8L10.5 6"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        AI Reviewed
      </span>
    )
  }

  // default 'sm'
  return (
    <span
      title="This complaint has been reviewed by our AI moderation system"
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full select-none"
      style={{
        background: 'var(--color-eucalyptus-3)',
        color: 'var(--color-eucalyptus)',
        border: '1px solid color-mix(in srgb, var(--color-eucalyptus) 20%, transparent)',
      }}
    >
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 1L2 3.5v5C2 12 5 14.5 8 15.5c3-1 6-3.5 6-7v-5L8 1z"
          fill="currentColor" opacity="0.18"
        />
        <path
          d="M8 1L2 3.5v5C2 12 5 14.5 8 15.5c3-1 6-3.5 6-7v-5L8 1z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        />
        <path
          d="M5.5 8l1.8 1.8L10.5 6"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      AI Reviewed
    </span>
  )
}
