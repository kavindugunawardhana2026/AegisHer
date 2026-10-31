import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { reducedMotion, useInView } from './motionUtils'

/** Fades, lifts and un-blurs its children when scrolled into view. `delay` is in ms. */
export function Reveal({
  children,
  delay = 0,
  className = '',
  variant = 'up',
}: {
  children: ReactNode
  delay?: number
  className?: string
  variant?: 'up' | 'left' | 'right' | 'zoom'
}) {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className={`reveal reveal-${variant} ${inView ? 'in' : ''} ${className}`} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  )
}

/** Counts from 0 to `value` once visible. */
export function CountUp({ value, suffix = '', duration = 1600 }: { value: number; suffix?: string; duration?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>(0.5)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView || reducedMotion()) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])
  return (
    <span ref={ref}>
      {inView && reducedMotion() ? value : n}
      {suffix}
    </span>
  )
}

/** Splits a headline into words that rise in one after another. */
export function StaggerWords({ text, className = '', start = 0 }: { text: string; className?: string; start?: number }) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {text.split(' ').map((w, i) => (
        <span key={`${w}-${i}`} aria-hidden className="word-rise" style={{ '--d': `${start + i * 90}ms` } as CSSProperties}>
          {w}
          {' '}
        </span>
      ))}
    </span>
  )
}
