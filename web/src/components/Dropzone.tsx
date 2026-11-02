import { useRef, useState } from 'react'

export function Dropzone({
  onFiles,
  multiple = false,
  accept = 'image/*',
  title,
  hint,
}: {
  onFiles: (files: File[]) => void
  multiple?: boolean
  accept?: string
  title: string
  hint?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const take = (list: FileList | null) => {
    if (!list?.length) return
    const files = Array.from(list)
    onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        take(e.dataTransfer.files)
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition focus-visible:outline-2 focus-visible:outline-brand-600 ${
        over ? 'border-brand-500 bg-brand-500/10' : 'border-white/15 bg-white/[0.02] hover:border-brand-500/50 hover:bg-brand-500/5'
      }`}
    >
      <svg className="h-11 w-11 text-brand-500 drop-shadow-[0_0_14px_rgba(95,250,123,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <input
        ref={input}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          take(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
