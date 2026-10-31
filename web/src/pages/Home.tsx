import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { CountUp, Reveal, StaggerWords } from '../components/motion'
import { reducedMotion as prefersReduced, spotlight, useInView } from '../components/motionUtils'
import { btnPrimary, Eyebrow, ShieldIcon } from '../components/ui'
import { useI18n } from '../i18n'
import { homeText, type HomeText } from './homeText'

const ghostBtn =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-ink backdrop-blur transition hover:-translate-y-px hover:border-white/30 hover:bg-white/10'

export function Home() {
  const { lang, t } = useI18n()
  const h = homeText[lang]
  return (
    <div className="overflow-x-clip">
      <Hero h={h} />
      <Marquee items={h.marquee} />
      <WhatWeDo h={h} />
      <Tools h={h} />
      <Demo h={h} />
      <Journey h={h} />
      <Privacy h={h} />
      <Faq h={h} />
      <FinalCta h={h} danger={t.danger} notAlone={t.notAlone} />
    </div>
  )
}

function Section({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 ${className}`}>
      {children}
    </section>
  )
}

function SectionHead({ eyebrow, title, body, center = true }: { eyebrow: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-xl'}>
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <Reveal delay={90}>
        <h2 className="mt-5 text-3xl leading-[1.08] font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h2>
      </Reveal>
      {body && (
        <Reveal delay={180}>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{body}</p>
        </Reveal>
      )}
    </div>
  )
}

/* ---------------- Hero ---------------- */

function Hero({ h }: { h: HomeText }) {
  const ref = useRef<HTMLElement>(null)
  const onMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--px', String((e.clientX - r.left) / r.width - 0.5))
    el.style.setProperty('--py', String((e.clientY - r.top) / r.height - 0.5))
  }
  return (
    <section ref={ref} onMouseMove={onMove} className="hero relative -mt-24 flex min-h-[100svh] items-center overflow-hidden pt-28 pb-20">
      <div className="hero-word" aria-hidden>
        AEGIS
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="text-center lg:text-left">
          <div className="fade-up" style={{ '--d': '0ms' } as CSSProperties}>
            <Eyebrow badge="2026">AegisHer</Eyebrow>
          </div>
          <h1 className="mt-6 text-5xl leading-[1.02] font-extrabold tracking-tight text-white sm:text-7xl">
            <StaggerWords text={h.heroTitle} start={120} />
          </h1>
          <p
            className="gold-text gold-shimmer font-display fade-up mx-auto mt-6 max-w-xl text-sm leading-relaxed tracking-[0.16em] uppercase sm:text-base lg:mx-0"
            style={{ '--d': '520ms' } as CSSProperties}
          >
            {h.heroGold}
          </p>
          <p className="fade-up mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg lg:mx-0" style={{ '--d': '650ms' } as CSSProperties}>
            {h.heroBody}
          </p>
          <div className="fade-up mt-8 flex flex-wrap justify-center gap-3 lg:justify-start" style={{ '--d': '780ms' } as CSSProperties}>
            <a href="#cloak" className={`${btnPrimary} px-6 py-3 text-base`}>
              <ShieldIcon className="h-5 w-5 text-brand-600" />
              {h.ctaShield}
            </a>
            <a href="#report" className={`${ghostBtn} px-6 py-3 text-base`}>
              {h.ctaReport}
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>

        <div className="fade-up order-first lg:order-none" style={{ '--d': '300ms' } as CSSProperties}>
          <ShieldOrb />
        </div>
      </div>

      <a href="#what" className="fade-up absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.3em] text-muted uppercase sm:flex" style={{ '--d': '1200ms' } as CSSProperties}>
        <span className="flex h-9 w-5 justify-center rounded-full border border-white/25 pt-1.5">
          <span className="scroll-dot h-1.5 w-1 rounded-full bg-white" />
        </span>
        {h.scroll}
      </a>
    </section>
  )
}

function ShieldOrb() {
  return (
    <div className="orb-parallax relative mx-auto aspect-square w-60 sm:w-80 lg:w-[26rem]" aria-hidden>
      {/* soft glow */}
      <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(255,70,96,0.55),rgba(233,16,51,0.12)_55%,transparent_70%)] blur-2xl" />
      {/* expanding pulses */}
      {[0, 1.1, 2.2].map((d) => (
        <span key={d} className="pulse-ring absolute inset-[18%] rounded-full border border-brand-500/40" style={{ '--d': `${d}s` } as CSSProperties} />
      ))}
      {/* rotating rings */}
      <div className="spin-slow absolute inset-0">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(241,201,155,0.35)" strokeWidth="0.6" strokeDasharray="2 6" />
          <circle cx="100" cy="4" r="2.6" fill="#f1c99b" />
          <circle cx="196" cy="100" r="1.6" fill="#ff5a6b" />
        </svg>
      </div>
      <div className="spin-rev absolute inset-[9%]">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,90,107,0.45)" strokeWidth="0.8" strokeDasharray="60 18 4 18" />
          <circle cx="4" cy="100" r="2.4" fill="#ff8a97" />
        </svg>
      </div>
      <div className="spin-slow absolute inset-[20%] [animation-duration:14s]">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="100" cy="196" r="3" fill="#fff" opacity="0.8" />
        </svg>
      </div>
      {/* the shield */}
      <div className="float absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-[38%] w-[38%] items-center justify-center rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#3a0f1d] to-[#12090f] shadow-[0_30px_80px_-20px_rgba(233,16,51,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <ShieldIcon className="h-[62%] w-[62%] text-brand-600 drop-shadow-[0_0_24px_rgba(255,90,107,0.8)]" />
        </div>
      </div>
    </div>
  )
}

/* ---------------- Marquee ---------------- */

function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items]
  return (
    <div className="relative z-10 -my-2 -rotate-[1.5deg] border-y border-white/10 bg-gradient-to-r from-[#561b33] via-[#8f1628] to-[#561b33] py-4 shadow-[0_20px_60px_-20px_rgba(233,16,51,0.6)]">
      <div className="marquee overflow-hidden">
        <ul className="marquee-track gap-10 pr-10">
          {row.map((it, i) => (
            <li key={i} className="flex items-center gap-10 text-sm font-bold tracking-[0.2em] whitespace-nowrap text-white uppercase sm:text-base" aria-hidden={i >= items.length}>
              {it}
              <span className="text-gold">✦</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ---------------- What we do + stats ---------------- */

function WhatWeDo({ h }: { h: HomeText }) {
  return (
    <Section id="what" className="pt-28 sm:pt-36">
      <SectionHead eyebrow={h.whatEyebrow} title={h.whatTitle} body={h.whatBody} />
      <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {h.stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 110} variant="zoom">
            <div onMouseMove={spotlight} className="spot card-surface h-full rounded-3xl p-5 text-center transition hover:-translate-y-1 sm:p-6">
              <div className="gold-text text-4xl font-extrabold sm:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-2 text-sm text-muted">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

/* ---------------- Tools: stacked card deck ---------------- */

function Tools({ h }: { h: HomeText }) {
  const n = h.tools.length
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [ref, inView] = useInView<HTMLDivElement>(0.3)
  const touchX = useRef<number | null>(null)
  const go = (d: number) => setIdx((i) => (i + d + n) % n)

  useEffect(() => {
    if (!inView || paused || prefersReduced()) return
    const id = setInterval(() => setIdx((i) => (i + 1) % n), 4200)
    return () => clearInterval(id)
  }, [inView, paused, n])

  return (
    <Section>
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <SectionHead eyebrow={h.toolsEyebrow} title={h.toolsTitle} body={h.toolsBody} center={false} />

        <div
          ref={ref}
          className="relative mx-auto w-full max-w-md"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
            touchX.current = null
          }}
        >
          <Reveal variant="right">
            <div className="relative h-[400px] sm:h-[420px]" aria-roledescription="carousel">
              {h.tools.map((tool, k) => {
                const off = (k - idx + n) % n
                const front = off === 0
                return (
                  <article
                    key={tool.title}
                    aria-hidden={!front}
                    className="deck-card card-surface absolute bottom-0 left-0 flex h-[320px] w-[84%] flex-col rounded-3xl p-6 sm:p-7"
                    style={{
                      transform: `translate(${off * 7}%, ${-off * 26}px) scale(${1 - off * 0.05}) rotate(${front ? -1.5 : off * 1.2}deg)`,
                      zIndex: n - off,
                      opacity: off > 3 ? 0 : 1,
                      filter: front ? 'none' : `brightness(${0.75 - off * 0.1})`,
                    }}
                  >
                    <span className="text-[11px] font-bold tracking-[0.2em] text-brand-500 uppercase">{tool.tag}</span>
                    <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{tool.title}</h3>
                    <p className={`mt-3 text-sm leading-relaxed text-muted transition-opacity duration-500 sm:text-base ${front ? 'opacity-100' : 'opacity-0'}`}>{tool.body}</p>
                    <a
                      href={tool.href}
                      tabIndex={front ? 0 : -1}
                      className="group mt-auto inline-flex items-center gap-2 self-end text-sm font-semibold text-brand-700"
                    >
                      {h.open}
                      <span className="text-xl transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                    </a>
                  </article>
                )
              })}
            </div>
          </Reveal>
          <div className="mt-6 flex items-center justify-center gap-4">
            <DeckBtn label={h.prev} onClick={() => go(-1)} dir="left" />
            <div className="flex gap-1.5">
              {h.tools.map((tool, k) => (
                <button
                  key={tool.title}
                  type="button"
                  aria-label={tool.title}
                  aria-current={k === idx}
                  onClick={() => setIdx(k)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${k === idx ? 'w-7 bg-gradient-to-r from-gold to-brand-500' : 'w-1.5 bg-white/25 hover:bg-white/50'}`}
                />
              ))}
            </div>
            <DeckBtn label={h.next} onClick={() => go(1)} dir="right" />
          </div>
        </div>
      </div>
    </Section>
  )
}

