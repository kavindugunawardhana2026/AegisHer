import { useEffect, useState } from 'react'
import {
  analyzeEvidence,
  generateReport,
  getContacts,
  type Contacts,
  type EvidenceItem,
  type Incident,
  type IncidentType,
  type ReportResult,
  type ThumbnailMode,
} from '../api'
import { Dropzone } from '../components/Dropzone'
import { btnPrimary, Button, Card, CopyText, ErrorNote, Field, inputCls, PageHeader, Spinner } from '../components/ui'
import { useI18n } from '../i18n'

const TYPES: IncidentType[] = [
  'deepfake',
  'non_consensual_image_sharing',
  'sextortion',
  'impersonation_fake_profile',
  'harassment_threats',
  'doxxing',
  'hacked_account',
  'other',
]

type UrlRow = { url: string; notes: string }

const emptyForm = {
  full_name: '',
  email: '',
  phone: '',
  nic: '',
  address: '',
  on_behalf_of: '',
  incident_type: 'deepfake' as IncidentType,
  date_first_seen: '',
  description: '',
  perpetrator: '',
}

const clean = (s: string) => s.trim() || undefined

export function ReportWizard() {
  const { t } = useI18n()
  const steps = [t.stepYou, t.stepWhat, t.stepEvidence, t.stepReview, t.stepDone]
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState<File[]>([])
  const [urls, setUrls] = useState<UrlRow[]>([{ url: '', notes: '' }])
  const [thumbs, setThumbs] = useState<ThumbnailMode>('blurred')
  const [evidence, setEvidence] = useState<EvidenceItem[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReportResult | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const set = (k: keyof typeof emptyForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const goodUrls = urls.filter((u) => u.url.trim())

  const valid = [
    form.full_name.trim().length > 0,
    form.description.trim().length > 0,
    files.length > 0 || goodUrls.length > 0,
    true,
    true,
  ]

  const incident: Incident = {
    complainant: {
      full_name: form.full_name.trim(),
      email: clean(form.email),
      phone: clean(form.phone),
      nic: clean(form.nic),
      address: clean(form.address),
      on_behalf_of: clean(form.on_behalf_of),
    },
    incident_type: form.incident_type,
    date_first_seen: clean(form.date_first_seen),
    description: form.description.trim(),
    perpetrator: clean(form.perpetrator),
    urls: goodUrls.map((u) => ({ url: u.url.trim(), notes: clean(u.notes) })),
  }

  const next = async () => {
    if (!valid[step]) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    setError(null)
    if (step === 2) {
      // Fingerprint evidence for the review step.
      setBusy(true)
      try {
        setEvidence(files.length ? await analyzeEvidence(files) : [])
        setStep(3)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBusy(false)
      }
      return
    }
    setStep((s) => s + 1)
  }

  const generate = async () => {
    setBusy(true)
    setError(null)
    try {
      if (report) URL.revokeObjectURL(report.url)
      setReport(await generateReport(incident, files, thumbs))
      setStep(4)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const restart = () => {
    if (report) URL.revokeObjectURL(report.url)
    setForm(emptyForm)
    setFiles([])
    setUrls([{ url: '', notes: '' }])
    setEvidence(null)
    setReport(null)
    setStep(0)
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow={t.navReport} badge="02" title={t.reportTitle} intro={t.reportIntro} />

      <div className="flex flex-col gap-1 rounded-2xl border border-brand-500/25 bg-gradient-to-r from-brand-600/15 to-transparent px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-brand-900">{t.notAlone}</span>
        <a href="tel:119" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
          {t.danger}
        </a>
      </div>

      <ol className="flex gap-1.5" aria-label="Progress">
        {steps.map((label, i) => (
          <li key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-gradient-to-r from-gold to-brand-500' : 'bg-white/8'}`} />
            <span className={`mt-1.5 hidden text-xs sm:block ${i === step ? 'font-semibold text-ink' : 'text-muted'}`}>{label}</span>
          </li>
        ))}
      </ol>

      <Card>
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label={t.fullName} required>
                <input className={inputCls} value={form.full_name} onChange={set('full_name')} autoComplete="name" />
              </Field>
              {showErrors && !valid[0] && <p className="mt-1 text-xs text-red-300">{t.required}</p>}
            </div>
            <Field label={t.email}>
              <input className={inputCls} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </Field>
            <Field label={t.phone}>
              <input className={inputCls} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </Field>
            <Field label={t.nic}>
              <input className={inputCls} value={form.nic} onChange={set('nic')} />
            </Field>
            <Field label={t.address}>
              <input className={inputCls} value={form.address} onChange={set('address')} autoComplete="street-address" />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t.onBehalf}>
                <input className={inputCls} value={form.on_behalf_of} onChange={set('on_behalf_of')} />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink">{t.incidentType}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {TYPES.map((ty) => (
                  <label
                    key={ty}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition ${
                      form.incident_type === ty ? 'border-brand-500/70 bg-brand-500/10 ring-2 ring-brand-500/15' : 'border-white/10 hover:border-white/25'
                    }`}
                  >
                    <input
                      type="radio"
                      name="incident_type"
                      className="accent-brand-600"
                      checked={form.incident_type === ty}
                      onChange={() => setForm((f) => ({ ...f, incident_type: ty }))}
                    />
                    {t.types[ty]}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label={t.dateSeen}>
              <input className={`${inputCls} sm:max-w-xs`} type="date" value={form.date_first_seen} onChange={set('date_first_seen')} max={new Date().toISOString().slice(0, 10)} />
            </Field>
            <div>
              <Field label={t.description} hint={t.descriptionHint} required>
                <textarea className={`${inputCls} min-h-36`} value={form.description} onChange={set('description')} maxLength={6000} />
              </Field>
              {showErrors && !valid[1] && <p className="mt-1 text-xs text-red-300">{t.required}</p>}
            </div>
            <Field label={t.perpetrator}>
              <textarea className={`${inputCls} min-h-20`} value={form.perpetrator} onChange={set('perpetrator')} maxLength={1000} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-ink">{t.screenshots}</h2>
              <p className="mb-3 text-xs text-muted">{t.screenshotsHint}</p>
              <Dropzone multiple accept="image/*,.pdf" onFiles={(f) => setFiles((cur) => [...cur, ...f].slice(0, 25))} title={t.dropEvidence} />
              {files.length > 0 && (
                <ul className="mt-3 divide-y divide-white/8 rounded-xl border border-white/8">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm">
                      <span className="truncate">
                        <span className="mr-2 font-mono text-xs text-muted">E-{String(i + 1).padStart(2, '0')}</span>
                        {f.name}
                      </span>
                      <button type="button" className="shrink-0 text-xs font-medium text-brand-700 hover:underline" onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}>
                        {t.remove}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-medium text-ink">{t.links}</h2>
              <div className="space-y-2">
                {urls.map((u, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
                    <input
                      className={inputCls}
                      inputMode="url"
                      placeholder={t.linkPlaceholder}
                      value={u.url}
                      onChange={(e) => setUrls((cur) => cur.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)))}
                    />
                    <input
                      className={inputCls}
                      placeholder={t.linkNotes}
                      value={u.notes}
                      onChange={(e) => setUrls((cur) => cur.map((r, j) => (j === i ? { ...r, notes: e.target.value } : r)))}
                    />
                    <Button variant="ghost" type="button" onClick={() => setUrls((cur) => (cur.length > 1 ? cur.filter((_, j) => j !== i) : [{ url: '', notes: '' }]))}>
                      {t.remove}
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="mt-2" type="button" onClick={() => setUrls((cur) => [...cur, { url: '', notes: '' }])} disabled={urls.length >= 50}>
                + {t.addLink}
              </Button>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink">{t.thumbnails}</legend>
              <div className="flex flex-wrap gap-2">
                {(['blurred', 'full', 'none'] as ThumbnailMode[]).map((m) => (
                  <label key={m} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm ${thumbs === m ? 'border-white bg-white font-semibold text-[#06140a]' : 'border-white/12 text-ink hover:border-white/25'}`}>
                    <input type="radio" name="thumbs" className="sr-only" checked={thumbs === m} onChange={() => setThumbs(m)} />
                    {{ blurred: t.thumbBlurred, full: t.thumbFull, none: t.thumbNone }[m]}
                  </label>
                ))}
              </div>
            </fieldset>
            {showErrors && !valid[2] && <p className="text-sm text-red-300">{t.needEvidence}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[160px_1fr]">
              <dt className="text-muted">{t.fullName}</dt>
              <dd className="font-medium">{incident.complainant.full_name}</dd>
              <dt className="text-muted">{t.incidentType}</dt>
              <dd className="font-medium">{t.types[incident.incident_type]}</dd>
              {incident.date_first_seen && (
                <>
                  <dt className="text-muted">{t.dateSeen}</dt>
                  <dd className="font-medium">{incident.date_first_seen}</dd>
                </>
              )}
              <dt className="text-muted">{t.links}</dt>
              <dd className="font-medium">{incident.urls.length}</dd>
            </dl>
            {evidence && evidence.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-white/8">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-white/[0.04] text-xs text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">File</th>
                      <th className="px-3 py-2 font-medium">SHA-256</th>
                      <th className="px-3 py-2 font-medium">pHash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {evidence.map((ev) => (
                      <tr key={ev.exhibit}>
                        <td className="px-3 py-2 font-mono text-xs">{ev.exhibit}</td>
                        <td className="max-w-[180px] truncate px-3 py-2" title={ev.filename}>
                          {ev.filename}
                        </td>
                        <td className="px-3 py-2">
                          <CopyText value={ev.sha256} display={`${ev.sha256.slice(0, 16)}…`} />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{ev.phash ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {step === 4 && report && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">{t.reportReady}</h2>
                <p className="mt-1 text-sm text-muted">
                  {t.reportId}: <span className="font-mono font-medium text-ink">{report.reportId}</span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {t.pdfHash}: <CopyText value={report.pdfSha256} display={`${report.pdfSha256.slice(0, 24)}…`} />
                </p>
              </div>
              <a href={report.url} download={report.filename} className={btnPrimary}>
                {t.downloadPdf}
              </a>
            </div>
            <WhereToSend />
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink">{t.afterTips}</h3>
              <ul className="space-y-1.5 text-sm text-muted">
                <li>• {t.afterTip1}</li>
                <li>• {t.afterTip2}</li>
                <li>• {t.afterTip3}</li>
              </ul>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/8 pt-5">
          {step > 0 && step < 4 ? (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={busy}>
              {t.back}
            </Button>
          ) : (
            <span />
          )}
          {step < 3 && (
            <Button onClick={next} disabled={busy}>
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? t.fingerprinting : t.next}
            </Button>
          )}
          {step === 3 && (
            <Button onClick={generate} disabled={busy}>
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? t.generating : t.generate}
            </Button>
          )}
          {step === 4 && (
            <Button variant="secondary" onClick={restart}>
              {t.startOver}
            </Button>
          )}
        </div>
      </Card>
    </section>
  )
}

function WhereToSend() {
  const { t } = useI18n()
  const [contacts, setContacts] = useState<Contacts | null>(null)
  useEffect(() => {
    getContacts().then(setContacts).catch(() => setContacts(null))
  }, [])
  if (!contacts) return null
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-ink">{t.whereToSend}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {contacts.authorities.map((a) => (
          <div key={a.name} className="rounded-2xl border border-white/8 bg-black/20 p-3 text-sm">
            <p className="font-semibold text-ink">{a.name}</p>
            <p className="text-xs text-muted">{a.how}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {a.phone && <a className="font-medium text-brand-700 hover:underline" href={`tel:${a.phone.split(' (')[0].replace(/\s/g, '')}`}>{a.phone}</a>}
              {a.email && <a className="font-medium text-brand-700 hover:underline" href={`mailto:${a.email}`}>{a.email}</a>}
              {a.link && <a className="font-medium text-brand-700 hover:underline" href={a.link} target="_blank" rel="noreferrer">{new URL(a.link).hostname}</a>}
            </div>
          </div>
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {contacts.platforms.map((p) => (
          <li key={p.name}>
            <a href={p.link} target="_blank" rel="noreferrer" className="inline-block rounded-full border border-white/8 px-3 py-1 text-xs text-ink hover:border-white/25 hover:bg-white/5">
              {p.name.split(' (')[0].split(' - ')[0]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
