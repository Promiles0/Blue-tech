import { useEffect, useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { Loader2, RotateCcw, ShieldCheck, Wrench, X } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useT } from '../../lib/i18n'
import ReviewPhotoPicker from './ReviewPhotoPicker'

// Returns and warranty claims for a delivered order (5b, 5c): the "Return or warranty" form
// per item, and the progress of requests already sent.
export const RETURN_DAYS = 30
const RETURN_REASONS = ['Changed my mind', 'Not as described', 'Damaged on arrival', 'Wrong item sent']
const WARRANTY_REASONS = ['Stopped working', 'Battery problem', 'Screen or display problem', 'Keyboard, ports or buttons', 'Other fault']
const STATUS = {
  new: { label: 'Received — we will reply soon', tone: '#3b82f6' },
  approved: { label: 'Approved', tone: '#22c55e' },
  received: { label: 'Item received, being checked', tone: '#8b5cf6' },
  repaired: { label: 'Repaired', tone: '#22c55e' },
  replaced: { label: 'Being replaced', tone: '#22c55e' },
  refunded: { label: 'Refunded', tone: '#22c55e' },
  rejected: { label: 'Not accepted', tone: '#ef4444' },
  closed: { label: 'Closed', tone: '#94a3b8' },
}

export function daysSince(iso) {
  return iso ? (Date.now() - new Date(iso).getTime()) / 86400000 : 0
}

export function ServiceRequestList({ requests }) {
  const { t } = useT()
  if (!requests?.length) return null
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '18px 24px', marginBottom: 32 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>{t('Returns and warranty')}</p>
      {requests.map((r, i) => {
        const st = STATUS[r.status] ?? STATUS.new
        return (
          <div key={r.id} style={{ padding: '12px 0', borderTop: i ? '1px solid var(--card-border)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {r.type === 'return' ? t('Return') : t('Warranty claim')} · {r.productName}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: `1px solid ${st.tone}`, color: st.tone }}>{t(st.label)}</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 0' }}>{t(r.reason)}</p>
            {r.customerMessage && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 0', lineHeight: 1.55 }}>{r.customerMessage}</p>}
          </div>
        )
      })}
    </div>
  )
}

export function ServiceRequestModal({ order, item, onClose, onCreated }) {
  const { t, intlLocale } = useT()
  const sinceDelivery = daysSince(order.deliveredAt ?? order.createdAt)
  const canReturn = sinceDelivery <= RETURN_DAYS
  const [type, setType] = useState(canReturn ? 'return' : 'warranty')
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [photos, setPhotos] = useState([])
  const [unused, setUnused] = useState(false)
  const [busy, setBusy] = useState(false)
  const [warranty, setWarranty] = useState(null)

  useEffect(() => {
    apiService.products.getOne(item.productId).then(({ data }) => setWarranty(data?.warranty ?? null)).catch(() => {})
  }, [item.productId])

  const returnUntil = new Date(new Date(order.deliveredAt ?? order.createdAt).getTime() + RETURN_DAYS * 86400000)
  const reasons = type === 'return' ? RETURN_REASONS : WARRANTY_REASONS

  const submit = async () => {
    if (!reason) { toast.error(t('Please choose a reason')); return }
    if (type === 'return' && !unused) { toast.error(t('Please confirm the item is unused and in its original packaging')); return }
    setBusy(true)
    try {
      const { data } = await apiService.serviceRequests.create({
        orderId: order.orderId, productId: item.productId, quantity: item.quantity, type, reason, details,
        photos: photos.map((p) => p.path ?? p), unusedConfirmed: unused,
      })
      toast.success(t("Request sent — we'll reply within one working day"))
      onCreated?.(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || t('Could not send your request'))
    } finally {
      setBusy(false)
    }
  }

  const option = (value, Icon, title, sub, disabled) => (
    <button type="button" onClick={() => { if (!disabled) { setType(value); setReason('') } }} disabled={disabled}
      style={{
        flex: 1, minWidth: 180, textAlign: 'left', padding: 14, borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        border: `1px solid ${type === value ? 'var(--accent)' : 'var(--card-border)'}`, background: type === value ? 'var(--accent-dim)' : 'transparent', color: 'var(--text-primary)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><Icon size={16} /> {title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.45 }}>{sub}</div>
    </button>
  )

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <motion.div role="dialog" aria-label={t('Return or warranty')} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface, var(--bg))', border: '1px solid var(--card-border)', borderRadius: 20, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{t('Return or warranty')}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{item.productName} · {t('Order #{id}', { id: order.orderId })}</p>
            </div>
            <button type="button" onClick={onClose} aria-label={t('Close')} style={{ background: 'none', border: 0, color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            {option('return', RotateCcw, t('Return it'), canReturn
              ? t('Unused, in its original packaging — until {date}', { date: returnUntil.toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' }) })
              : t('The {n}-day return period has ended', { n: RETURN_DAYS }), !canReturn)}
            {option('warranty', ShieldCheck, t('Warranty claim'), warranty ? t('It has a fault — covered by its {w} warranty', { w: warranty }) : t('It has a fault and needs repair or replacement'))}
          </div>

          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('What happened?')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {reasons.map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)}
                style={{ padding: '7px 12px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', border: `1px solid ${reason === r ? 'var(--accent)' : 'var(--card-border)'}`, background: reason === r ? 'var(--accent)' : 'transparent', color: reason === r ? '#fff' : 'var(--text-primary)' }}>
                {t(r)}
              </button>
            ))}
          </div>

          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={2000} className="noir-input"
            placeholder={type === 'warranty' ? t('Describe the fault: when it started, what you see…') : t('Anything we should know? (optional)')}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', marginBottom: 12 }} />

          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>{t('Photos (optional, up to 3)')}</p>
          <ReviewPhotoPicker photos={photos} onChange={setPhotos} disabled={busy} upload={(form) => apiService.serviceRequests.uploadPhoto(form)} />
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '6px 0 14px' }}>{t('Only our team can see these photos.')}</p>

          {type === 'return' && (
            <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={unused} onChange={(e) => setUnused(e.target.checked)} style={{ marginTop: 3 }} />
              {t('The item is unused and in its original packaging, with all accessories')}
            </label>
          )}

          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 16px', display: 'flex', gap: 8 }}>
            <Wrench size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            {t("Once approved, you can bring it to our shop in Kigali, or we'll arrange collection. We reply within one working day.")}
          </p>
          <button type="button" onClick={submit} disabled={busy} className="noir-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 18px' }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null} {t('Send request')}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
