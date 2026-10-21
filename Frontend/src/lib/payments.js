import { loadStripe } from '@stripe/stripe-js'

// Shared by checkout and the "Complete your payment" panel (components/site/PayForOrder.jsx).

// Stripe's script loads only when someone actually pays by card.
let stripePromise = null
export function getStripe() {
  if (!stripePromise) stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  return stripePromise
}

// Paypack only accepts local-format Rwandan numbers (07XXXXXXXX). Mirrors the backend rule
// so the customer is corrected before anything is charged.
export const normalizeRwandaPhone = (input) => {
  const digits = String(input ?? '').replace(/\D/g, '')
  let local = digits
  if (local.startsWith('250')) local = local.slice(3)
  if (local.length === 9 && local.startsWith('7')) local = `0${local}`
  return /^07[2389]\d{7}$/.test(local) ? local : null
}

export const momoProviderFor = (localPhone) => (/^07[89]/.test(localPhone) ? 'MOMO' : 'AIRTEL_MONEY')

// How long to keep polling a mobile money prompt before saying it's taking a while.
export const MOMO_POLL_INTERVAL_MS = 4000
export const MOMO_POLL_TIMEOUT_MS = 3 * 60 * 1000

export const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: 'var(--text-primary)',
      fontFamily: 'inherit',
      '::placeholder': { color: 'var(--text-muted)' },
    },
    invalid: { color: '#e53e3e' },
  },
}
