import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Moon, Sun, Check } from 'lucide-react'
import { LANGUAGES, useT } from '../../lib/i18n'
import { useCurrency } from '../../context/CurrencyContext'
import { useTheme } from '../../context/ThemeContext'

const CURRENCIES = [['RWF', 'Rwandan Franc'], ['USD', 'US Dollar']]

// Language, currency and light/dark in one header menu instead of three icons (UX audit C6).
export default function PreferencesMenu() {
  const { t, lang, setLang } = useT()
  const { currency, setCurrency } = useCurrency()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const short = LANGUAGES.find(l => l.code === lang)?.short ?? 'EN'

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`hdr-pill${open ? ' on' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('Language, currency and theme: {lang}, {currency}', { lang: short, currency })}
      >
        {short} · {currency}
        <ChevronDown size={13} style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div className="hdr-menu" role="dialog" aria-label={t('Preferences')} style={{ width: 240 }}>
          <p className="hdr-menu-label">{t('Language')}</p>
          {LANGUAGES.map(l => (
            <button key={l.code} type="button" className="hdr-menu-item" aria-pressed={lang === l.code} onClick={() => setLang(l.code)}>
              <span>{l.label}</span>{lang === l.code && <Check size={14} />}
            </button>
          ))}
          <p className="hdr-menu-label">{t('Currency')}</p>
          {CURRENCIES.map(([code, name]) => (
            <button key={code} type="button" className="hdr-menu-item" aria-pressed={currency === code} onClick={() => setCurrency(code)}>
              <span>{code} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>· {t(name)}</span></span>{currency === code && <Check size={14} />}
            </button>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 4px' }} />
          <button type="button" className="hdr-menu-item" onClick={toggleTheme}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {theme === 'dark' ? t('Switch to light mode') : t('Switch to dark mode')}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
