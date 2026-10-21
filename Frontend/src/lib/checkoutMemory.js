// Faster checkout (1d): what a signed-in customer chose last time — payment method, MoMo
// number, address and delivery speed — kept on their own device only, per account, so a
// returning customer can pay in a few taps. Never holds card details.
const key = (userId) => `bt-checkout-${userId}`

export function loadCheckoutMemory(userId) {
  if (!userId) return {}
  try { return JSON.parse(localStorage.getItem(key(userId)) ?? '{}') ?? {} } catch { return {} }
}

export function saveCheckoutMemory(userId, { paymentMethod, momoPhone, addressId, shippingMethod }) {
  if (!userId) return
  try {
    localStorage.setItem(key(userId), JSON.stringify({
      paymentMethod, shippingMethod,
      momoPhone: ['MOMO', 'AIRTEL_MONEY'].includes(paymentMethod) ? momoPhone : loadCheckoutMemory(userId).momoPhone,
      addressId: addressId ?? null,
    }))
  } catch { /* storage blocked: nothing to remember */ }
}
