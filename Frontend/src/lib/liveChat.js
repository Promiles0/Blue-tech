// Opens the Blue AI assistant (components/site/ChatWidget.jsx) from anywhere — e.g. the
// home page's "Chat with us" button — without threading state through the tree.
// `prefill` puts text in the input; with { send: true } it is asked straight away.
const OPEN_EVENT = 'bluechat:open'
// The chat widget loads a moment after the page; a request made before then waits here.
let pending = null
let listeners = 0
const REQUEST_EVENT = 'bluechat:requested'

export function openLiveChat(prefill, { send = false } = {}) {
  if (typeof window === 'undefined') return
  if (!listeners) {
    pending = { prefill, send }
    window.dispatchEvent(new Event(REQUEST_EVENT))
    return
  }
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { prefill, send } }))
}

export function onLiveChatOpen(handler) {
  const listener = (event) => handler(event.detail ?? {})
  window.addEventListener(OPEN_EVENT, listener)
  listeners += 1
  if (pending) { const p = pending; pending = null; setTimeout(() => handler(p), 0) }
  return () => { listeners -= 1; window.removeEventListener(OPEN_EVENT, listener) }
}

// Lets the page load the widget early when someone asks for it before it's ready.
export function onLiveChatRequested(handler) {
  window.addEventListener(REQUEST_EVENT, handler)
  return () => window.removeEventListener(REQUEST_EVENT, handler)
}
