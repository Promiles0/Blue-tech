// Single source of truth for help/support links & contact info —
// used by the Footer's HELP column and the header Help dropdown so
// they can't drift out of sync.
export const HELP_LINKS = [
  ['FAQ',      '/help?v=faq'],
  ['Shipping', '/help?v=shipping'],
  ['Returns',  '/help?v=returns'],
  ['Warranty', '/help?v=warranty'],
]

export const SUPPORT_EMAIL = 'bluetech2020@gmail.com'

// WhatsApp click-to-chat number, digits only with country code, no + or spaces
// (e.g. 250XXXXXXXXX). Fill in the real number before shipping this feature.
export const WHATSAPP_NUMBER = '250795593188'

// Shared prefill-message builder for the "Chat on WhatsApp" buttons on the
// product quick view and product detail page, so both stay in sync.
// `price` arrives already formatted (via the currency context's formatPrice) so the
// message quotes the same currency the shopper was looking at, symbol included.
export function buildWhatsAppMessage({ productName, variantLabel, price, qty, productUrl }) {
  const nameLine = variantLabel ? `${productName} (${variantLabel})` : productName
  return [
    "Hi Blue-Tech! I'm interested in this product:",
    '',
    nameLine,
    `Price: ${price}`,
    `Quantity: ${qty}`,
    '',
    productUrl,
    '',
    'Can you tell me more or help me with this order?',
  ].join('\n')
}

export function buildWhatsAppLink(params) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(params))}`
}
