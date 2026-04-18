import { useState } from 'react'

/**
 * Company logo with three-tier fallback:
 *   1. logo_url (company-uploaded)
 *   2. Google Favicon service (high-res, reliable, no API key needed)
 *   3. Initials avatar
 */
function googleLogoUrl(website) {
  if (!website) return null
  // Strip protocol if present, keep just the domain
  const domain = website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
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

  const primarySrc = company?.logo_url || googleLogoUrl(company?.website)
  const initials   = (company?.name ?? '?').charAt(0).toUpperCase()

  const [src, setSrc]       = useState(primarySrc)
  const [failed, setFailed] = useState(!primarySrc)

  const handleError = () => {
    // If Clearbit failed and we haven't fallen back yet, try nothing more — show initials
    setFailed(true)
  }

  if (failed || !src) {
    return (
      <div className={`${sizeClass} rounded-xl bg-green-100 text-green-700 font-bold flex items-center justify-center shrink-0 ${className}`}>
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={company?.name ?? ''}
      onError={handleError}
      className={`${sizeClass} rounded-xl object-contain bg-white border border-gray-100 p-1 shrink-0 ${className}`}
    />
  )
}
