import { useEffect, useState } from 'react'

// Opens the Tawk.to widget loaded in index.html (its default bubble is hidden there —
// this is the only way to open it, via our own "Chat with us" button).
export function openLiveChat() {
  const api = typeof window !== 'undefined' ? window.Tawk_API : null
  if (!api) return
  // hideWidget() (in index.html) put Tawk itself into a hidden state, not just our CSS —
  // undo that first so toggle/maximize actually has something to show.
  if (typeof api.showWidget === 'function') api.showWidget()
  if (typeof api.toggle === 'function') api.toggle()
  else if (typeof api.maximize === 'function') api.maximize()
}

function isLiveChatReady() {
  const api = typeof window !== 'undefined' ? window.Tawk_API : null
  return !!(api && (typeof api.toggle === 'function' || typeof api.maximize === 'function'))
}

// True once Tawk.to has finished loading (fires window's 'tawk:ready' event from index.html).
// Starts already-true if the widget loaded before this component mounted.
export function useLiveChatReady() {
  const [ready, setReady] = useState(isLiveChatReady)
  useEffect(() => {
    if (ready) return
    const onReady = () => setReady(true)
    window.addEventListener('tawk:ready', onReady)
    return () => window.removeEventListener('tawk:ready', onReady)
  }, [ready])
  return ready
}
