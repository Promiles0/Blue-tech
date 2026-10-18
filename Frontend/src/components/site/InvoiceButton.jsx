import { useState } from 'react'
import { useT } from '../../lib/i18n'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { useStoreSettings } from '../../lib/delivery'
import { downloadInvoicePdf, orderInvoiceDoc } from '../../lib/invoicePdf'

// "Download invoice" on an order — a PDF with the shop's current invoice details.
export default function InvoiceButton({ order }) {
  const { t } = useT()
  const { businessInfo } = useStoreSettings()
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  if (!order?.items?.length) return null

  const download = async () => {
    setBusy(true)
    try {
      await downloadInvoicePdf(orderInvoiceDoc(order, businessInfo, user?.name))
    } catch {
      toast.error(t('Could not create the invoice'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button onClick={download} disabled={busy} style={{
      marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
      border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary, var(--text))',
      fontSize: 13, fontWeight: 600, cursor: 'pointer',
    }}>
      {busy ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} {t('Download invoice')}
    </button>
  )
}
