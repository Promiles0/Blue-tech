import { useState } from 'react'
import { useT } from '../../lib/i18n'
import { AnimatePresence, m as motion } from 'framer-motion'
import { X, FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useAuth } from '../../context/AuthContext'
import { downloadInvoicePdf, proformaDoc } from '../../lib/invoicePdf'

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }

// Cart → "Get a proforma invoice": schools, NGOs and companies need one for approval or tenders.
export default function ProformaModal({ open, onClose, items }) {
  const { t } = useT()
  const { user } = useAuth()
  const [form, setForm] = useState(() => ({ organization: '', tin: '', contactName: user?.name ?? '', email: user?.email ?? '', phone: '' }))
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.organization.trim()) { toast.error(t('Enter the organisation or company name')); return }
    setBusy(true)
    try {
      const { data } = await apiService.proformas.create({
        ...form,
        items: items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
      })
      await downloadInvoicePdf(proformaDoc(data, data.business))
      toast.success(t('Proforma {number} downloaded', { number: data.number }))
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t('Could not create the proforma'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'var(--bg-overlay, rgba(0,0,0,.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.form onSubmit={submit} onClick={e => e.stopPropagation()} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
            role="dialog" aria-label={t('Get a proforma invoice')}
            style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, color: 'var(--text)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <h2 style={{ fontSize: 19, fontWeight: 800 }}>{t('Get a proforma invoice')}</h2>
              <button type="button" onClick={onClose} aria-label={t('Close')} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18, lineHeight: 1.55 }}>
              {t("A PDF with today's prices for the items in your cart — for your school, company or tender. No payment needed.")}
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={lbl} htmlFor="pf-org">{t('Organisation / company name')} *</label>
                <input id="pf-org" className="noir-input" value={form.organization} onChange={set('organization')} required placeholder="e.g. GS Kimironko" /></div>
              <div><label style={lbl} htmlFor="pf-tin">{t('TIN (optional)')}</label>
                <input id="pf-tin" className="noir-input" value={form.tin} onChange={set('tin')} inputMode="numeric" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl} htmlFor="pf-name">{t('Contact name')}</label><input id="pf-name" className="noir-input" value={form.contactName} onChange={set('contactName')} /></div>
                <div><label style={lbl} htmlFor="pf-phone">{t('Phone')}</label><input id="pf-phone" className="noir-input" type="tel" value={form.phone} onChange={set('phone')} /></div>
              </div>
              <div><label style={lbl} htmlFor="pf-email">{t('Email')}</label><input id="pf-email" className="noir-input" type="email" value={form.email} onChange={set('email')} /></div>
            </div>
            <button type="submit" disabled={busy} className="noir-btn-primary" style={{ marginTop: 20, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', fontSize: 14 }}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} {busy ? t('Preparing…') : t('Download proforma PDF')}
            </button>
            <p style={{ fontSize: 11.5, color: 'var(--muted-dark)', marginTop: 10 }}>{t('We may contact you about this proforma. It is not an EBM receipt.')}</p>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
