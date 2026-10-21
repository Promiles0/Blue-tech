// Google Analytics 4 and Meta Pixel (6e) — only when the owner has entered an ID in
// Admin → Settings AND the visitor has accepted on the consent banner. Until both are true,
// nothing is downloaded and every track() call is dropped.
const CONSENT_KEY = 'bt-consent' // 'granted' | 'denied'
let ids = { ga4Id: '', metaPixelId: '' }
let loaded = false

export function getConsent() {
  try { return localStorage.getItem(CONSENT_KEY) } catch { return null }
}

export function setConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value) } catch { /* remembered for this visit only */ }
  if (value === 'granted') load()
}

export function analyticsConfigured() {
  return Boolean(ids.ga4Id || ids.metaPixelId)
}

export function configureAnalytics(next = {}) {
  ids = { ga4Id: next.ga4Id || '', metaPixelId: next.metaPixelId || '' }
  if (getConsent() === 'granted') load()
}

function addScript(src) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

function load() {
  if (loaded || !analyticsConfigured() || typeof window === 'undefined') return
  loaded = true
  if (ids.ga4Id) {
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() { window.dataLayer.push(arguments) } // eslint-disable-line prefer-rest-params
    window.gtag('js', new Date())
    // Page views are sent by the app on each route change (it's a single-page app).
    window.gtag('config', ids.ga4Id, { send_page_view: false, anonymize_ip: true })
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids.ga4Id)}`)
  }
  if (ids.metaPixelId && !window.fbq) {
    // Meta's standard loader: a queueing stub until fbevents.js arrives.
    const fbq = function fbq() { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments) } // eslint-disable-line prefer-rest-params
    fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = []
    window.fbq = fbq
    window._fbq = fbq
    addScript('https://connect.facebook.net/en_US/fbevents.js')
    window.fbq('init', ids.metaPixelId)
  }
}

const PIXEL_EVENT = { page_view: 'PageView', view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'Purchase' }

// track('view_item', { value, items: [{ id, name, price, quantity }], transactionId })
export function track(event, { value, items = [], transactionId } = {}) {
  if (!loaded) return
  try {
    if (window.gtag && ids.ga4Id) {
      window.gtag('event', event, event === 'page_view'
        ? { page_location: window.location.href, page_title: document.title }
        : {
            currency: 'RWF', value: Number(value) || 0, transaction_id: transactionId,
            items: items.map((i) => ({ item_id: String(i.id), item_name: i.name, price: Number(i.price) || 0, quantity: i.quantity ?? 1 })),
          })
    }
    if (window.fbq && ids.metaPixelId && PIXEL_EVENT[event]) {
      window.fbq('track', PIXEL_EVENT[event], event === 'page_view' ? undefined : {
        currency: 'RWF', value: Number(value) || 0, content_type: 'product', content_ids: items.map((i) => String(i.id)),
      })
    }
  } catch { /* analytics must never break the shop */ }
}

// A purchase is counted once per order, even if the confirmation page is reloaded.
export function trackPurchaseOnce(order) {
  if (!order?.orderId) return
  try {
    const key = `bt-purchase-${order.orderId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch { /* fall through */ }
  track('purchase', {
    transactionId: String(order.orderId),
    value: order.totalAmount,
    items: (order.items ?? []).map((i) => ({ id: i.productId, name: i.productName, price: i.priceAtPurchase, quantity: i.quantity })),
  })
}
