// Reports crashes in the customer's browser to the API (Admin → Site errors), so a broken
// page is noticed by the team before customers complain. Uses fetch directly — never the
// axios client — so a failing API call can't trigger an endless loop of reports.
const API = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || '/functions/v1/api'
const RELEASE = typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : 'dev'
const RELOAD_KEY = 'bt-chunk-reload'
const sent = new Set()
let budget = 10 // per page load

// After a deploy, a phone still running the old version asks for code files that no longer
// exist. Reloading once picks up the new version instead of leaving a broken page.
export function isChunkLoadError(error) {
  const msg = String(error?.message ?? error ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Unable to preload CSS/i.test(msg)
}

export function reloadForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < 60_000) return false // already tried — don't loop
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch { /* storage blocked: still try once */ }
  window.location.reload()
  return true
}

export function reportError(error, extra = {}) {
  try {
    if (import.meta.env.DEV) return
    const message = String(error?.message ?? error ?? 'Unknown error').slice(0, 500)
    // Noise from browser extensions and cancelled requests isn't a bug in the site.
    if (/ResizeObserver loop|Script error\.?$|extension:\/\/|AbortError|canceled/i.test(message + (error?.stack ?? ''))) return
    const key = message + (extra.componentStack ?? '').slice(0, 80)
    if (sent.has(key) || budget <= 0) return
    sent.add(key)
    budget -= 1
    fetch(`${API}/client-errors`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        stack: String(error?.stack ?? '').slice(0, 3500) + (extra.componentStack ? `\nComponent:${extra.componentStack.slice(0, 500)}` : ''),
        url: window.location.href,
        release: RELEASE,
      }),
    }).catch(() => { /* reporting must never break the page */ })
  } catch { /* never throw from the reporter */ }
}

export function installErrorReporter() {
  window.addEventListener('error', (event) => {
    const error = event.error ?? event.message
    if (isChunkLoadError(error) && reloadForNewVersion()) return
    reportError(error)
  })
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    if (isChunkLoadError(error) && reloadForNewVersion()) return
    reportError(error)
  })
}
