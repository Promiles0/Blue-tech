import { useEffect } from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
import { useT } from '../../lib/i18n'
import { ShoppingBag, Check } from 'lucide-react'
import { useCurrency } from '../../context/CurrencyContext'

export default function StickyCartBar({ product, selectedVariant, onAdd, adding, added, visible }) {
  const { t } = useT()
  const { formatPrice } = useCurrency()
  const price = (parseFloat(product?.price) || 0) + (parseFloat(selectedVariant?.priceAdjustment) || 0)
  const outOfStock = selectedVariant && selectedVariant.stockQuantity === 0

  // Floating buttons (Blue's chat, compare tray) move up while the bar is showing,
  // so they never sit on top of "Add to cart" (UX audit A6).
  useEffect(() => {
    document.body.classList.toggle('has-sticky-bar', Boolean(visible))
    return () => document.body.classList.remove('has-sticky-bar')
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={{    y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            zIndex: 50,
            background: 'var(--bg-navbar)',
            borderTop: '1px solid var(--border)',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.18)',
            padding: '12px 16px max(12px, env(safe-area-inset-bottom))',
          }}
        >
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {product?.name}
              </p>
              {selectedVariant?.sizeOrColor && (
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{selectedVariant.sizeOrColor}</p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              <span style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 900, color: 'var(--price)', whiteSpace: 'nowrap' }}>{formatPrice(price)}</span>
              <button
                onClick={onAdd}
                disabled={adding || outOfStock || !selectedVariant}
                className="noir-btn-cta"
                style={{ padding: '12px 20px', minHeight: 44, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}
              >
                {added       ? <><Check size={15} /> {t('Added!')}</> :
                 outOfStock  ? t('Out of stock') :
                 adding      ? t('Adding…') :
                               <><ShoppingBag size={15} /> {t('Add to cart')}</>}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
