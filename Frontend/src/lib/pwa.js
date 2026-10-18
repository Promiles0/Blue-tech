import { useSyncExternalStore } from 'react'

// Registers the service worker (production only — in dev it would cache Vite's live files)
// and exposes the browser's "install this app" prompt to the UI.
let deferredPrompt = null
const listeners = new Set()
const notify = () => listeners.forEach((l) => l())

export function registerPwa() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* site still works without it */ })
    })
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // show our own button instead of the browser's mini-bar
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => { deferredPrompt = null; notify() })
}

export async function promptInstall() {
  if (!deferredPrompt) return false
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  notify()
  return outcome === 'accepted'
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
export const useCanInstall = () => useSyncExternalStore(subscribe, () => !!deferredPrompt, () => false)

// iPhone/iPad Safari never fires beforeinstallprompt; it needs "Share → Add to Home Screen".
export const isIosSafari = () => typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent) &&
  !window.matchMedia?.('(display-mode: standalone)').matches
