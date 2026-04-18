import { useEffect } from 'react'

const DEFAULT_TITLE       = 'Aus Fair Go — public consumer accountability'
const DEFAULT_DESCRIPTION = 'Aus Fair Go helps Australian consumers resolve complaints and hold businesses accountable through transparent public records.'
const DEFAULT_IMAGE       = 'https://ausfairgo.com.au/og-default.png' // swap for prod URL

/**
 * Sets <title>, meta description, and Open Graph / Twitter card tags.
 * Resets to defaults when the component unmounts.
 *
 * @param {Object} opts
 * @param {string} opts.title        - Page <title> (will be appended with " | Aus Fair Go")
 * @param {string} [opts.description]
 * @param {string} [opts.image]      - OG image URL
 * @param {string} [opts.url]        - Canonical URL (defaults to window.location.href)
 * @param {string} [opts.type]       - OG type, defaults to 'website'
 */
export default function useSeoMeta({ title, description, image, url, type = 'website' } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Aus Fair Go` : DEFAULT_TITLE
    const desc      = description ?? DEFAULT_DESCRIPTION
    const img       = image ?? DEFAULT_IMAGE
    const canonical = url ?? window.location.href

    // <title>
    document.title = fullTitle

    // Helper to upsert a <meta> tag
    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        const [attrName, attrVal] = selector.replace('meta[', '').replace(']', '').split('="')
        el.setAttribute(attrName, attrVal.replace('"', ''))
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }

    setMeta('meta[name="description"]',         'content', desc)
    setMeta('meta[property="og:title"]',        'content', fullTitle)
    setMeta('meta[property="og:description"]',  'content', desc)
    setMeta('meta[property="og:image"]',        'content', img)
    setMeta('meta[property="og:url"]',          'content', canonical)
    setMeta('meta[property="og:type"]',         'content', type)
    setMeta('meta[property="og:site_name"]',    'content', 'Aus Fair Go')
    setMeta('meta[name="twitter:card"]',        'content', 'summary_large_image')
    setMeta('meta[name="twitter:title"]',       'content', fullTitle)
    setMeta('meta[name="twitter:description"]', 'content', desc)
    setMeta('meta[name="twitter:image"]',       'content', img)

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', canonical)

    return () => {
      document.title = DEFAULT_TITLE
      document.querySelector('meta[name="description"]')?.setAttribute('content', DEFAULT_DESCRIPTION)
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', DEFAULT_TITLE)
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', DEFAULT_DESCRIPTION)
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', DEFAULT_IMAGE)
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', window.location.origin)
    }
  }, [title, description, image, url, type])
}
