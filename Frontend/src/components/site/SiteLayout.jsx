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
  return (
    <>
      <ScrollProgress />
      <CursorSpotlight />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
        <Header />
        <MarqueeStrip />
        <main style={{ flex: 1 }}>
          {children}
        </main>
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
