import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useI18n } from '../i18n'

type Variant = 'primary' | 'secondary' | 'ghost'

/** White pill with soft glow, like the reference site's "Register" button. Also used for download links. */
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#06140a] shadow-[0_10px_30px_-10px_rgba(255,255,255,0.45)] transition hover:-translate-y-px hover:bg-[#dcfee3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary:
      'bg-white text-[#06140a] shadow-[0_10px_30px_-10px_rgba(255,255,255,0.45)] hover:-translate-y-px hover:bg-[#dcfee3] disabled:translate-y-0 disabled:bg-white/25 disabled:text-white/50 disabled:shadow-none',
    secondary: 'border border-white/12 bg-white/5 text-ink hover:border-white/25 hover:bg-white/10 disabled:opacity-50',
    ghost: 'text-brand-700 hover:bg-white/5 disabled:opacity-50',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card-surface rounded-3xl p-5 sm:p-6 ${className}`}>{children}</div>
}

/** Small uppercase pill label shown above section titles. */
export function Eyebrow({ children, badge }: { children: ReactNode; badge?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] py-1 pr-1 pl-3.5 text-[11px] font-medium tracking-[0.18em] text-ink/90 uppercase backdrop-blur">
      {children}
      {badge ? (
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold tracking-normal text-[#06140a] normal-case">{badge}</span>
      ) : (
        <span className="pr-2" />
      )}
    </span>
  )
}

/** Page title block: eyebrow chip, big bold headline, intro copy. */
export function PageHeader({
  eyebrow,
  badge,
  title,
  intro,
  center = false,
}: {
  eyebrow: string
  badge?: string
  title: string
  intro?: string
  center?: boolean
}) {
  return (
    <header className={center ? 'text-center' : ''}>
      <Eyebrow badge={badge}>{eyebrow}</Eyebrow>
      <h1 className="mt-4 text-3xl leading-[1.08] font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
      {intro && <p className={`mt-3 max-w-2xl text-base leading-relaxed text-muted ${center ? 'mx-auto' : ''}`}>{intro}</p>}
    </header>
  )
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-brand-600">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none'

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  )
}

export function CopyText({ value, display }: { value: string; display?: string }) {
  const { t } = useI18n()
  const [done, setDone] = useState(false)
  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <code className="truncate font-mono text-xs text-ink" title={value}>
        {display ?? value}
      </code>
      <button
        type="button"
        className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-brand-700 hover:bg-white/5"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
            setDone(true)
            setTimeout(() => setDone(false), 1500)
          } catch {
            /* clipboard blocked */
          }
        }}
      >
        {done ? t.copied : t.copy}
      </button>
    </span>
  )
}

export function ShieldIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <path d="M16 2 4 6.5v8.2c0 7.3 5.1 13.4 12 15.3 6.9-1.9 12-8 12-15.3V6.5L16 2Z" fill="currentColor" />
      <path d="m11 16 3.5 3.5L21.5 12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
