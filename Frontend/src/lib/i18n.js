import { createContext, useContext } from 'react'
import en from '../locales/en'
import rw from '../locales/rw'
import fr from '../locales/fr'

// Storefront translations: English (source), Kinyarwanda, French. A missing key falls back
// to English, then to the key itself, so a page never shows a blank. The admin dashboard
// is staff-only and stays in English. Provider: components/site/LanguageProvider.jsx.
export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'rw', label: 'Ikinyarwanda', short: 'RW' },
  { code: 'fr', label: 'Français', short: 'FR' },
]
export const DICTS = { en, rw, fr }
export const LANG_KEY = 'bt-lang'
// Locale for Intl dates/numbers; browsers without rw-RW data fall back gracefully.
export const INTL_LOCALE = { en: 'en-GB', rw: 'rw-RW', fr: 'fr-FR' }

// t('cart.items', { n: 3 }) → "3 items"; {name} placeholders are filled from vars.
export function translate(lang, key, vars) {
  const raw = DICTS[lang]?.[key] ?? en[key] ?? key
  return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : raw
}

export function initialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (DICTS[saved]) return saved
  } catch { /* storage blocked */ }
  const nav = (typeof navigator !== 'undefined' && navigator.language || '').slice(0, 2)
  return DICTS[nav] ? nav : 'en'
}

export const I18nContext = createContext(null)

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT must be used inside LanguageProvider')
  return ctx
}
