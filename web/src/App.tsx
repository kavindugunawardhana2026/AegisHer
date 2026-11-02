import { useEffect, useState } from 'react'
import { serverMissing } from './api'
import { btnPrimary, ShieldIcon } from './components/ui'
import { I18nProvider, useI18n } from './i18n'
import { About } from './pages/About'
import { CloakStudio } from './pages/CloakStudio'
import { Home } from './pages/Home'
import { homeText } from './pages/homeText'
import { ReportWizard } from './pages/ReportWizard'

type Tab = 'home' | 'cloak' | 'report' | 'about'

// Unknown hashes (e.g. in-page anchors like #what) belong to the landing page.
function tabFromHash(): Tab {
  const h = window.location.hash.replace('#', '')
  return h === 'cloak' || h === 'report' || h === 'about' ? h : 'home'
}

function Shell() {
  const { t, lang, setLang } = useI18n()
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [scrolled, setScrolled] = useState(false)
  const h = homeText[lang]

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  useEffect(() => {
    const on = () =>
      setTab((prev) => {
        const next = tabFromHash()
        // New page: start at the top. Same page: let the browser scroll to the anchor.
        if (next !== prev) window.scrollTo({ top: 0, behavior: 'instant' })
        return next
      })
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const tabs: [Tab, string][] = [
    ['home', h.navHome],
    ['cloak', t.navCloak],
    ['report', t.navReport],
    ['about', t.navAbout],
  ]

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="page-glow" aria-hidden />

      <header className="sticky top-0 z-20 px-3 pt-3 sm:px-5 sm:pt-4">
        <div
          className={`topbar mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl px-4 sm:rounded-3xl sm:px-6 ${
            scrolled ? 'is-scrolled py-2.5' : 'py-3.5'
          }`}
        >
          <a href="#home" className="flex items-center gap-2.5 text-brand-500">
            <ShieldIcon className="h-8 w-8 drop-shadow-[0_0_12px_rgba(95,250,123,0.55)]" />
            <span className="text-lg font-extrabold tracking-tight text-white">
              Aegis<span className="font-display font-semibold text-gold">Her</span>
            </span>
          </a>
          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto [scrollbar-width:none] sm:order-none sm:mx-auto sm:w-auto">
            {tabs.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={tab === id ? 'page' : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition ${
                  tab === id ? 'bg-white/12 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 sm:ml-0">
          {tab !== 'cloak' && (
            <a href="#cloak" className={`${btnPrimary} py-2 max-lg:hidden`}>
              {h.ctaShield}
            </a>
          )}
          <div className="flex rounded-full bg-black/25 p-1 text-xs font-semibold" role="group" aria-label="Language">
            {(['en', 'si'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-full px-3 py-1 transition ${lang === l ? 'bg-white text-[#06140a] shadow' : 'text-white/70 hover:text-white'}`}
              >
                {l === 'en' ? 'EN' : 'සිං'}
              </button>
            ))}
          </div>
          </div>
        </div>
      </header>

      <main key={tab} className={`page-enter ${tab === 'home' ? '' : 'mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16'}`}>
        {serverMissing && (tab === 'cloak' || tab === 'report') && (
          <p role="status" className="mb-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {h.demoNotice}
          </p>
        )}
        {tab === 'home' && <Home />}
        {tab === 'cloak' && <CloakStudio />}
        {tab === 'report' && <ReportWizard />}
        {tab === 'about' && <About />}
      </main>

      <footer className="border-t border-white/[0.06] bg-black/30 px-4 py-10 text-center">
        <p className="gold-text font-display mx-auto max-w-2xl text-sm leading-relaxed tracking-[0.14em] uppercase">{t.tagline}</p>
        <p className="mt-3 text-xs text-muted">🔒 {t.privacy}</p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  )
}
