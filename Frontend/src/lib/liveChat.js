import { useEffect, useState } from 'react'

// Opens the Tawk.to widget loaded in index.html. autoStart:false there means it never shows
// itself on page load — this is the only thing that starts and reveals it.
export function openLiveChat() {
  const api = typeof window !== 'undefined' ? window.Tawk_API : null
  if (!api) return
  // autoStart is false (index.html) so the widget hasn't connected or rendered yet — start()
  // with showWidget:true both connects it and reveals it; maximize() then opens the full chat
  // window instead of just the small bubble. Safe to call repeatedly (e.g. reopening later).
  if (typeof api.start === 'function') api.start({ showWidget: true })
  else if (typeof api.showWidget === 'function') api.showWidget()
  if (typeof api.maximize === 'function') api.maximize()
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
