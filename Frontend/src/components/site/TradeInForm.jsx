import { useState } from 'react'
import { Check, Loader2, Repeat } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useAuth } from '../../context/AuthContext'
import { useCurrency } from '../../context/CurrencyContext'
import { useT } from '../../lib/i18n'
import { usePrograms, tradeInEstimate, TRADE_IN_TYPES, CONDITIONS } from '../../lib/programs'

const TYPE_LABEL = { laptop: 'Laptop', desktop: 'Desktop', phone: 'Phone', tablet: 'Tablet', monitor: 'Monitor', printer: 'Printer' }
const CONDITION_LABEL = {
  excellent: 'Excellent — like new', good: 'Good — normal signs of use', fair: 'Fair — scratches or worn battery', broken: 'Broken — does not work properly',
}
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }

// Trade-in: describe the old device, see an estimate (when the shop has set values), send it.
export default function TradeInForm() {
  const { t } = useT()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const programs = usePrograms()
  const [f, setF] = useState({ deviceType: 'laptop', brand: '', model: '', ageYears: 2, condition: 'good', name: user?.name ?? '', phone: '', email: user?.email ?? '', notes: '' })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const set = (k) => (e) => setF(v => ({ ...v, [k]: e.target.value }))
  const estimate = tradeInEstimate(programs, f.deviceType, Number(f.ageYears), f.condition)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const { data } = await apiService.programs.tradeIn({ ...f, ageYears: Number(f.ageYears) })
      setResult(data ?? {})
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t('Something went wrong. Please try again.'))
    } finally { setBusy(false) }
  }

  if (result) {
    return (
      <div className="surface" style={{ borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--text)', fontSize: 16 }}><Check size={18} style={{ color: 'var(--success, #22c55e)' }} /> {t('Request sent')}</p>
        <p style={{ color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
          {result.estimate
            ? t('Estimated credit: {low} – {high}. We will call you to check the device and confirm the final amount.', { low: formatPrice(result.estimate.low), high: formatPrice(result.estimate.high) })
            : t('We will call you with an offer after checking the details.')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'grid', gap: 14, background: 'var(--surface)' }}>
      <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 17, color: 'var(--text)' }}><Repeat size={18} /> {t('Get a trade-in offer')}</p>
      <div className="tradein-grid">
        <div><label style={lbl}>{t('Device')}</label>
          <select className="noir-input" value={f.deviceType} onChange={set('deviceType')}>{TRADE_IN_TYPES.map(k => <option key={k} value={k}>{t(TYPE_LABEL[k])}</option>)}</select></div>
        <div><label style={lbl}>{t('Brand')}</label><input className="noir-input" value={f.brand} onChange={set('brand')} placeholder="HP, Dell, Lenovo…" /></div>
        <div><label style={lbl}>{t('Model (if you know it)')}</label><input className="noir-input" value={f.model} onChange={set('model')} /></div>
        <div><label style={lbl}>{t('Age (years)')}</label><input className="noir-input" type="number" min={0} max={20} value={f.ageYears} onChange={set('ageYears')} /></div>
      </div>
      <div><label style={lbl}>{t('Condition')}</label>
        <select className="noir-input" value={f.condition} onChange={set('condition')}>{CONDITIONS.map(k => <option key={k} value={k}>{t(CONDITION_LABEL[k])}</option>)}</select></div>

      {estimate && (
        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--accent-dim)', color: 'var(--text)' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('Estimated credit')}</span>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{formatPrice(estimate.low)} – {formatPrice(estimate.high)}</div>
          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t('Final amount confirmed after we check the device.')}</span>
        </div>
      )}

      <div className="tradein-grid">
        <div><label style={lbl}>{t('Your name')} *</label><input className="noir-input" value={f.name} onChange={set('name')} required /></div>
        <div><label style={lbl}>{t('Phone')} *</label><input className="noir-input" type="tel" value={f.phone} onChange={set('phone')} required placeholder="078 123 4567" /></div>
      </div>
      <div><label style={lbl}>{t('Anything else? (what you want to buy, accessories included…)')}</label>
        <textarea className="noir-input" rows={2} value={f.notes} onChange={set('notes')} style={{ resize: 'vertical' }} /></div>
      <button type="submit" disabled={busy} className="noir-btn-primary" style={{ padding: '12px 18px', fontSize: 14, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        {busy && <Loader2 size={15} className="animate-spin" />} {t('Send trade-in request')}
      </button>
      <style>{`.tradein-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}@media(max-width:560px){.tradein-grid{grid-template-columns:1fr}}`}</style>
    </form>
  )
}
