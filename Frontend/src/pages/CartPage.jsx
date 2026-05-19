import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, count, total, updateQuantity, removeFromCart, clearCart } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
      <ShoppingBag size={48} style={{ color: 'var(--border)' }} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Your cart is empty</p>
      <p style={{ fontSize: 14, color: 'var(--muted)' }}>Add something beautiful to get started.</p>
      <Link to="/products" className="noir-btn-primary" style={{ padding: '12px 24px' }}>Shop now</Link>
    </div>
  )

  const shipping   = 0
  const tax        = 0
  const orderTotal = total

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">
        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>Your cart</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 40 }}>{count} item{count !== 1 ? 's' : ''}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => {
              const img   = item.productImageUrl ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80'
              const name  = item.productName ?? 'Product'
              const opts  = item.sizeOrColor
              const price = parseFloat(item.unitPrice ?? 0)
              const id    = item.cartItemId

              return (
                <div key={id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', gap: 18, alignItems: 'center' }}>

                  <div style={{ width: 88, height: 88, borderRadius: 10, overflow: 'hidden', background: 'var(--card)', flexShrink: 0 }}>
                    <img
                      src={img}
                      alt={name}
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                    {opts && <p style={{ fontSize: 12, color: 'var(--muted-dark)', marginBottom: 6 }}>{opts}</p>}
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--price)' }}>${(price * item.quantity).toFixed(2)}</p>
                    {item.quantity > 1 && (
                      <p style={{ fontSize: 11, color: 'var(--muted-dark)', marginTop: 2 }}>${price.toFixed(2)} each</p>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden', flexShrink: 0 }}>
                    <QtyBtn onClick={() => updateQuantity(id, item.quantity - 1)}>
                      <Minus size={13} />
                    </QtyBtn>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', width: 32, textAlign: 'center', userSelect: 'none' }}>{item.quantity}</span>
                    <QtyBtn onClick={() => updateQuantity(id, item.quantity + 1)}>
                      <Plus size={13} />
                    </QtyBtn>
                  </div>

                  <button
                    onClick={() => removeFromCart(id)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted-dark)', padding: 8, cursor: 'pointer', borderRadius: 7, transition: 'color 0.2s, background 0.2s', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-dark)'; e.currentTarget.style.background = 'none' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}

            <button
              onClick={clearCart}
              style={{ background: 'none', border: 'none', color: 'var(--muted-dark)', fontSize: 13, cursor: 'pointer', alignSelf: 'flex-start', padding: '4px 0', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}
            >
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, position: 'sticky', top: 80 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 24 }}>Order summary</h2>
            <Row label="Subtotal"  value={`$${total.toFixed(2)}`} />
            <Row label="Shipping"  value="Free" />
            <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />
            <Row label="Total" value={`$${orderTotal.toFixed(2)}`} bold />

            {shipping > 0 && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>
                Add ${(100 - total).toFixed(2)} more for free shipping.
              </p>
            )}

            <button
              onClick={() => navigate('/checkout')}
              className="noir-btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 20 }}
            >
              Checkout <ArrowRight size={16} />
            </button>

            <Link
              to="/products"
              style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--muted-dark)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function QtyBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', color: 'var(--muted)', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
    >
      {children}
    </button>
  )
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 14, color: bold ? '#fff' : 'var(--muted)', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: bold ? 800 : 500 }}>{value}</span>
    </div>
  )
}
