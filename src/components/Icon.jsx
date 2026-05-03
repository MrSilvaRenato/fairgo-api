/**
 * Aus Fair Go icon system — stroke-based, 24px grid, currentColor.
 * Replaces emoji across the app for a consistent professional feel.
 */
export default function Icon({ name, size = 16, className = '', strokeWidth = 1.6 }) {
  const s = size
  const common = {
    width: s, height: s, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
    className,
    'aria-hidden': true,
  }
  switch (name) {
    case 'search':   return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
    case 'arrow-r':  return <svg {...common}><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
    case 'arrow-ul': return <svg {...common}><path d="M7 17 17 7M9 7h8v8"/></svg>
    case 'arrow-up': return <svg {...common}><path d="M12 19V5m-7 7 7-7 7 7"/></svg>
    case 'arrow-dn': return <svg {...common}><path d="M12 5v14m7-7-7 7-7-7"/></svg>
    case 'check':    return <svg {...common}><path d="M20 6 9 17l-5-5"/></svg>
    case 'x':        return <svg {...common}><path d="M18 6 6 18M6 6l12 12"/></svg>
    case 'clock':    return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
    case 'share':    return <svg {...common}><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/></svg>
    case 'flag':     return <svg {...common}><path d="M4 22V4m0 0h12l-2 4 2 4H4"/></svg>
    case 'pin':      return <svg {...common}><path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
    case 'verified': return <svg {...common}><path d="m9 12 2 2 4-4"/><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z"/></svg>
    case 'user':     return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
    case 'thumb':    return <svg {...common}><path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h3M7 11V5a3 3 0 0 1 6 0v6h5a3 3 0 0 1 3 3l-1.5 5a3 3 0 0 1-3 2.5H7"/></svg>
    case 'reply':    return <svg {...common}><path d="M9 17 4 12l5-5M4 12h11a5 5 0 0 1 5 5v3"/></svg>
    case 'chevron-r':return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>
    case 'chevron-d':return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>
    case 'building': return <svg {...common}><path d="M4 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M4 22h12M4 22H2m14 0h6V10a2 2 0 0 0-2-2h-4M8 6h4M8 10h4M8 14h4"/></svg>
    case 'sparkle':  return <svg {...common}><path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>
    case 'globe':    return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>
    case 'menu':     return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    case 'plus':     return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>
    case 'upload':    return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    case 'chevron-d': return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>
    case 'chart':     return <svg {...common}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
    case 'settings':  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    case 'billing':   return <svg {...common}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
    case 'user':      return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    case 'logout':    return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'bell':      return <svg {...common}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
    default: return null
  }
}
