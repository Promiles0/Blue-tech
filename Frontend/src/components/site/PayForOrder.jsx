import { useEffect, useRef, useState } from 'react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Loader2, RefreshCw, Smartphone } from 'lucide-react'
import apiService from '../../api/service'
import { useT } from '../../lib/i18n'
import { useAuth } from '../../context/AuthContext'
import { useCurrency } from '../../context/CurrencyContext'
import {
  CARD_ELEMENT_OPTIONS, MOMO_POLL_INTERVAL_MS, MOMO_POLL_TIMEOUT_MS, getStripe, momoProviderFor, normalizeRwandaPhone,
} from '../../lib/payments'

// "Complete your payment" for an order that already exists (payment rescue, 1b): retry
// mobile money, use another number or network, or pay by card — always on the SAME order,
// so nothing is duplicated and the reserved stock stays with it.
const METHODS = [
  { id: 'MOMO', label: 'MTN MoMo', icon: Smartphone },
  { id: 'AIRTEL_MONEY', label: 'Airtel Money', icon: Smartphone },
  { id: 'CARD', label: 'Card', icon: CreditCard },
]

export default function PayForOrder({ orderId, total, defaultMethod, defaultPhone = '', onPaid }) {
  const { t } = useT()
  const { formatPrice } = useCurrency()
  const [method, setMethod] = useState(METHODS.some((m) => m.id === defaultMethod) ? defaultMethod : 'MOMO')
  const [phone, setPhone] = useState(defaultPhone)
  const [phase, setPhase] = useState('form') // form | waiting | slow
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null) // { tone: 'error' | 'info', text }
  const pollRef = useRef(null)

  useEffect(() => () => clearTimeout(pollRef.current), [])

  // Watches a mobile money prompt until it's approved, declined or taking too long.
  const watch = (startedAt = Date.now()) => {
    clearTimeout(pollRef.current)
    pollRef.current = setTimeout(async () => {
      try {
        const { data } = await apiService.payments.getStatus(orderId)
        if (data?.paymentStatus === 'SUCCESS' || ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(String(data?.orderStatus).toUpperCase())) {
          setPhase('form'); onPaid?.(); return
        }
        if (data?.paymentStatus === 'FAILED') {
          setPhase('form')
          setMessage({ tone: 'error', text: t('The payment was declined or cancelled. Try again, or choose another way to pay.') })
          return
        }
      } catch { /* a network hiccup — keep waiting */ }
      if (Date.now() - startedAt >= MOMO_POLL_TIMEOUT_MS) { setPhase('slow'); return }
      watch(startedAt)
    }, MOMO_POLL_INTERVAL_MS)
  }

  const payMomo = async () => {
    const local = normalizeRwandaPhone(phone)
    if (!local) { setMessage({ tone: 'error', text: t('Enter a valid Rwandan number, e.g. 0788123456 or +250788123456') }); return }
    const provider = momoProviderFor(local)
    if (provider !== method) setMethod(provider) // the number decides the network
    setBusy(true); setMessage(null)
    try {
      await apiService.payments.initiateMomo(orderId, local, { switchMethod: true })
      setPhase('waiting')
      watch()
    } catch (err) {
      setMessage({ tone: 'error', text: err.response?.data?.message || t('Could not send the payment request. Please try again.') })
    } finally {
      setBusy(false)
    }
  }

  const methodButton = (m) => (
    <button key={m.id} type="button" onClick={() => { setMethod(m.id); setMessage(null) }} disabled={phase !== 'form'}
      style={{
        flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        border: `1px solid ${method === m.id ? 'var(--accent)' : 'var(--card-border, var(--border))'}`,
        background: method === m.id ? 'var(--accent-dim)' : 'transparent', color: 'var(--text-primary, var(--text))',
      }}>
      <m.icon size={14} /> {t(m.label)}
    </button>
  )

  return (
    <div style={{ textAlign: 'left' }}>
      {phase === 'form' && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>{METHODS.map(methodButton)}</div>
          {method === 'CARD' ? (
            <Elements stripe={getStripe()}>
              <CardPay orderId={orderId} total={total} onPaid={onPaid} setMessage={setMessage} />
            </Elements>
          ) : (
            <>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary, var(--muted))', marginBottom: 6 }}>
                {method === 'MOMO' ? t('MTN MoMo number') : t('Airtel Money number')}
              </label>
              <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="noir-input"
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12 }} />
              <button type="button" onClick={payMomo} disabled={busy} className="noir-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 18px' }}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />} {t('Send payment request')} · {formatPrice(total)}
              </button>
            </>
          )}
        </>
      )}

      {phase === 'waiting' && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent-light)', marginBottom: 10 }} />
          <p style={{ fontSize: 14.5, fontWeight: 600, margin: '0 0 6px' }}>{t('Approve the payment on your phone')}</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary, var(--muted))', margin: 0, lineHeight: 1.6 }}>
            {t('We sent a request to {phone}. This page updates on its own.', { phone })}
          </p>
        </div>
      )}

      {phase === 'slow' && (
        <div style={{ textAlign: 'center', padding: '6px 0' }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary, var(--muted))', margin: '0 0 12px', lineHeight: 1.6 }}>
            {t("We haven't received confirmation yet. If you approved it, it may still be settling.")}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="noir-btn-primary" style={{ padding: '10px 16px' }} onClick={() => { setPhase('waiting'); watch(Date.now() - MOMO_POLL_TIMEOUT_MS + 20000) }}>
              <RefreshCw size={14} /> {t('Check again')}
            </button>
            <button type="button" className="noir-btn-outline" style={{ padding: '10px 16px' }} onClick={() => setPhase('form')}>
              {t('Pay another way')}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="alert" style={{ marginTop: 12, fontSize: 13, lineHeight: 1.5, color: message.tone === 'error' ? 'var(--error, #ef4444)' : 'var(--text-secondary)' }}>
          {message.text}
        </p>
      )}
    </div>
  )
}

function CardPay({ orderId, total, onPaid, setMessage }) {
  const { t } = useT()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)

  const pay = async () => {
    if (!stripe || !elements) return
    setBusy(true); setMessage(null)
    try {
      const { data } = await apiService.payments.createIntent(orderId)
      const clientSecret = data?.paymentLink
      if (!clientSecret) throw new Error(t('Could not start the card payment'))
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement), billing_details: { email: user?.email, name: user?.name } },
      })
      if (error) { setMessage({ tone: 'error', text: error.message || t('Card payment failed') }); return }
      if (paymentIntent?.status === 'succeeded') {
        apiService.payments.getStatus(orderId).catch(() => {}) // settle now even if the webhook is late
        onPaid?.()
      }
    } catch (err) {
      setMessage({ tone: 'error', text: err.response?.data?.message || err.message || t('Card payment failed') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div style={{ padding: '12px 14px', border: '1px solid var(--card-border, var(--border))', borderRadius: 10, background: 'var(--bg-base, var(--bg))', marginBottom: 12 }}>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      <button type="button" onClick={pay} disabled={busy || !stripe} className="noir-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 18px' }}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} {t('Pay')} {formatPrice(total)}
      </button>
      <p style={{ fontSize: 11, color: 'var(--text-muted, var(--muted))', marginTop: 8 }}>🔒 {t('Secured by Stripe. Your card details never touch our servers.')}</p>
    </>
  )
}
