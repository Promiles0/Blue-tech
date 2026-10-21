import { useCallback, useEffect, useMemo, useState } from 'react'
import { DICTS, I18nContext, INTL_LOCALE, LANG_KEY, SUPPORTED, initialLang, loadDict, translate } from '../../lib/i18n'

export default function LanguageProvider({ children }) {
  // main.jsx loads the starting language's dictionary before the first render.
  const [lang, setLangState] = useState(() => { const l = initialLang(); return DICTS[l] ? l : 'en' })

  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const setLang = useCallback((code) => {
    if (!SUPPORTED.includes(code)) return
    try { localStorage.setItem(LANG_KEY, code) } catch { /* non-fatal */ }
    // Switch once the dictionary has arrived, so the page never shows half-translated text.
    loadDict(code).then(() => setLangState(DICTS[code] ? code : 'en'))
  }, [])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])
  const value = useMemo(() => ({ lang, setLang, t, intlLocale: INTL_LOCALE[lang] }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
