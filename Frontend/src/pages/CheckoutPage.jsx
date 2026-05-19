import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircle, ArrowLeft, MapPin, Truck } from 'lucide-react'
import apiService from '../api/service'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { toast } from 'sonner'
import CouponInput from '../components/site/CouponInput'

const SHIPPING = [
  { id: 'STANDARD', label: 'Standard Delivery — 2–5 business days', fee: 0 },
  { id: 'EXPRESS',  label: 'Express Delivery — Same / next day',     fee: 50 },
  { id: 'PICKUP',   label: 'Pick Up — Come to our office',           fee: 0 },
]

export default function CheckoutPage() {
  const { user } = useAuth()
  const { cart, clearCart } = useCart()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [coupon, setCoupon] = useState(null)
  const [done, setDone] = useState(false)
  const paymentRef = useRef(null)

  const shipping = 'STANDARD'
  const payment = 'CARD'
  const [form, setForm] = useState({ street: '', city: '', state: '', zipCode: '', country: 'Rwanda', phone: '' })

  useEffect(() => {
    if (!user) { navigate('/login', { state: { from: '/checkout' } }); return }
    apiService.addresses.list().then(({ data }) => {
      const list = Array.isArray(data) ? data : []
      setAddresses(list)
      const def = list.find(a => a.isDefault) ?? list[0]
      if (def) setSelectedAddressId(def.addressId)
      else setShowNewForm(true)
    }).catch(() => setShowNewForm(true))
  }, [user, navigate])

  useEffect(() => {
    const timerId = setTimeout(() => {
      paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
    return () => clearTimeout(timerId)
  }, [])

  const subtotal    = cart?.items?.reduce((s, i) => s + parseFloat(i.unitPrice ?? 0) * (i.quantity ?? 1), 0) || 0
  const shippingFee = SHIPPING.find(s => s.id === shipping)?.fee ?? 0
  const discount    = coupon
    ? coupon.kind === 'PERCENT' ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value)
    : 0
  const safeDiscount = Math.min(discount, subtotal)
  const total        = Math.max(0, subtotal - safeDiscount + shippingFee)

  function getItemTotal(item) {
    return parseFloat(item.unitPrice ?? 0) * (item.quantity ?? 1)
  }

  const handlePlace = async () => {
    let payload
    if (showNewForm) {
      if (!form.street || !form.city || !form.phone) { toast.error('Fill in required address fields'); return }
      payload = { ...form, shippingMethod: shipping, paymentMethod: payment, couponCode: coupon?.code ?? null }
    } else {
      const addr = addresses.find(a => a.addressId === selectedAddressId)
      if (!addr) { toast.error('Select a shipping address'); return }
      payload = {
        street: addr.streetAddress, city: addr.city,
        state: addr.state ?? '', zipCode: addr.zipCode ?? '',
        country: addr.country, phone: addr.phoneNumber,
        shippingMethod: shipping, paymentMethod: payment,
        couponCode: coupon?.code ?? null,
      }
    }
    setLoading(true)
    try {
      await apiService.orders.checkout(payload)
      await clearCart()
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="fade-in" style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#22c55e' }}>
            <CheckCircle size={40} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>Order Confirmed</h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            Thank you for your purchase. We've received your order and will start preparing it for delivery immediately.
          </p>
          <Link to="/orders" className="noir-btn-primary" style={{ padding: '14px 32px' }}>
            Track my order
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '44px 0 100px' }}>
      <div className="container-noir">
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 28, textDecoration: 'none' }}>
          <ArrowLeft size={13} /> Back to cart
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 64, alignItems: 'start' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 40, letterSpacing: '-0.02em' }}>Checkout</h1>

            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MapPin size={18} style={{ color: 'var(--accent)' }} /> Shipping Address
                </h2>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setShowNewForm((value) => !value)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {showNewForm ? 'Use saved address' : '+ Use new address'}
                  </button>
                )}
              </div>

              {showNewForm ? (
                <div className="fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>STREET ADDRESS</label>
                      <input className="noir-input" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="e.g. 123 Designer Row" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>CITY</label>
                      <input className="noir-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Kigali" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>POSTAL CODE</label>
                      <input className="noir-input" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} placeholder="00000" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>STATE / PROVINCE</label>
                      <input className="noir-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Gasabo" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>COUNTRY</label>
                      <input className="noir-input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Rwanda" />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>PHONE NUMBER</label>
                      <input className="noir-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+250 XXX XXX XXX" />
                      <p style={{ fontSize: 11, color: 'var(--muted-dark)', marginTop: 8 }}>Used only for delivery updates.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {addresses.map((address) => (
                    <div
                      key={address.addressId}
                      onClick={() => setSelectedAddressId(address.addressId)}
                      style={{ background: selectedAddressId === address.addressId ? 'var(--accent-dim)' : 'var(--surface)', border: `1px solid ${selectedAddressId === address.addressId ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 16, padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                    >
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{address.streetAddress}</p>
                      <p style={{ fontSize: 13, color: 'var(--muted)' }}>{address.city}, {address.country}</p>
                      {selectedAddressId === address.addressId && (
                        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }}>
                          <CheckCircle size={20} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Shipping Method */}
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Truck size={18} style={{ color: 'var(--accent)' }} /> Shipping Method
              </h2>
              <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-dim2)', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Standard Delivery</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>Arrival in 2-4 business days</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>FREE</p>
              </div>
            </section>
          </div>

          <aside style={{ position: 'sticky', top: 100 }}>
            <div ref={paymentRef} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>Order Summary</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {cart?.items?.map((item) => (
                  <div key={item.cartItemId ?? item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--muted)' }}>{item.productName} <small>x{item.quantity}</small></span>
                    <span style={{ color: 'var(--text)' }}>${getItemTotal(item).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Coupon code</label>
                  <CouponInput applied={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} />
                </div>
                {coupon && (
                  <p style={{ fontSize: 13, color: 'var(--accent-light)' }}>
                    Discount applied: {coupon.kind === 'PERCENT' ? `${coupon.value}% off` : `$${parseFloat(coupon.value).toFixed(2)} off`}
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                  <span style={{ color: 'var(--text)' }}>${subtotal.toFixed(2)}</span>
                </div>
                {safeDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: 'var(--muted)' }}>Discount</span>
                    <span style={{ color: 'var(--accent-light)' }}>-${safeDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
                  <span style={{ color: 'var(--text)' }}>Total</span>
                  <span style={{ color: 'var(--price)' }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handlePlace} disabled={loading || !cart?.items?.length}
                className="noir-btn-primary shine"
                style={{ width: '100%', padding: '14px', fontSize: 15, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Placing order…' : 'Confirm & Place Order'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
