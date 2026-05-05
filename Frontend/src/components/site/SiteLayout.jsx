import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Toaster } from 'sonner'
import ScrollProgress   from './ScrollProgress'
import CursorSpotlight  from './CursorSpotlight'
import MarqueeStrip     from './MarqueeStrip'
import Header           from '../Header'
import Footer           from '../Footer'
import NewsletterBand   from './NewsletterBand'
import CartDrawer       from './CartDrawer'
import CommandPalette   from './CommandPalette'
import MobileNav        from './MobileNav'
import ProductQuickView from './ProductQuickView'

export default function SiteLayout({ children }) {
  const location = useLocation()
  const reduce   = useReducedMotion()

  return (
    <>
      <ScrollProgress />
      <CursorSpotlight />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
        <Header />
        <MarqueeStrip />

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            style={{ flex: 1 }}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? {} : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <NewsletterBand />
        <Footer />
      </div>

      {/* Portals / overlays */}
      <CartDrawer />
      <CommandPalette />
      <MobileNav />
      <ProductQuickView />

      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#141414',
            border: '1px solid #262626',
            color: '#fff',
            fontSize: '13px',
          },
        }}
      />
    </>
  )
}
