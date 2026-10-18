import { Languages } from 'lucide-react'
import { LANGUAGES, useT } from '../../lib/i18n'

// Compact EN / RW / FR picker for the header and the mobile menu.
export default function LanguageSwitcher({ full = false }) {
  const { lang, setLang, t } = useT()
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
      <Languages size={full ? 15 : 14} aria-hidden />
      <select
        value={lang}
        onChange={e => setLang(e.target.value)}
        aria-label={t('Choose language')}
        style={{ background: 'transparent', border: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', padding: '2px 0', outline: 'none' }}
      >
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            {full ? l.label : l.short}
          </option>
        ))}
      </select>
    </label>
  )
}
