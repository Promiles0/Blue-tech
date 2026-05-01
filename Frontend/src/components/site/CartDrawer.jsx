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
              background: '#0f0f0f', borderLeft: '1px solid #1e1e1e',
              display: 'flex', flexDirection: 'column',
              zIndex: 201,
            }}
          >
            {/* Header */}
            <div style={{
              padding: '22px 24px',
              borderBottom: '1px solid #1e1e1e',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingBag size={18} style={{ color: '#7c5cf0' }} />
                <span style={{ fontSize: 16, fontWeight: 700 }}>Your cart</span>
                {items.length > 0 && (
                  <span style={{ fontSize: 12, color: '#555' }}>({items.length})</span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                style={{ background: 'none', border: 'none', color: '#888', padding: 8, borderRadius: 8, cursor: 'pointer', display: 'flex', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#888'}
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
                  height: '100%', gap: 16, color: '#333',
                }}>
                  <ShoppingBag size={44} />
                  <p style={{ fontSize: 15, color: '#555' }}>Your cart is empty</p>
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
                    const img      = item.product?.images?.find(i => i.primary)?.imageUrl ?? item.product?.images?.[0]?.imageUrl ?? item.product?.imageUrl
                    const unitPrice = parseFloat(item.unitPrice ?? item.price ?? 0)
                    const lineTotal = unitPrice * (item.quantity ?? 1)

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.22 }}
                        style={{
                          display: 'flex', gap: 14, padding: 14, marginBottom: 8,
                          background: '#141414', borderRadius: 12, border: '1px solid #1e1e1e',
                        }}
                      >
                        {img && (
                          <div style={{ width: 70, height: 70, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#1a1a1a' }}>
                            <img src={img} alt={item.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.product?.name}
                          </p>
                          {item.variant?.sizeOrColor && (
                            <p style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>{item.variant.sizeOrColor}</p>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {/* Qty stepper */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #2a2a2a', borderRadius: 8, padding: '4px 10px' }}>
                              <button
                                onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', padding: 2, transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = '#888'}
                              >
                                <Minus size={11} />
                              </button>
                              <span style={{ fontSize: 13, color: '#fff', minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', padding: 2, transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = '#888'}
                              >
                                <Plus size={11} />
                              </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>${lineTotal.toFixed(2)}</span>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = '#333'}
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
              <div style={{ padding: '20px 24px', borderTop: '1px solid #1e1e1e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, color: '#888' }}>Subtotal</span>
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
                  style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: '#444', fontSize: 13, cursor: 'pointer', padding: '8px' }}
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
