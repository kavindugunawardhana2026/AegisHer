import { useEffect, useRef, useState } from 'react'
import { cloakPhoto, type CloakResult, type Strength } from '../api'
import { BeforeAfter } from '../components/BeforeAfter'
import { Dropzone } from '../components/Dropzone'
import { btnPrimary, Button, Card, ErrorNote, PageHeader, ShieldIcon, Spinner } from '../components/ui'
import { useI18n } from '../i18n'

const STRENGTHS: Strength[] = ['low', 'medium', 'high']

export function CloakStudio() {
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [original, setOriginal] = useState<string | null>(null)
  const [strength, setStrength] = useState<Strength>('medium')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CloakResult | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => abort.current?.abort(), [])

  const choose = (f: File) => {
    if (original) URL.revokeObjectURL(original)
    if (result) URL.revokeObjectURL(result.url)
    setFile(f)
    setOriginal(URL.createObjectURL(f))
    setResult(null)
    setError(null)
    setShowDiff(false)
  }

  const run = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    abort.current = new AbortController()
    try {
      if (result) URL.revokeObjectURL(result.url)
      setResult(await cloakPhoto(file, strength, abort.current.signal))
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    abort.current?.abort()
    if (original) URL.revokeObjectURL(original)
    if (result) URL.revokeObjectURL(result.url)
    setFile(null)
    setOriginal(null)
    setResult(null)
    setError(null)
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <PageHeader eyebrow={t.navCloak} badge="01" title={t.cloakTitle} intro={t.cloakIntro} />

        {!original && <Dropzone onFiles={(f) => choose(f[0])} title={t.dropPhoto} hint={t.dropPhotoHint} />}

        {original && !result && (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
            <img src={original} alt={t.before} className={`mx-auto max-h-[70vh] w-auto object-contain transition ${busy ? 'opacity-60 blur-[1px]' : ''}`} />
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 text-center backdrop-blur-[2px]">
                <Spinner className="h-10 w-10 text-brand-500" />
                <p className="font-semibold text-ink">{t.working}</p>
                <p className="max-w-xs text-xs text-muted">{t.workingHint}</p>
              </div>
            )}
          </div>
        )}

        {original && result && (
          <div className="space-y-3">
            <BeforeAfter key={result.url} before={original} after={result.url} beforeLabel={t.before} afterLabel={t.after} showDiff={showDiff} />
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={showDiff} onChange={(e) => setShowDiff(e.target.checked)} />
              {t.showDiff}
            </label>
          </div>
        )}

        {error && <ErrorNote message={error} />}
      </div>

      <aside className="space-y-4">
        <Card>
          <h2 className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-brand-700 uppercase">{t.strength}</h2>
          <div className="space-y-2" role="radiogroup">
            {STRENGTHS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={strength === s}
                disabled={busy}
                onClick={() => setStrength(s)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition ${
                  strength === s ? 'border-brand-500/70 bg-brand-500/10 ring-2 ring-brand-500/15' : 'border-white/10 hover:border-white/25'
                }`}
              >
                <span className="block text-sm font-semibold text-ink">{t[s]}</span>
                <span className="block text-xs text-muted">{t[`${s}Desc`]}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {!result || result.metrics.strength !== strength ? (
              <Button onClick={run} disabled={!file || busy}>
                {busy ? <Spinner className="h-4 w-4" /> : <ShieldIcon className="h-4 w-4" />}
                {busy ? t.working : t.protect}
              </Button>
            ) : (
              <a
                href={result.url}
                download={result.filename}
                className={btnPrimary}
              >
                {t.download}
              </a>
            )}
            {original && (
              <Button variant="ghost" onClick={reset}>
                {t.another}
              </Button>
            )}
          </div>
        </Card>

        {result && <Metrics result={result} />}

        <Card>
          <h2 className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-brand-700 uppercase">{t.tipsTitle}</h2>
          <ul className="space-y-1.5 text-sm text-muted">
            <li>• {t.tip1}</li>
            <li>• {t.tip2}</li>
            <li>• {t.tip3}</li>
          </ul>
        </Card>
      </aside>
    </section>
  )
}

function Metrics({ result }: { result: CloakResult }) {
  const { t } = useI18n()
  const m = result.metrics
  // Prefer the identity encoder (ArcFace); fall back to whichever encoder ran.
  const key = 'arcface' in m.encoder_similarity ? 'arcface' : Object.keys(m.encoder_similarity)[0]
  const sim = m.encoder_similarity[key] ?? 1
  const simJpeg = m.encoder_similarity_after_jpeg80[key] ?? sim
  const pct = (v: number) => `${Math.round(Math.max(0, v) * 100)}%`
  const worst = Math.max(sim, simJpeg)
  const level = worst < 0.2 ? 'strong' : worst < 0.4 ? 'moderate' : 'weak'
  const levelText = { strong: t.protectionStrong, moderate: t.protectionModerate, weak: t.protectionWeak }[level]
  const levelCls = { strong: 'bg-emerald-500/12 text-emerald-300', moderate: 'bg-amber-500/12 text-amber-200', weak: 'bg-red-500/12 text-red-300' }[level]
  const quality = m.psnr_db >= 40 ? t.invisible : m.psnr_db >= 35 ? t.verySubtle : t.subtle

  return (
    <Card>
      <div className={`mb-4 rounded-xl px-3 py-2 text-sm font-semibold ${levelCls}`}>{levelText}</div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted" title={t.identityMatchHelp}>
            {t.identityMatch} {key !== 'arcface' && <span className="text-xs">({key})</span>}
          </dt>
          <dd className="mt-1">
            <span className="text-3xl font-extrabold text-ink">{pct(sim)}</span>
            <span className="ml-2 text-xs text-muted">
              {pct(simJpeg)} {t.afterCompression}
            </span>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-gradient-to-r from-gold to-brand-500" style={{ width: pct(sim) }} />
            </div>
            <p className="mt-1 text-xs text-muted">{t.identityMatchHelp}</p>
          </dd>
        </div>
        <Row label={t.visualQuality} value={`${quality} · ${m.psnr_db.toFixed(1)} dB`} />
        <Row label={t.facesFound} value={String(m.faces_detected)} />
        {m.faces_detected === 0 && <p className="text-xs text-muted">{t.noFaces}</p>}
        {m.metadata_stripped && <Row label={t.metaStripped} value="✓" />}
        <p className="pt-1 text-[11px] text-muted">
          {m.surrogates.join(' + ')} · {m.steps}/{m.max_steps} steps · ε {m.epsilon_255}/255 · {m.seconds}s on {m.device}
        </p>
      </dl>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  )
}