function DeckBtn({ label, onClick, dir }: { label: string; onClick: () => void; dir: 'left' | 'right' }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white transition hover:scale-105 hover:border-white/30"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d={dir === 'left' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

/* ---------------- Demo: how AI sees the photo ---------------- */

function useTween(target: number, duration = 900) {
  const [v, setV] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    if (prefersReduced()) return
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const val = a + (target - a) * (1 - Math.pow(1 - p, 3))
      from.current = val
      setV(val)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return prefersReduced() ? target : v
}

function Demo({ h }: { h: HomeText }) {
  const [shielded, setShielded] = useState(false)
  const [auto, setAuto] = useState(true)
  const [ref, inView] = useInView<HTMLDivElement>(0.35)
  const match = useTween(shielded ? 12 : 94)

  useEffect(() => {
    if (!inView || !auto || prefersReduced()) return
    const id = setInterval(() => setShielded((s) => !s), 3200)
    return () => clearInterval(id)
  }, [inView, auto])

  const pick = (s: boolean) => {
    setAuto(false)
    setShielded(s)
  }

  return (
    <Section>
      <div ref={ref} className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
        <Reveal variant="left" className="order-last lg:order-none">
          <div className={`scan-frame card-surface relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] ${shielded ? 'is-shielded' : ''}`}>
            <FaceArt shielded={shielded} />
            <div className="scan-line" />
            {/* tabs */}
            <div className="absolute top-4 left-1/2 flex -translate-x-1/2 rounded-full bg-black/50 p-1 text-xs font-semibold backdrop-blur">
              {[false, true].map((s) => (
                <button
                  key={String(s)}
                  type="button"
                  onClick={() => pick(s)}
                  aria-pressed={shielded === s}
                  className={`rounded-full px-3.5 py-1.5 transition ${shielded === s ? 'bg-white text-[#14070c]' : 'text-white/70 hover:text-white'}`}
                >
                  {s ? h.shielded : h.original}
                </button>
              ))}
            </div>
            {/* readout */}
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-muted">{h.matchLabel}</span>
                <span className="text-3xl font-extrabold text-white tabular-nums">{Math.round(match)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-colors duration-700 ${shielded ? 'bg-emerald-400' : 'bg-gradient-to-r from-brand-600 to-brand-500'}`}
                  style={{ width: `${match}%` }}
                />
              </div>
              <p className={`mt-2 text-xs font-semibold transition-colors duration-700 ${shielded ? 'text-emerald-300' : 'text-brand-700'}`}>
                {shielded ? `✓ ${h.stranger}` : `● ${h.recognised}`}
              </p>
            </div>
          </div>
          <p className="mx-auto mt-3 max-w-sm text-center text-[11px] text-muted/80">{h.illustration}</p>
        </Reveal>

        <SectionHead eyebrow={h.demoEyebrow} title={h.demoTitle} body={h.demoBody} center={false} />
      </div>
    </Section>
  )
}

/** Abstract portrait with a face-recognition mesh. When shielded, noise appears and the mesh drifts off the face. */
function FaceArt({ shielded }: { shielded: boolean }) {
  const pts: [number, number][] = [
    [82, 118], [118, 118], [100, 140], [86, 160], [114, 160], [100, 166], [70, 104], [130, 104], [100, 96], [76, 146], [124, 146],
  ]
  const lines: [number, number][] = [
    [0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [6, 0], [7, 1], [6, 8], [7, 8], [0, 9], [1, 10], [9, 3], [10, 4],
  ]
  const shift = (i: number): [number, number] => (shielded ? [((i * 37) % 23) - 11, ((i * 53) % 19) - 9] : [0, 0])
  return (
    <svg viewBox="0 0 200 250" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="face-bg" cx="50%" cy="38%" r="70%">
          <stop offset="0" stopColor="#4a1527" />
          <stop offset="1" stopColor="#0d0910" />
        </radialGradient>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a38a" />
          <stop offset="1" stopColor="#8a5a4c" />
        </linearGradient>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3">
            <animate attributeName="seed" values="1;5;9;3;7" dur="0.8s" repeatCount="indefinite" />
          </feTurbulence>
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.4  0 0 0 0 0.5  0 0 0 0.9 0" />
        </filter>
      </defs>
      <rect width="200" height="250" fill="url(#face-bg)" />
      {/* hair + shoulders + face */}
      <path d="M40 250c4-40 28-62 60-62s56 22 60 62Z" fill="#2a1520" />
      <path d="M52 132c-6-52 18-82 48-82s54 30 48 82c-4 30-14 50-14 50H66s-10-20-14-50Z" fill="#1d0f16" />
      <ellipse cx="100" cy="132" rx="38" ry="48" fill="url(#skin)" opacity="0.9" />
      <rect x="90" y="172" width="20" height="22" rx="6" fill="#8a5a4c" />
      {/* adversarial noise */}
      <rect width="200" height="250" filter="url(#noise)" className="noise-layer" />
      {/* recognition box */}
      <g className="face-box" fill="none" strokeWidth="2" strokeLinecap="round">
        <path d="M58 80h-6v6M142 80h6v6M58 190h-6v-6M142 190h6v-6" />
      </g>
      {/* landmark mesh */}
      <g className="mesh">
        {lines.map(([a, b]) => {
          const [ax, ay] = shift(a)
          const [bx, by] = shift(b)
          return <line key={`${a}-${b}`} x1={pts[a][0] + ax} y1={pts[a][1] + ay} x2={pts[b][0] + bx} y2={pts[b][1] + by} strokeWidth="0.7" />
        })}
        {pts.map(([x, y], i) => {
          const [dx, dy] = shift(i)
          return <circle key={i} cx={x + dx} cy={y + dy} r="2.2" />
        })}
      </g>
    </svg>
  )
}

/* ---------------- Journey map ---------------- */

function Journey({ h }: { h: HomeText }) {
  return (
    <Section>
      <SectionHead eyebrow={h.journeyEyebrow} title={h.journeyTitle} body={h.journeyBody} />
      <Reveal variant="zoom" className="mt-14">
        <div className="journey-map card-surface relative overflow-hidden rounded-[2rem] px-5 pt-8 pb-12 sm:px-8">
          <div className="flex items-start justify-between">
            <span className="text-[10px] tracking-[0.25em] text-gold/80 uppercase">{h.fieldNotes}</span>
            <span className="flex flex-col items-center text-[9px] leading-none text-brand-500" aria-hidden>
              N<span className="my-1 text-base">✛</span>S
            </span>
          </div>

          <svg viewBox="0 0 1000 60" preserveAspectRatio="none" className="map-path mt-4 hidden h-12 w-full lg:block" aria-hidden>
            <path
              d="M0 40 C 120 0, 220 10, 320 34 S 520 60, 620 30 S 820 0, 1000 26"
              fill="none"
              stroke="#c99d4e"
              strokeWidth="2"
              strokeDasharray="6 8"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:mt-2 lg:grid-cols-5 lg:gap-4">
            {h.journey.map((step, i) => {
              const last = i === h.journey.length - 1
              return (
                <li key={step.title} className="h-full">
                  <Reveal delay={250 + i * 140} className="flex h-full flex-col items-center text-center">
                    <span className="bob" style={{ '--d': `${i * 0.35}s` } as CSSProperties}>
                      <span className={`pin-drop ${last ? 'pin-drop-last' : 'pin'}`}>
                        <span className="text-xs font-extrabold">{last ? '✦' : String(i + 1).padStart(2, '0')}</span>
                      </span>
                    </span>
                    <div
                      onMouseMove={spotlight}
                      className={`spot mt-5 flex w-full flex-1 flex-col rounded-2xl p-4 transition hover:-translate-y-1 ${
                        last ? 'border border-dashed border-white/15' : 'border border-white/8 bg-black/25'
                      }`}
                    >
                      <span className="text-[11px] font-bold tracking-[0.18em] text-gold uppercase">{step.tag}</span>
                      <h3 className="mt-2 font-bold text-ink">{step.title}</h3>
                      <p className="mt-1.5 text-sm text-muted">{step.body}</p>
                    </div>
                  </Reveal>
                </li>
              )
            })}
          </ol>

          <span className="absolute bottom-4 left-6 text-[10px] tracking-widest text-gold/60">06°54′ N</span>
          <span className="absolute right-6 bottom-4 text-[10px] tracking-widest text-gold/60">79°52′ E</span>
        </div>
      </Reveal>
    </Section>
  )
}

/* ---------------- Privacy ---------------- */

const privacyIcons = [
  // memory chip
  'M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 5h4v4h-4z',
  // location off
  'M12 21s-7-6.1-7-11.5A7 7 0 0 1 16.6 4.4M19 9.5c0 5.4-7 11.5-7 11.5M3 3l18 18',
  // user off
  'M16 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 8l4 4m0-4-4 4',
]

function Privacy({ h }: { h: HomeText }) {
  return (
    <Section>
      <SectionHead eyebrow={h.privacyEyebrow} title={h.privacyTitle} />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {h.privacy.map((p, i) => (
          <Reveal key={p.title} delay={i * 120}>
            <div onMouseMove={spotlight} className="spot card-surface group h-full rounded-3xl p-6 transition duration-500 hover:-translate-y-1.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600/30 to-brand-500/5 text-brand-500 ring-1 ring-brand-500/25 transition duration-500 group-hover:scale-110 group-hover:rotate-6">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={privacyIcons[i]} />
                </svg>
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

/* ---------------- FAQ ---------------- */

function Faq({ h }: { h: HomeText }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <Section className="max-w-3xl">
      <SectionHead eyebrow={h.faqEyebrow} title={h.faqTitle} />
      <div className="mt-12 space-y-3">
        {h.faq.map((f, i) => {
          const isOpen = open === i
          return (
            <Reveal key={f.q} delay={i * 80}>
              <div className={`card-surface rounded-2xl transition-colors duration-500 ${isOpen ? 'border-brand-500/30!' : ''}`}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink"
                >
                  {f.q}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg leading-none transition duration-500 ${
                      isOpen ? 'rotate-45 border-transparent bg-white text-[#14070c]' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                <div className={`acc ${isOpen ? 'open' : ''}`}>
                  <div>
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}

/* ---------------- Final call to action ---------------- */

function FinalCta({ h, danger, notAlone }: { h: HomeText; danger: string; notAlone: string }) {
  return (
    <Section className="pb-28">
      <Reveal variant="zoom">
        <div className="glow-border relative overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,70,96,0.45),rgba(43,6,14,0.9)_55%,#08070d)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <ShieldIcon className="float mx-auto h-14 w-14 text-brand-500 drop-shadow-[0_0_24px_rgba(255,90,107,0.7)]" />
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">{h.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted sm:text-lg">{h.ctaBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#cloak" className={`${btnPrimary} px-6 py-3 text-base`}>
              <ShieldIcon className="h-5 w-5 text-brand-600" />
              {h.ctaShield}
            </a>
            <a href="#report" className={`${ghostBtn} px-6 py-3 text-base`}>
              {h.ctaReport}
            </a>
          </div>
          <p className="mt-10 text-sm text-ink/80">{notAlone}</p>
          <a href="tel:119" className="mt-1 inline-block text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
            {danger}
          </a>
        </div>
      </Reveal>
    </Section>
  )
}
