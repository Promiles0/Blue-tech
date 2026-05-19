import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Check } from 'lucide-react'

export default function StickyCartBar({ product, selectedVariant, onAdd, adding, added, visible }) {
  const price = (parseFloat(product?.price) || 0) + (parseFloat(selectedVariant?.priceAdjustment) || 0)
  const outOfStock = selectedVariant && selectedVariant.stockQuantity === 0

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
            background: 'rgba(10,10,10,0.92)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid #1e1e1e',
            padding: '14px 24px',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--price)' }}>${price.toFixed(2)}</span>
              <button
                onClick={onAdd}
                disabled={adding || outOfStock || !selectedVariant}
                className="noir-btn-primary"
                style={{ padding: '11px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}
              >
                {added       ? <><Check size={15} /> Added!</> :
                 outOfStock  ? 'Out of stock' :
                 adding      ? 'Adding…' :
                               <><ShoppingBag size={15} /> Add to cart</>}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
