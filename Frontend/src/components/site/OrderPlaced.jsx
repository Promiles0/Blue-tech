import { useEffect, useState } from 'react'
import { trackPurchaseOnce } from '../../lib/analytics'
import { Link } from 'react-router-dom'
import { CheckCircle, MessageCircle, Package, ShoppingBag, Truck, Home, Wallet } from 'lucide-react'
import apiService from '../../api/service'
import { useT } from '../../lib/i18n'
import { WHATSAPP_NUMBER } from '../../lib/helpLinks'
import InvoiceButton from './InvoiceButton'
import { SaveGuestAccount } from './GuestCheckout'

// The page after placing an order (1e): what was ordered, when it arrives, what happens next,
// and the obvious next steps — track, invoice, WhatsApp, keep shopping.
export default function OrderPlaced({ orderId, deliveryText, cashOnPickup }) {
  const { t } = useT()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!orderId) return
    apiService.orders.getOrderDetails(orderId).then(({ data }) => { setOrder(data); if (!cashOnPickup) trackPurchaseOnce(data) }).catch(() => {})
  }, [orderId, cashOnPickup])

  const steps = [
    { icon: Wallet, label: cashOnPickup ? t('Order placed') : t('Paid'), done: true },
    { icon: Package, label: t('Being prepared'), done: false },
    { icon: Truck, label: cashOnPickup ? t('Ready for pickup') : t('On the way'), done: false },
    { icon: Home, label: cashOnPickup ? t('Picked up') : t('Delivered'), done: false },
  ]
  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('Hi Blue-Tech! A question about my order #{id}', { id: orderId }))}`

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--success)' }}>
          <CheckCircle size={38} />
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>{t('Order confirmed')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, margin: '0 0 6px' }}>
          {t('Thank you! Your order number is')} <strong style={{ color: 'var(--text-primary)' }}>#{orderId}</strong>.
        </p>
        {deliveryText && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: '0 0 24px' }}>
            {cashOnPickup ? t('Ready for pickup:') : t('Expected delivery:')} <strong style={{ color: 'var(--text-primary)' }}>{deliveryText}</strong>
          </p>
        )}

        {/* What happens next */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, margin: '8px 0 26px', position: 'relative' }}>
          <div aria-hidden style={{ position: 'absolute', top: 17, left: '12.5%', right: '12.5%', height: 2, background: 'var(--border)' }} />
          {steps.map(({ icon: Icon, label, done }) => (
            <div key={label} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--success)' : 'var(--bg-surface, var(--bg))', border: `2px solid ${done ? 'var(--success)' : 'var(--border)'}`, color: done ? '#fff' : 'var(--text-muted)' }}>
                <Icon size={16} />
              </div>
              <span style={{ fontSize: 11.5, color: done ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: done ? 700 : 500 }}>{label}</span>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 22px' }}>
          {t("We'll send you an update at every step. You can follow it any time on your order page.")}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <Link to={`/orders/${orderId}`} className="noir-btn-primary" style={{ padding: '13px 24px' }}>{t('Track my order')}</Link>
          <a href={wa} target="_blank" rel="noreferrer" className="noir-btn-outline" style={{ padding: '13px 20px', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <MessageCircle size={15} /> {t('WhatsApp us')}
          </a>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {order && <InvoiceButton order={order} />}
          <Link to="/products" style={{ fontSize: 13.5, color: 'var(--accent-light)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <ShoppingBag size={14} /> {t('Keep shopping')}
          </Link>
        </div>
        <SaveGuestAccount />
      </div>
    </div>
  )
}
