import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useT } from '../lib/i18n'

// The second sign-in step for accounts with two-step login (admin and staff): the 6-digit
// code from their authenticator app, or one of their one-time backup codes.
export default function MfaStep({ onDone }) {
  const { t } = useT()
  const { pendingMfa, verifyMfa, cancelMfa } = useAuth()
  const [code, setCode] = useState('')
  const [backup, setBackup] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      await verifyMfa(code.trim())
      onDone?.()
    } catch (err) {
      setError(err.response?.data?.message ?? t('That code isn\'t right.'))
      if (err.response?.status === 401 && /expired|again/i.test(err.response?.data?.message ?? '')) setTimeout(cancelMfa, 1500)
    } finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
          <ShieldCheck size={28} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>{t('Two-step login')}</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 22px' }}>
          {backup ? t('Enter one of your backup codes (each works once).') : t('Enter the 6-digit code from your authenticator app for {email}.', { email: pendingMfa?.email ?? '' })}
        </p>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(backup ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode={backup ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          placeholder={backup ? 'XXXXX-XXXXX' : '123456'}
          className="noir-input"
          style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', fontSize: 22, letterSpacing: backup ? '0.1em' : '0.4em', padding: '12px 14px', marginBottom: 14 }}
        />
        {error && <p role="alert" style={{ color: 'var(--error, #ef4444)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <button type="submit" disabled={busy || (backup ? code.replace(/[^A-Z0-9]/g, '').length < 10 : code.length !== 6)} className="noir-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 18px' }}>
          {busy ? t('Checking…') : t('Verify')}
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13 }}>
          <button type="button" onClick={() => { setBackup((b) => !b); setCode(''); setError('') }} style={{ background: 'none', border: 0, color: 'var(--accent-light)', cursor: 'pointer' }}>
            {backup ? t('Use the app code') : t('Use a backup code')}
          </button>
          <button type="button" onClick={cancelMfa} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer' }}>{t('Cancel')}</button>
        </div>
      </form>
    </div>
  )
}
