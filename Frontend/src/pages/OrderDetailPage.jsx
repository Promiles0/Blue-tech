import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, MapPin, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import apiService from '../api/service'

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const STATUS_STYLES = {
  PENDING:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
  PROCESSING: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
  SHIPPED:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  DELIVERED:  { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
  CANCELLED:  { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
}

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : null
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiService.orders.getOrderDetails(id)
      .then(({ data }) => setOrder(data))
      .catch(() => setError('Order not found or access denied.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ padding: '80px 24px', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[120, 80, 200].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 16 }} />)}
    </div>
  )

  if (error || !order) return (
    <div style={{ padding: '80px 24px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
      <p style={{ color: '#555', marginBottom: 16 }}>{error || 'Order not found.'}</p>
      <Link to="/orders" style={{ color: '#7c5cf0', fontSize: 14 }}>← Back to orders</Link>
    </div>
  )

  const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING
  const stepIdx = order.status === 'CANCELLED' ? -1 : STATUS_STEPS.indexOf(order.status)

  const timeline = [
    { key: 'PENDING',    label: 'Order Placed',  sub: fmtDate(order.createdAt),   icon: Clock        },
    { key: 'PROCESSING', label: 'Processing',    sub: 'Preparing your items',      icon: Package      },
    { key: 'SHIPPED',    label: 'Shipped',        sub: order.shipmentInfo?.carrier ?? 'On the way', icon: Truck },
    { key: 'DELIVERED',  label: 'Delivered',      sub: 'Enjoy your order',          icon: CheckCircle2 },
  ]

  const subtotal = order.items?.reduce((s, i) => s + parseFloat(i.subtotal ?? 0), 0) ?? 0
  const shippingFee = parseFloat(order.shippingFee ?? 0)

  return (
    <div style={{ padding: '48px 0 100px', minHeight: '100vh' }}>
      <div className="container-noir" style={{ maxWidth: 800 }}>

        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', marginBottom: 32, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#555'}>
          <ArrowLeft size={13} /> Back to orders
        </Link>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Header card ── */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#444', textTransform: 'uppercase', marginBottom: 6 }}>Order</p>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>#{order.orderId}</h1>
                <p style={{ fontSize: 13, color: '#555', marginTop: 6 }}>{fmt(order.createdAt)}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999, padding: '5px 14px' }}>
                  {order.status}
                </span>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b' }}>
                  ${parseFloat(order.totalAmount ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Meta row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginTop: 24, background: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
              {[
                { icon: <Truck size={14} />,      label: 'Shipping',  value: order.shippingMethod ?? 'Standard' },
                { icon: <CreditCard size={14} />, label: 'Payment',   value: order.paymentMethod  ?? '—'        },
                { icon: <Package size={14} />,    label: 'Items',     value: `${order.items?.length ?? 0} item${order.items?.length !== 1 ? 's' : ''}` },
              ].map(m => (
                <div key={m.label} style={{ background: '#0f0f0f', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#444', marginBottom: 6 }}>
                    {m.icon}
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.label}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Two-col: Timeline + Address ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Timeline */}
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: '22px 24px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#444', textTransform: 'uppercase', marginBottom: 20 }}>
                {order.status === 'CANCELLED' ? 'Status' : 'Timeline'}
              </p>

              {order.status === 'CANCELLED' ? (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '2px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <XCircle size={14} color="#f87171" />
                  </div>
                  <p style={{ fontSize: 14, color: '#f87171', fontWeight: 600 }}>Order cancelled</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {timeline.map((step, i) => {
                    const done   = i <= stepIdx
                    const active = i === stepIdx + 1
                    const Icon   = step.icon
                    return (
                      <div key={step.key} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                        {i < timeline.length - 1 && (
                          <div style={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2,
                            background: done ? '#7c5cf0' : '#1e1e1e', transition: 'background 0.4s' }} />
                        )}
                        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: done ? '#7c5cf0' : active ? 'rgba(124,92,240,0.15)' : '#141414',
                          border: `2px solid ${done ? '#7c5cf0' : active ? 'rgba(124,92,240,0.4)' : '#222'}`,
                          transition: 'all 0.3s' }}>
                          <Icon size={13} color={done ? '#fff' : active ? '#7c5cf0' : '#444'} />
                        </div>
                        <div style={{ paddingBottom: i < timeline.length - 1 ? 24 : 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: done || active ? '#fff' : '#444', marginBottom: 2 }}>{step.label}</p>
                          <p style={{ fontSize: 11, color: '#444' }}>{step.sub}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Address + Shipment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {(order.shippingStreet || order.shippingRecipient) && (
                <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: '22px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                    <MapPin size={13} color="#7c5cf0" />
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#444', textTransform: 'uppercase' }}>Ship to</p>
                  </div>
                  {order.shippingRecipient  && <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{order.shippingRecipient}</p>}
                  {order.shippingStreet     && <p style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>{order.shippingStreet}</p>}
                  {order.shippingCity       && <p style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>{order.shippingCity}</p>}
                  {order.shippingCountry    && <p style={{ fontSize: 13, color: '#666' }}>{order.shippingCountry}</p>}
                  {order.shippingPhoneNumber && <p style={{ fontSize: 12, color: '#444', marginTop: 8 }}>{order.shippingPhoneNumber}</p>}
                </div>
              )}

              {order.shipmentInfo && (
                <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: '22px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                    <Truck size={13} color="#7c5cf0" />
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#444', textTransform: 'uppercase' }}>Shipment</p>
                  </div>
                  {order.shipmentInfo.carrier && (
                    <p style={{ fontSize: 13, color: '#ccc', marginBottom: 6 }}>
                      <span style={{ color: '#555' }}>Carrier: </span>{order.shipmentInfo.carrier}
                    </p>
                  )}
                  {order.shipmentInfo.trackingNumber && (
                    <p style={{ fontSize: 13, color: '#ccc', marginBottom: 6 }}>
                      <span style={{ color: '#555' }}>Tracking: </span>
                      <span style={{ fontFamily: 'monospace', color: '#a78bfa' }}>{order.shipmentInfo.trackingNumber}</span>
                    </p>
                  )}
                  {order.shipmentInfo.shippedAt && (
                    <p style={{ fontSize: 11, color: '#444', marginTop: 4 }}>Shipped {fmt(order.shipmentInfo.shippedAt)}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Items ── */}
          {order.items?.length > 0 && (
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a1a' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#444', textTransform: 'uppercase' }}>Items</p>
              </div>

              {order.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 24px', borderBottom: i < order.items.length - 1 ? '1px solid #141414' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#161616', border: '1px solid #1e1e1e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                        : <Package size={16} color="#333" />}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#e0e0e0', marginBottom: 2 }}>{item.productName}</p>
                      {item.variantInfo && <p style={{ fontSize: 11, color: '#555' }}>{item.variantInfo}</p>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>×{item.quantity} · ${parseFloat(item.priceAtPurchase ?? 0).toFixed(2)}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>${parseFloat(item.subtotal ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#555' }}>Subtotal</span>
                  <span style={{ fontSize: 13, color: '#999' }}>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#555' }}>Shipping</span>
                  <span style={{ fontSize: 13, color: shippingFee > 0 ? '#f59e0b' : '#22c55e' }}>
                    {shippingFee > 0 ? `+$${shippingFee.toFixed(2)}` : 'Free'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #1a1a1a', marginTop: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>${parseFloat(order.totalAmount ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  )
}
