import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, count, total, updateQuantity, removeFromCart } = useCart()
  const navigate  = useNavigate()

  if (items.length === 0) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
      <ShoppingBag size={48} style={{ color: '#2a2a2a' }} />
      <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Your cart is empty</p>
      <p style={{ fontSize: 14, color: '#888' }}>Add something beautiful to get started.</p>
      <Link to="/products" className="noir-btn-primary" style={{ padding: '12px 24px' }}>Shop now</Link>
    </div>
  )

  const shipping = total >= 100 ? 0 : 9.99
  const tax      = total * 0.08
  const orderTotal = total + shipping + tax

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>Your cart</h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 40 }}>{count} item{count !== 1 ? 's' : ''}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => {
              const img  = item.variant?.product?.images?.[0]?.imageUrl ?? item.imageUrl ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80'
              const name = item.variant?.product?.name ?? item.productName ?? 'Product'
              const opts = item.variant?.sizeOrColor
              const price = parseFloat(item.unitPrice ?? item.price ?? 0)

              return (
                <div key={item.id} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 12, padding: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ width: 88, height: 88, borderRadius: 10, overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                    <img src={img} alt={name} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                    {opts && <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{opts}</p>}
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>${(price * item.quantity).toFixed(2)}</p>
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 8, padding: '2px 4px' }}>
                    <QtyBtn onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></QtyBtn>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', width: 28, textAlign: 'center' }}>{item.quantity}</span>
                    <QtyBtn onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></QtyBtn>
                  </div>

                  <button onClick={() => removeFromCart(item.id)}
                    style={{ background: 'none', border: 'none', color: '#888', padding: 8, cursor: 'pointer', borderRadius: 6, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#888'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}

            <button
              onClick={() => items.forEach(i => removeFromCart(i.id))}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', alignSelf: 'flex-start', padding: '4px 0', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#888'}
            >
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, padding: 28, position: 'sticky', top: 80 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Order summary</h2>
            <Row label="Subtotal"  value={`$${total.toFixed(2)}`} />
            <Row label="Shipping"  value={shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`} />
            <Row label="Tax (8%)"  value={`$${tax.toFixed(2)}`} />
            <div style={{ borderTop: '1px solid #2a2a2a', margin: '16px 0' }} />
            <Row label="Total" value={`$${orderTotal.toFixed(2)}`} bold />

            {shipping > 0 && (
              <p style={{ fontSize: 12, color: '#888', marginTop: 12, lineHeight: 1.5 }}>
                Add ${(100 - total).toFixed(2)} more to get free shipping.
              </p>
            )}

            <button
              onClick={() => navigate('/checkout')}
              className="noir-btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 20 }}
            >
              Checkout <ArrowRight size={16} />
            </button>

            <Link to="/products" style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: 13, color: '#888', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#888'}
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
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: '#888', padding: '6px 8px', cursor: 'pointer', display: 'flex', borderRadius: 6, transition: 'color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
      onMouseLeave={e => e.currentTarget.style.color = '#888'}
    >
      {children}
    </button>
  )
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 14, color: bold ? '#fff' : '#888', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#fff', fontWeight: bold ? 800 : 500 }}>{value}</span>
    </div>
  )
}
