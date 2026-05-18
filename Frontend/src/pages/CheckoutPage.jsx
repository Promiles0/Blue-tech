import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircle, ArrowLeft, MapPin, Truck, CreditCard } from 'lucide-react'
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

const PAYMENT_OPTIONS = [
  { id: 'CARD',         label: 'Credit / Debit Card',  pickupOnly: false },
  { id: 'MOMO',         label: 'MoMo (MTN)',           pickupOnly: false },
  { id: 'AIRTEL_MONEY', label: 'Airtel Money',         pickupOnly: false },
  { id: 'CASH',         label: 'Cash on Pickup',       pickupOnly: true  },
  { id: 'CHEQUE',       label: 'Cheque on Pickup',     pickupOnly: true  },
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
  const [shipping, setShipping] = useState('STANDARD')
  const [payment, setPayment] = useState('CARD')
  const [done, setDone] = useState(false)
  const paymentRef = useRef(null)

  const [form, setForm]         = useState({ street: '', city: '', state: '', zipCode: '', country: 'Rwanda', phone: '' })
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvv: '' })
  const [mobileNum, setMobileNum] = useState('')

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
    if (shipping !== 'PICKUP' && (payment === 'CASH' || payment === 'CHEQUE')) setPayment('CARD')
    setTimeout(() => paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }, [shipping])

  const subtotal    = cart?.items?.reduce((s, i) => s + parseFloat(i.unitPrice ?? 0) * (i.quantity ?? 1), 0) || 0
  const shippingFee = SHIPPING.find(s => s.id === shipping)?.fee ?? 0
  const discount    = coupon
    ? coupon.kind === 'PERCENT' ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value)
    : 0
  const safeDiscount = Math.min(discount, subtotal)
  const total        = Math.max(0, subtotal - safeDiscount + shippingFee)

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

  if (done) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#22c55e' }}>
          <CheckCircle size={36} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 10 }}>Order Confirmed</h1>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Thank you! Your order is being prepared. We'll notify you once it's on the way.
        </p>
        <Link to="/orders" className="noir-btn-primary" style={{ padding: '13px 32px' }}>Track my order</Link>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '44px 0 100px' }}>
      <div className="container-noir">
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', marginBottom: 28, textDecoration: 'none' }}>
          <ArrowLeft size={13} /> Back to cart
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'start' }}>

          {/* ── Left ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Checkout</h1>

            {/* Shipping Address */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <SectionLabel icon={<MapPin size={14} />} text="Shipping Address" />
                {addresses.length > 0 && (
                  <button onClick={() => setShowNewForm(v => !v)}
                    style={{ fontSize: 12, color: '#7c5cf0', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showNewForm ? 'Use saved' : '+ New address'}
                  </button>
                )}
              </div>

              {showNewForm ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <FieldLabel>Street Address</FieldLabel>
                    <input className="noir-input" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="123 Main Street" />
                  </div>
                  <div>
                    <FieldLabel>City</FieldLabel>
                    <input className="noir-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Kigali" />
                  </div>
                  <div>
                    <FieldLabel>Postal Code</FieldLabel>
                    <input className="noir-input" value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} placeholder="00000" />
                  </div>
                  <div>
                    <FieldLabel>State / Province</FieldLabel>
                    <input className="noir-input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Gasabo" />
                  </div>
                  <div>
                    <FieldLabel>Country</FieldLabel>
                    <input className="noir-input" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Rwanda" />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <FieldLabel>Phone Number</FieldLabel>
                    <input className="noir-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+250 7XX XXX XXX" />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {addresses.map(a => (
                    <div key={a.addressId} onClick={() => setSelectedAddressId(a.addressId)}
                      style={{ padding: '14px 18px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                        background: selectedAddressId === a.addressId ? 'rgba(124,92,240,0.06)' : '#111',
                        border: `1px solid ${selectedAddressId === a.addressId ? '#7c5cf0' : '#1a1a1a'}` }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{a.streetAddress}</p>
                      <p style={{ fontSize: 12, color: '#555' }}>{a.city}, {a.country}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Shipping Method */}
            <section>
              <SectionLabel icon={<Truck size={14} />} text="Shipping Method" />
              <div style={{ marginTop: 12, position: 'relative' }}>
                <select value={shipping} onChange={e => setShipping(e.target.value)} className="noir-input"
                  style={{ width: '100%', appearance: 'none', cursor: 'pointer', paddingRight: 32 }}>
                  {SHIPPING.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}{s.fee > 0 ? ` (+$${s.fee}.00)` : ' (Free)'}
                    </option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none', fontSize: 12 }}>▾</span>
              </div>
            </section>

            {/* Payment Method */}
            <section ref={paymentRef}>
              <SectionLabel icon={<CreditCard size={14} />} text="Payment Method" />
              <div style={{ marginTop: 12, position: 'relative' }}>
                <select value={payment} onChange={e => setPayment(e.target.value)} className="noir-input"
                  style={{ width: '100%', appearance: 'none', cursor: 'pointer', paddingRight: 32 }}>
                  {PAYMENT_OPTIONS.filter(p => shipping === 'PICKUP' ? true : !p.pickupOnly).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none', fontSize: 12 }}>▾</span>
              </div>

              {/* Card fields */}
              {payment === 'CARD' && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <FieldLabel>Cardholder Name</FieldLabel>
                    <input className="noir-input" value={cardForm.name}
                      onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                      placeholder="John Doe" />
                  </div>
                  <div>
                    <FieldLabel>Card Number</FieldLabel>
                    <input className="noir-input" value={cardForm.number} maxLength={19}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                        setCardForm({ ...cardForm, number: v.replace(/(\d{4})(?=\d)/g, '$1 ') })
                      }}
                      placeholder="0000 0000 0000 0000" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <FieldLabel>Expiry</FieldLabel>
                      <input className="noir-input" value={cardForm.expiry} maxLength={5}
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                          if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
                          setCardForm({ ...cardForm, expiry: v })
                        }}
                        placeholder="MM/YY" />
                    </div>
                    <div>
                      <FieldLabel>CVV</FieldLabel>
                      <input className="noir-input" value={cardForm.cvv} maxLength={4} type="password"
                        onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        placeholder="•••" />
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile money field */}
              {(payment === 'MOMO' || payment === 'AIRTEL_MONEY') && (
                <div style={{ marginTop: 16 }}>
                  <FieldLabel>{payment === 'MOMO' ? 'MTN MoMo' : 'Airtel'} Phone Number</FieldLabel>
                  <input className="noir-input" value={mobileNum}
                    onChange={e => setMobileNum(e.target.value)}
                    placeholder="+250 7XX XXX XXX" />
                  <p style={{ fontSize: 11, color: '#555', marginTop: 6 }}>A payment prompt will be sent to this number.</p>
                </div>
              )}

              {/* Cash / Cheque note */}
              {(payment === 'CASH' || payment === 'CHEQUE') && (
                <p style={{ fontSize: 12, color: '#555', marginTop: 12, lineHeight: 1.6 }}>
                  {payment === 'CASH'
                    ? 'Bring exact cash when you come to collect your order.'
                    : 'Bring a valid cheque payable to our store when collecting.'}
                </p>
              )}
            </section>
          </div>

          {/* ── Right: Summary ── */}
          <aside style={{ position: 'sticky', top: 90 }}>
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1a1a1a' }}>
                Order Summary
              </h3>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {cart?.items?.map(item => (
                  <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#888' }}>{item.productName} <span style={{ color: '#555' }}>×{item.quantity}</span></span>
                    <span style={{ color: '#fff' }}>${(parseFloat(item.unitPrice ?? 0) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '7px 12px', marginBottom: 20 }}>
                <CouponInput applied={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} compact />
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <Row label="Subtotal" value={`$${subtotal.toLocaleString()}`} />
                <Row label="Shipping" value={shippingFee > 0 ? `+$${shippingFee}.00` : 'Free'} />
                {safeDiscount > 0 && <Row label="Discount" value={`-$${safeDiscount.toLocaleString()}`} accent />}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #1a1a1a' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>${total.toLocaleString()}</span>
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

function SectionLabel({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ color: '#7c5cf0' }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{text}</span>
    </div>
  )
}

function FieldLabel({ children }) {
  return <label style={{ display: 'block', fontSize: 11, color: '#555', marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{children}</label>
}

function Row({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: '#666' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: accent ? '#a78bfa' : '#fff' }}>{value}</span>
    </div>
  )
}
