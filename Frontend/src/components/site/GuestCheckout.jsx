import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, LogIn, UserCheck, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '../../lib/i18n'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import { normalizeRwandaPhone } from '../../lib/payments'

// UX audit A2: checkout no longer sends guests to the login page. They give a name and a
// phone number (email optional) and carry on; the API makes a light account behind the scenes
// so orders and payments work exactly as for everyone else.
export function GuestCheckoutGate() {
  const { t } = useT()
  const { guestCheckout } = useAuth()
  const { cart, total } = useCart()
  const { formatPrice } = useCurrency()
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const count = cart?.items?.length ?? 0

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError(t('Please enter your name'))
    if (!normalizeRwandaPhone(form.phone)) return setError(t('Enter a valid Rwandan phone number, e.g. 0788123456'))
    setBusy(true)
    try {
      await guestCheckout(form.name.trim(), form.phone.trim(), form.email.trim() || undefined)
    } catch (err) {
      setError(err.response?.data?.message ?? t("Couldn't start guest checkout. Please try again or sign in."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container-noir" style={{ maxWidth: 920 }}>
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
          <ArrowLeft size={14} /> {t('Back to cart')}
        </Link>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>{t('Checkout')}</h1>
        {count > 0 && (
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>
            {count === 1 ? t('1 item') : t('{n} items', { n: count })} · <strong style={{ color: 'var(--price)' }}>{formatPrice(total)}</strong>
          </p>
        )}

        <div className="guest-gate-grid">
          <form onSubmit={submit} className="guest-gate-card" noValidate>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
              <UserCheck size={18} style={{ color: 'var(--accent-light)' }} /> {t('Continue as a guest')}
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
              {t('No account needed. We only use your phone number for delivery and payment updates.')}
            </p>

            {error && <p role="alert" className="form-error">{error}</p>}

            <label className="field-label" htmlFor="guest-name">{t('Full name')}</label>
            <input id="guest-name" className="noir-input" autoComplete="name" value={form.name} onChange={set('name')} required />

            <label className="field-label" htmlFor="guest-phone">{t('Phone number')}</label>
            <input id="guest-phone" className="noir-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="0788 123 456"
              value={form.phone} onChange={set('phone')} required />

            <label className="field-label" htmlFor="guest-email">{t('Email')} <span style={{ fontWeight: 400, color: 'var(--muted-dark)' }}>({t('optional, for your receipt')})</span></label>
            <input id="guest-email" className="noir-input" type="email" autoComplete="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} />

            <button type="submit" disabled={busy} className="noir-btn-cta" style={{ width: '100%', marginTop: 22, padding: 14, fontSize: 15 }}>
              {busy ? t('One moment…') : <>{t('Continue to delivery')} <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="guest-gate-card">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
              <LogIn size={18} style={{ color: 'var(--accent-light)' }} /> {t('Have an account?')}
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
              {t('Sign in to use your saved addresses, points and order history.')}
            </p>
            <Link to="/login" state={{ from: '/checkout' }} className="noir-btn-outline" style={{ width: '100%' }}>
              {t('Sign in')}
            </Link>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14, textAlign: 'center' }}>
              {t('New here?')}{' '}
              <Link to="/register" state={{ from: '/checkout' }} style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{t('Create an account')}</Link>
            </p>
            <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--muted)', marginTop: 22, lineHeight: 1.55 }}>
              <ShieldCheck size={15} style={{ flexShrink: 0, color: 'var(--success)', marginTop: 1 }} />
              {t('Your cart comes with you either way.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// After a guest order: set an email and password to keep the account and see orders later.
export function SaveGuestAccount({ compact = false }) {
  const { t } = useT()
  const { user, isGuest, claimGuest } = useAuth()
  const [email, setEmail] = useState(user?.contactEmail ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!isGuest) return null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError(t('Use at least 8 characters for your password'))
    setBusy(true)
    try {
      await claimGuest(email.trim(), password)
      toast.success(t('Your account is ready. You can sign in any time to see your orders.'))
    } catch (err) {
      setError(err.response?.data?.message ?? t("Couldn't save your account. Please try again."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="guest-gate-card" style={{ textAlign: 'left', marginTop: compact ? 0 : 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{t('Save your details for next time')}</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
        {t('Set a password to track this order from any device and check out faster next time.')}
      </p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <label className="field-label" htmlFor="claim-email">{t('Email')}</label>
      <input id="claim-email" className="noir-input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
      <label className="field-label" htmlFor="claim-password">{t('Password')}</label>
      <input id="claim-password" className="noir-input" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" disabled={busy} className="noir-btn-primary" style={{ width: '100%', marginTop: 16 }}>
        {busy ? t('Saving…') : t('Create my account')}
      </button>
    </form>
  )
}
