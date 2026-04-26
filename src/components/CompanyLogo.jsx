import { useState } from 'react'

/**
 * Company logo with two-tier fallback:
 *   1. Google Favicon service (reliable, no API key, works for any domain)
 *   2. Initials avatar (when no website or favicon not found)
 *
 * Note: Clearbit logo API has been shut down — do not use.
 */
function googleFaviconUrl(website) {
  if (!website) return null
  const domain = website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()
  if (!domain) return null
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

export default function CompanyLogo({ company, size = 'md', className = '' }) {
  const sizes = {
    sm:  'w-8  h-8  text-xs',
    md:  'w-10 h-10 text-sm',
    lg:  'w-14 h-14 text-base',
    xl:  'w-20 h-20 text-xl',
  }
  const sizeClass = sizes[size] ?? sizes.md

  // Priority: uploaded logo_url first, then Google favicon from website
  const uploadedLogo = company?.logo_url?.startsWith('/storage/') ? company.logo_url : null
  const src          = uploadedLogo || googleFaviconUrl(company?.website) || company?.logo_url || null
  const initials     = (company?.name ?? '?').charAt(0).toUpperCase()

  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div className={`${sizeClass} rounded-xl bg-green-100 text-green-700 font-bold flex items-center justify-center shrink-0 ${className}`}>
        {initials}
      </div>
    )
  }

  return (
    <img
      key={src}
      src={src}
      alt={company?.name ?? ''}
      onError={() => setFailed(true)}
      className={`${sizeClass} rounded-xl object-contain bg-white border border-gray-100 p-1 shrink-0 ${className}`}
    />
  )
}
