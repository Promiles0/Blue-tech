// Opens the Blue AI assistant (components/site/ChatWidget.jsx) from anywhere — e.g. the
// home page's "Chat with us" button — without threading state through the tree.
const OPEN_EVENT = 'bluechat:open'

export function openLiveChat(prefill) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { prefill } }))
}

export function onLiveChatOpen(handler) {
  const listener = (event) => handler(event.detail ?? {})
  window.addEventListener(OPEN_EVENT, listener)
  return () => window.removeEventListener(OPEN_EVENT, listener)
}
