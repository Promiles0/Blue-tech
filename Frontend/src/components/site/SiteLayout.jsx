import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Toaster } from 'sonner'
import { useTheme } from '../../context/ThemeContext'
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
  const { theme } = useTheme()

  return (
    <>
      <ScrollProgress />
      <CursorSpotlight />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
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
          </motion.main>
            {children}
        </AnimatePresence>
        {/* Hide newsletter on utility/auth pages */}
        {!['/login', '/register', '/account', '/checkout'].some(path => location.pathname.startsWith(path)) && (
          <NewsletterBand />
        )}
        
        <Footer />
      </div>

      {/* Portals / overlays */}
      <CartDrawer />
      <CommandPalette />
      <MobileNav />
      <ProductQuickView />

      <Toaster
        theme={theme}
        position="top-right"
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
