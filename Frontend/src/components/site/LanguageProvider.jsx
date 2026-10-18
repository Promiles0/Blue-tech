import { useCallback, useEffect, useMemo, useState } from 'react'
import { DICTS, I18nContext, INTL_LOCALE, LANG_KEY, initialLang, translate } from '../../lib/i18n'

export default function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const setLang = useCallback((code) => {
    if (!DICTS[code]) return
    setLangState(code)
    try { localStorage.setItem(LANG_KEY, code) } catch { /* non-fatal */ }
  }, [])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])
  const value = useMemo(() => ({ lang, setLang, t, intlLocale: INTL_LOCALE[lang] }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
