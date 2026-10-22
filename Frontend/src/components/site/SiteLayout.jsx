import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { m as motion, useReducedMotion } from 'framer-motion'
import { Toaster } from 'sonner'
import { useTheme } from '../../context/ThemeContext'
import ScrollProgress   from './ScrollProgress'
import CursorSpotlight  from './CursorSpotlight'
import MarqueeStrip     from './MarqueeStrip'
import Header           from '../Header'
import Footer           from '../Footer'
import NewsletterBand   from './NewsletterBand'
import MobileNav        from './MobileNav'
import { useUI } from '../../context/UIContext'
import { onLiveChatRequested } from '../../lib/liveChat'
import AnalyticsManager from './AnalyticsManager'

// Overlays download the first time they're needed, not with every page.
const CartDrawer       = lazy(() => import('./CartDrawer'))
const CommandPalette   = lazy(() => import('./CommandPalette'))
const ProductQuickView = lazy(() => import('./ProductQuickView'))
const ChatWidget       = lazy(() => import('./ChatWidget'))

// Becomes true the first time `on` is true and stays true (so closing animations still play).
function useOnceTrue(on) {
  const [seen, setSeen] = useState(on)
  if (on && !seen) setSeen(true)
  return seen || on
}
import CompareTray      from './CompareTray'
import MobileTabBar     from './MobileTabBar'

// Toasts sit at the bottom on phones, clear of the header and cart (UX audit C5).
function usePhone() {
  const query = '(max-width: 768px)'
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return phone
}

export default function SiteLayout({ children }) {
  const location = useLocation()
  const reduce   = useReducedMotion()
  const { theme } = useTheme()
  const { cartOpen, paletteOpen, setPaletteOpen, quickViewProduct } = useUI()
  const showCart = useOnceTrue(cartOpen)
  const showPalette = useOnceTrue(paletteOpen)
  const showQuickView = useOnceTrue(Boolean(quickViewProduct))
  const phone = usePhone()

  // Blue's launcher appears once the page has settled, or at once if something asks for it.
  const [chatReady, setChatReady] = useState(false)
  useEffect(() => {
    const ready = () => setChatReady(true)
    const idle = window.requestIdleCallback ? window.requestIdleCallback(ready, { timeout: 2500 }) : setTimeout(ready, 1500)
    const off = onLiveChatRequested(ready)
    return () => { off(); window.cancelIdleCallback ? window.cancelIdleCallback(idle) : clearTimeout(idle) }
  }, [])

  // Ctrl/⌘+K opens search even before the palette's code has loaded.
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(o => !o) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPaletteOpen])

  return (
    <>
      <ScrollProgress />
      <CursorSpotlight />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <Header />
        <MarqueeStrip />


        {/* The page lives inside <main> so search engines and screen readers find it. Keyed by
            path so each page fades in; no exit animation, since the routes inside would already
            show the next page while the old one faded out. */}
          <motion.main
            key={location.pathname}
            style={{ flex: 1 }}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {children}
          </motion.main>
        {/* Hide newsletter on utility/auth pages */}
        {!['/login', '/register', '/account', '/checkout'].some(path => location.pathname.startsWith(path)) && (
          <NewsletterBand />
        )}
        
        <Footer />
      </div>

      {/* Portals / overlays */}
      <Suspense fallback={null}>
        {showCart && <CartDrawer />}
        {showPalette && <CommandPalette />}
        {showQuickView && <ProductQuickView />}
        {chatReady && <ChatWidget />}
      </Suspense>
      <MobileNav />
      <MobileTabBar />
      <AnalyticsManager />
      <CompareTray />

      <Toaster
        theme={theme}
        position={phone ? 'bottom-center' : 'top-right'}
        toastOptions={{
          style: {
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: '13px',
          },
        }}
      />
    </>
  )
}
