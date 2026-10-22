// Invite links (6d): blue-tech.onrender.com/?ref=CODE. The code is kept for 30 days and sent
// with the first checkout; the API decides whether it applies.
const KEY = 'bt_referral'
const DAYS = 30

export function captureReferral() {
  try {
    const code = new URLSearchParams(window.location.search).get('ref')
    if (code && /^[A-Za-z0-9]{4,20}$/.test(code)) localStorage.setItem(KEY, JSON.stringify({ code: code.toUpperCase(), at: Date.now() }))
  } catch { /* storage blocked */ }
}

export function storedReferral() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (saved?.code && Date.now() - saved.at < DAYS * 86400000) return saved.code
  } catch { /* storage blocked */ }
  return null
}

export function clearReferral() {
  try { localStorage.removeItem(KEY) } catch { /* storage blocked */ }
}
