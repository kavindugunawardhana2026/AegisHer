import { useEffect, useRef, useState } from 'react'

/** Drag-to-compare slider. Optionally shows the amplified pixel difference instead of the "after" image. */
export function BeforeAfter({
  before,
  after,
  beforeLabel,
  afterLabel,
  showDiff,
}: {
  before: string
  after: string
  beforeLabel: string
  afterLabel: string
  showDiff: boolean
}) {
  const [pos, setPos] = useState(50)
  const [diffUrl, setDiffUrl] = useState<string | null>(null)
  const [ratio, setRatio] = useState<number | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!showDiff || diffUrl) return
    let cancelled = false
    ;(async () => {
      const [a, b] = await Promise.all([loadImage(before), loadImage(after)])
      const w = Math.min(a.naturalWidth, 1600)
      const h = Math.round((a.naturalHeight / a.naturalWidth) * w)
      const ca = paint(a, w, h)
      const cb = paint(b, w, h)
      const da = ca.getImageData(0, 0, w, h)
      const db = cb.getImageData(0, 0, w, h)
      for (let i = 0; i < da.data.length; i += 4) {
        for (let c = 0; c < 3; c++) da.data[i + c] = Math.min(255, 128 + (db.data[i + c] - da.data[i + c]) * 12)
      }
      ca.putImageData(da, 0, 0)
      const blob = await new Promise<Blob | null>((r) => ca.canvas.toBlob(r, 'image/png'))
      if (!blob || cancelled) return
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setDiffUrl(url)
    })()
    return () => {
      cancelled = true
    }
  }, [showDiff, before, after, diffUrl])

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])

  const right = showDiff && diffUrl ? diffUrl : after

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 select-none"
      style={ratio ? { aspectRatio: String(ratio) } : undefined}
    >
      <img
        src={right}
        alt={afterLabel}
        className="block h-full w-full object-contain"
        draggable={false}
        onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
      />
      <img
        src={before}
        alt={beforeLabel}
        className="absolute inset-0 block h-full w-full object-contain"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(31,22,48,0.15)]" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-600 shadow-md">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m9 6-6 6 6 6M15 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">{beforeLabel}</span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-brand-600/90 px-2.5 py-1 text-xs font-medium text-white">{afterLabel}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`${beforeLabel} / ${afterLabel}`}
        className="slider-overlay absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  )
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function paint(img: HTMLImageElement, w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  return ctx
}
