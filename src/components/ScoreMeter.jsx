import { useState, useEffect, useMemo } from 'react'
import Icon from './Icon'

/**
 * Animated 270° arc score meter with tick marks.
 * Band-driven color (excellent/good/regular/poor/not_rated).
 */
const BAND = {
  excellent: { label: 'Excellent', text: 'var(--color-eucalyptus)', ring: '#2F5D4C' },
  good:      { label: 'Good',      text: '#4A6B4E',                  ring: '#6B8B5A' },
  regular:   { label: 'Regular',   text: '#8A5A1F',                  ring: '#D8A24A' },
  poor:      { label: 'Poor',      text: 'var(--color-clay)',        ring: '#A54A2C' },
  not_rated: { label: 'Not rated', text: 'var(--color-muted)',       ring: 'var(--color-line)' },
}

export default function ScoreMeter({ score = 0, band = 'not_rated', size = 220, hideLabel = false, scoreOnly = false }) {
  const b = BAND[band] ?? BAND.not_rated
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const startAngle = 135
  const sweep = 270
  const target = band === 'not_rated' ? 0 : Math.max(0, Math.min(1, score / 100))

  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 900)
      const eased = 1 - Math.pow(1 - k, 3)
      setAnimated(eased * target)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])

  const polar = (a) => {
    const rad = (a - 90) * Math.PI / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
  }
  const arcPath = (frac) => {
    const a0 = startAngle
    const a1 = startAngle + sweep * frac
    const [x0, y0] = polar(a0)
    const [x1, y1] = polar(a1)
    const large = sweep * frac > 180 ? 1 : 0
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
  }

  const ticks = useMemo(() => {
    const arr = []
    for (let i = 0; i <= 20; i++) {
      const a = startAngle + (sweep * i / 20)
      const [x1, y1] = polar(a)
      const rad = (a - 90) * Math.PI / 180
      const inner = r - (i % 5 === 0 ? 10 : 5)
      const x2 = cx + inner * Math.cos(rad)
      const y2 = cy + inner * Math.sin(rad)
      arr.push(
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={i % 5 === 0 ? 'var(--color-ink)' : 'var(--color-line)'}
          strokeWidth={i % 5 === 0 ? 1 : 0.5}
        />
      )
    }
    return arr
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={arcPath(1)} stroke="var(--color-line-2)" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={arcPath(animated)} stroke={b.ring} strokeWidth="10" fill="none" strokeLinecap="round" />
        {ticks}
      </svg>
      {!hideLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          {!scoreOnly && <div className="caps mb-1" style={{ color: b.text }}>{b.label}</div>}
          <div
            className="font-display font-semibold leading-none"
            style={{ fontSize: scoreOnly ? size * 0.32 : size * 0.29, color: 'var(--color-ink)' }}
          >
            {band === 'not_rated' ? '—' : Math.round(animated * 100)}
          </div>
          {!scoreOnly && band !== 'not_rated' && (
            <div className="text-xs text-[color:var(--color-muted)] mt-1">out of 100</div>
          )}
        </div>
      )}
    </div>
  )
}

export { BAND }
