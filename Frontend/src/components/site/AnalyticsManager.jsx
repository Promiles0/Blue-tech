import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useT } from '../../lib/i18n'
import { useStoreSettings } from '../../lib/delivery'
import { analyticsConfigured, configureAnalytics, getConsent, setConsent, track } from '../../lib/analytics'

// Starts analytics from the owner's IDs, counts page views, and asks for consent (6e).
// With no IDs set in Admin → Settings, it renders nothing and loads nothing.
export default function AnalyticsManager() {
  const { t } = useT()
  const location = useLocation()
  const { analytics } = useStoreSettings()
  const [consent, setConsentState] = useState(getConsent)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!analytics) return
    configureAnalytics(analytics)
    setReady(analyticsConfigured())
  }, [analytics])

  useEffect(() => {
    if (ready && consent === 'granted') track('page_view')
  }, [location.pathname, ready, consent])

  if (!ready || consent) return null

  const choose = (value) => { setConsent(value); setConsentState(value) }
  return (
    <div role="dialog" aria-label={t('Cookie consent')} className="consent-banner" style={{
      position: 'fixed', left: 16, bottom: 16, zIndex: 59, maxWidth: 440,
      background: 'var(--surface, var(--bg))', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 14,
      padding: '14px 16px', boxShadow: '0 18px 40px -16px rgba(0,0,0,.5)', fontSize: 13, lineHeight: 1.55,
    }}>
      <p style={{ margin: '0 0 10px' }}>
        {t('We use cookies to see which pages and ads work, so we can improve the shop. Nothing is shared until you accept.')}{' '}
        <Link to="/help?v=cookies" style={{ color: 'var(--accent)' }}>{t('Learn more')}</Link>
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => choose('granted')} className="noir-btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>{t('Accept')}</button>
        <button type="button" onClick={() => choose('denied')} className="noir-btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>{t('Decline')}</button>
      </div>
      <style>{`@media (max-width: 520px){ .consent-banner{ right: 84px !important; left: 12px !important; bottom: 12px !important } }`}</style>
    </div>
  )
}
