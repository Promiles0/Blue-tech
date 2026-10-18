import { useState } from 'react'
import { BellRing, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../lib/i18n'

// Sold-out product: leave an email or phone number to hear when it's back.
export default function BackInStockForm({ productId }) {
  const { t, lang } = useT()
  const { user } = useAuth()
  const [contact, setContact] = useState(user?.email ?? '')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const value = contact.trim()
    if (!value) return
    const isEmail = value.includes('@')
    setBusy(true)
    try {
      await apiService.stockAlerts.create({ productId, lang, ...(isEmail ? { email: value } : { phone: value }) })
      setDone(true)
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t('Something went wrong. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--success, #22c55e)' }}>
        <Check size={16} /> {t("Done — we'll let you know when it's back.")}
      </p>
    )
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
      <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
        <BellRing size={15} style={{ color: 'var(--accent-light, var(--accent))' }} /> {t("Notify me when it's back")}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="noir-input" value={contact} onChange={e => setContact(e.target.value)}
          placeholder={t('Email or phone number')} aria-label={t('Email or phone number')} style={{ flex: 1 }} />
        <button type="submit" disabled={busy || !contact.trim()} className="noir-btn-primary" style={{ padding: '10px 16px', fontSize: 13.5, whiteSpace: 'nowrap' }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : t('Notify me')}
        </button>
      </div>
    </form>
  )
}
