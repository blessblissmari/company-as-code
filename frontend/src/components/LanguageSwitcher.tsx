import { LANGUAGES, useI18n } from '../lib/i18n'
import type { Language } from '../lib/i18n'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n()
  return (
    <div
      role="radiogroup"
      aria-label={t.language}
      style={{
        display: 'inline-flex',
        gap: 0,
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {LANGUAGES.map((l) => {
        const active = l.value === lang
        return (
          <button
            key={l.value}
            role="radio"
            aria-checked={active}
            className="btn ghost"
            onClick={() => setLang(l.value as Language)}
            style={{
              background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderRadius: 0,
              borderRight: l.value === LANGUAGES[0].value ? '1px solid rgba(255,255,255,0.08)' : 'none',
              padding: '4px 10px',
              fontWeight: active ? 600 : 400,
              color: active ? '#fff' : '#a9b5c9',
            }}
          >
            {l.label}
          </button>
        )
      })}
    </div>
  )
}
