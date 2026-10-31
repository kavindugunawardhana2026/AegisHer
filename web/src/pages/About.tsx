import { Card, PageHeader } from '../components/ui'
import { useI18n } from '../i18n'

export function About() {
  const { t } = useI18n()
  const items = [
    [t.about1Title, t.about1],
    [t.about2Title, t.about2],
    [t.about3Title, t.about3],
    [t.about4Title, t.about4],
  ]
  return (
    <section className="mx-auto max-w-4xl space-y-10">
      <PageHeader eyebrow={t.navAbout} badge="03" title={t.aboutTitle} center />
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map(([title, body], i) => (
          <Card key={title} className="transition hover:-translate-y-1">
            <span className="pin mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-extrabold">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
