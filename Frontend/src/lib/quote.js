// Opens the interactive-screens quote form (InteractiveScreensQuote.jsx) from any section
// of that page — hero, configurator, size helper, sticky bar — with optional prefill.
// The AI assistant links to /interactive-screens?quote=1 to open it on arrival.
const OPEN_EVENT = 'quote:open'

export function openQuote(prefill = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: prefill }))
}

export function onQuoteOpen(handler) {
  const listener = (event) => handler(event.detail ?? {})
  window.addEventListener(OPEN_EVENT, listener)
  return () => window.removeEventListener(OPEN_EVENT, listener)
}
