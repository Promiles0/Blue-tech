import { useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { CalendarClock, X, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useAuth } from '../../context/AuthContext'
import { useCurrency } from '../../context/CurrencyContext'
import { useT } from '../../lib/i18n'
import { usePrograms, instalmentPlan } from '../../lib/programs'

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }

// "Pay in instalments" on the product page — only when the shop has switched it on.
// It sends a request; the shop approves and arranges the plan with the customer.
export default function InstalmentsButton({ product }) {
  const { t } = useT()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const programs = usePrograms()
  const [open, setOpen] = useState(false)
  const [months, setMonths] = useState(null)
  const [form, setForm] = useState({ name: user?.name ?? '', phone: '', email: user?.email ?? '' })
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const price = Number(product?.price) || 0
  const p = programs?.instalments
  if (!p?.enabled || price < p.minPrice || !p.months?.length) return null
  const chosen = months ?? p.months[0]
  const plan = instalmentPlan(programs, price, chosen)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await apiService.programs.instalments({ productId: product.productId ?? product.id, months: chosen, ...form })
      setSent(true)
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t('Something went wrong. Please try again.'))
    } finally { setBusy(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px',
        borderRadius: 8, border: '1px dashed var(--accent)', background: 'var(--accent-dim)', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}>
        <CalendarClock size={16} /> {t('Pay in instalments — from {amount}/month', { amount: formatPrice(instalmentPlan(programs, price, Math.max(...p.months)).monthly) })}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ y: 16 }} animate={{ y: 0 }} role="dialog" aria-label={t('Pay in instalments')}
              style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, color: 'var(--text)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 19, fontWeight: 800 }}>{t('Pay in instalments')}</h2>
                <button onClick={() => setOpen(false)} aria-label={t('Close')} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              {sent ? (
                <p style={{ marginTop: 14, display: 'flex', gap: 8, color: 'var(--muted)', lineHeight: 1.6 }}>
                  <Check size={18} style={{ color: 'var(--success, #22c55e)', flexShrink: 0 }} /> {t('Request sent. We will call you to confirm the plan and arrange the deposit.')}
                </p>
              ) : (
                <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {p.months.map(m => (
                      <button type="button" key={m} onClick={() => setMonths(m)} className={`budget-chip ${m === chosen ? 'on' : ''}`}>{t('{n} months', { n: m })}</button>
                    ))}
                  </div>
                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--accent-dim)', display: 'grid', gap: 4, fontSize: 14 }}>
                    <div>{t('Deposit today')}: <strong>{formatPrice(plan.deposit)}</strong></div>
                    <div>{t('Then {n} × {amount}', { n: chosen, amount: formatPrice(plan.monthly) })}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t('Total')}: {formatPrice(plan.total)}{p.feePercent ? ` (${t('includes a {p}% fee', { p: p.feePercent })})` : ''}</div>
                  </div>
                  <div><label style={lbl}>{t('Your name')} *</label><input className="noir-input" required value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} /></div>
                  <div><label style={lbl}>{t('Phone')} *</label><input className="noir-input" type="tel" required value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} placeholder="078 123 4567" /></div>
                  <button type="submit" disabled={busy} className="noir-btn-primary" style={{ padding: 12, fontSize: 14, display: 'inline-flex', justifyContent: 'center', gap: 8 }}>
                    {busy && <Loader2 size={15} className="animate-spin" />} {t('Request this plan')}
                  </button>
                  <p style={{ fontSize: 11.5, color: 'var(--muted-dark)', margin: 0 }}>{t('Subject to approval. No payment is taken now.')}</p>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
