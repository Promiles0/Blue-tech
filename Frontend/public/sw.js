// Blue-Tech service worker: makes the store installable and usable on weak connections.
//
// - App files (/assets/* — content-hashed by Vite, so they never change): cache-first.
// - Product images and fonts: stale-while-revalidate (show the saved copy, refresh it quietly).
// - Pages: network-first, falling back to the last saved copy of the app when offline.
// - API calls (Supabase functions), payments and anything not GET: never cached — prices,
//   stock and checkout must always be live.
const VERSION = 'bt-v1'
const SHELL = `${VERSION}-shell`
const ASSETS = `${VERSION}-assets`
const MEDIA = `${VERSION}-media`
const PRECACHE = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/app-icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const isApi = (url) => url.pathname.includes('/functions/v1/') || url.hostname.endsWith('supabase.co') && !url.pathname.includes('/storage/v1/object/public/')
const isPayment = (url) => /stripe\.com|paypack/.test(url.hostname)
const isMedia = (req, url) => req.destination === 'image' || req.destination === 'font' ||
  url.pathname.includes('/storage/v1/object/public/') || url.hostname.includes('fonts.g')

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (isApi(url) || isPayment(url)) return
  if (url.pathname.startsWith('/videos/')) return // large; let the browser stream them

  // Pages: try the network, keep a copy, fall back to the cached app shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(SHELL).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // Hashed build files never change: serve from cache once fetched.
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(ASSETS).then((c) => c.put(req, copy)) }
        return res
      })),
    )
    return
  }

  // Images and fonts: answer from cache immediately, refresh in the background.
  if (isMedia(req, url)) {
    event.respondWith(
      caches.open(MEDIA).then((cache) => cache.match(req).then((hit) => {
        const refresh = fetch(req).then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone())
          return res
        }).catch(() => hit)
        return hit || refresh
      })),
    )
  }
})
