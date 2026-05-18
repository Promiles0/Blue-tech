import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, Shield, Truck, Headphones } from 'lucide-react'
import { useCart } from '../context/CartContext'
import CouponInput from '../components/site/CouponInput'
import { useState } from 'react'

export default function Cart() {
  const { items, count, total, updateQuantity, removeFromCart, clearCart } = useCart()
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState(null)

  const discount = coupon
    ? coupon.kind === 'PERCENT'
      ? total * (Number(coupon.value) / 100)
      : Number(coupon.value)
    : 0
  const safeDiscount = Math.min(discount, total)
  const orderTotal = Math.max(0, total - safeDiscount)

  if (items.length === 0) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
      <ShoppingBag size={48} style={{ color: '#2a2a2a' }} />
      <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Your cart is empty</p>
      <p style={{ fontSize: 14, color: '#888' }}>Add something beautiful to get started.</p>
      <Link to="/products" className="noir-btn-primary" style={{ padding: '12px 24px' }}>Shop now</Link>
    </div>
  )

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">

        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>Shopping Cart</h1>
          <p style={{ fontSize: 13, color: '#555' }}>
            <Link to="/" style={{ color: '#555', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: '#888' }}>Shopping Cart</span>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>

          {/* ── Left: Table ── */}
          <div>
            {/* Unified table */}
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden' }}>

              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px',
                padding: '11px 20px',
                background: 'rgba(124,92,240,0.08)',
                borderBottom: '1px solid #1a1a1a',
              }}>
                {['Product', 'Price', 'Quantity', 'Subtotal', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c5cf0', textAlign: i >= 2 ? 'center' : 'left' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {items.map((item, idx) => {
                const price = parseFloat(item.unitPrice ?? 0)
                const img   = item.productImageUrl ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80'
                return (
                  <div key={item.cartItemId} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px',
                    alignItems: 'center', padding: '16px 20px',
                    borderBottom: idx < items.length - 1 ? '1px solid #1a1a1a' : 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Product */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                        <img src={img} alt={item.productName}
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80' }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{item.productName}</p>
                        {item.sizeOrColor && <p style={{ fontSize: 11, color: '#555' }}>{item.sizeOrColor}</p>}
                      </div>
                    </div>

                    {/* Price */}
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b' }}>${price.toFixed(2)}</span>

                    {/* Quantity */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, width: 'fit-content', margin: '0 auto' }}>
                      <QtyBtn onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}><Minus size={12} /></QtyBtn>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', width: 28, textAlign: 'center', userSelect: 'none' }}>{item.quantity}</span>
                      <QtyBtn onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}><Plus size={12} /></QtyBtn>
                    </div>

                    {/* Subtotal */}
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', textAlign: 'center' }}>${(price * item.quantity).toFixed(2)}</span>

                    {/* Remove */}
                    <button onClick={() => removeFromCart(item.cartItemId)}
                      style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6, transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#444'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Coupon + Clear — compact row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '6px 12px', width: 280 }}>
                <Tag size={13} style={{ color: '#7c5cf0', flexShrink: 0 }} />
                <CouponInput applied={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} compact />
              </div>
              <button onClick={clearCart}
                style={{ fontSize: 12, color: '#555', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: '4px 0' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#555'}
              >
                Clear cart
              </button>
            </div>

            {/* Trust strip — minimal */}
            <div style={{ display: 'flex', gap: 24, marginTop: 28, paddingTop: 20, borderTop: '1px solid #1a1a1a' }}>
              {[
                { icon: <Truck size={14} />, label: 'Free shipping on all orders' },
                { icon: <Shield size={14} />, label: 'Secure & encrypted payment' },
                { icon: <Headphones size={14} />, label: '24/7 customer support' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ color: '#7c5cf0' }}>{icon}</span>
                  <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, padding: 24, position: 'sticky', top: 90 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1a1a1a' }}>Order Summary</h2>

            <SummaryRow label="Items" value={count} />
            <SummaryRow label="Sub Total" value={`$${total.toFixed(2)}`} />
            <SummaryRow label="Shipping" value="Free" />
            {safeDiscount > 0 && <SummaryRow label="Coupon Discount" value={`-$${safeDiscount.toFixed(2)}`} accent />}

            <div style={{ borderTop: '1px solid #1a1a1a', margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>${orderTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="noir-btn-primary shine"
              style={{ width: '100%', padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>

            <Link to="/products" style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: 12, color: '#555', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#555'}
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
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: '#666', padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
      onMouseLeave={e => e.currentTarget.style.color = '#666'}
    >
      {children}
    </button>
  )
}

function SummaryRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: '#666' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: accent ? '#a78bfa' : '#fff' }}>{value}</span>
    </div>
  )
}
