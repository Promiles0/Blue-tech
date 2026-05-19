import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useUI } from '../../context/UIContext'

export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI()
  const { items, total, removeFromCart, updateQuantity } = useCart()

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />

          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 'min(420px, 100vw)',
              background: 'var(--bg)', borderLeft: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column',
              zIndex: 201,
            }}
          >
            {/* Header */}
            <div style={{
              padding: '22px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingBag size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 16, fontWeight: 700 }}>Your cart</span>
                {items.length > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--muted-dark)' }}>({items.length})</span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', padding: 8, borderRadius: 8, cursor: 'pointer', display: 'flex', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {items.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  height: '100%', gap: 16, color: 'var(--muted)',
                }}>
                  <ShoppingBag size={44} />
                  <p style={{ fontSize: 15, color: 'var(--muted-dark)' }}>Your cart is empty</p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="noir-btn-outline"
                    style={{ fontSize: 13 }}
                  >
                    Continue shopping
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map(item => {
                    const iid       = item.cartItemId ?? item.id
                    const unitPrice = parseFloat(item.unitPrice ?? 0)
                    const lineTotal = unitPrice * (item.quantity ?? 1)

                    return (
                      <motion.div
                        key={iid}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.22 }}
                        style={{
                          display: 'flex', gap: 12, padding: 14, marginBottom: 8,
                          background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)',
                          alignItems: 'flex-start',
                        }}
                      >
                        {item.productImageUrl && (
                          <div style={{ width: 58, height: 58, borderRadius: 8, overflow: 'hidden', background: 'var(--card)', flexShrink: 0 }}>
                            <img src={item.productImageUrl} alt={item.productName}
                              onError={e => { e.target.style.display = 'none' }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.productName}
                          </p>
                          {item.sizeOrColor && (
                            <p style={{ fontSize: 12, color: 'var(--muted-dark)', marginBottom: 8 }}>{item.sizeOrColor}</p>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px' }}>
                              <button
                                onClick={() => item.quantity > 1 ? updateQuantity(iid, item.quantity - 1) : removeFromCart(iid)}
                                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', padding: 2, transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                              >
                                <Minus size={11} />
                              </button>
                              <span style={{ fontSize: 13, color: 'var(--text)', minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(iid, item.quantity + 1)}
                                disabled={item.stockQuantity != null && item.quantity >= item.stockQuantity}
                                style={{ background: 'none', border: 'none', color: item.stockQuantity != null && item.quantity >= item.stockQuantity ? 'var(--muted-dark)' : 'var(--muted)', cursor: item.stockQuantity != null && item.quantity >= item.stockQuantity ? 'not-allowed' : 'pointer', display: 'flex', padding: 2, transition: 'color 0.15s' }}
                                onMouseEnter={e => { if (!(item.stockQuantity != null && item.quantity >= item.stockQuantity)) e.currentTarget.style.color = 'var(--text)' }}
                                onMouseLeave={e => { if (!(item.stockQuantity != null && item.quantity >= item.stockQuantity)) e.currentTarget.style.color = 'var(--muted)' }}
                              >
                                <Plus size={11} />
                              </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--price)' }}>${lineTotal.toFixed(2)}</span>
                              <button
                                onClick={() => removeFromCart(iid)}
                                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>Subtotal</span>
                  <span style={{ fontSize: 20, fontWeight: 800 }}>${total.toFixed(2)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="noir-btn-primary shine"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '14px', fontSize: 15 }}
                >
                  Checkout →
                </Link>
                <button
                  onClick={() => setCartOpen(false)}
                  style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: 'var(--muted-dark)', fontSize: 13, cursor: 'pointer', padding: '8px' }}
                >
                  Continue shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
