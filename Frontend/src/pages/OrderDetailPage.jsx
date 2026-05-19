import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, MapPin, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import apiService from '../api/service'

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const STATUS_STYLES = {
  PENDING:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
  PROCESSING: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
  SHIPPED:    { color: 'var(--accent-light)', bg: 'var(--accent-dim)', border: 'var(--accent-dim2)' },
  DELIVERED:  { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
  CANCELLED:  { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
}

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : null
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  )
}

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
      <Link to="/orders" style={{ color: 'var(--accent)', fontSize: 14 }}>← Back to orders</Link>
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
      <div className="container-noir" style={{ maxWidth: 900 }}>

        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', marginBottom: 24, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#555'}>
          <ArrowLeft size={13} /> Back to orders
        </Link>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#444', textTransform: 'uppercase', marginBottom: 6 }}>Order</p>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>#{order.orderId}</h1>
                <p style={{ fontSize: 13, color: '#555', marginTop: 6 }}>{fmt(order.createdAt)}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <StatusBadge status={order.status} />
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>${parseFloat(order.totalAmount ?? 0).toFixed(2)}</div>
                <div style={{ fontSize: 13, color: '#777' }}>{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 18 }}>
              <div style={{ background: '#0b0b0b', padding: 12, borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#444', marginBottom: 6 }}><Truck size={14} /><span style={{ fontSize: 10, fontWeight: 700 }}>Shipping</span></div>
                <div style={{ fontSize: 13, color: '#ccc' }}>{order.shippingMethod ?? 'Standard'}</div>
              </div>
              <div style={{ background: '#0b0b0b', padding: 12, borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#444', marginBottom: 6 }}><CreditCard size={14} /><span style={{ fontSize: 10, fontWeight: 700 }}>Payment</span></div>
                <div style={{ fontSize: 13, color: '#ccc' }}>{order.paymentMethod ?? '—'}</div>
              </div>
              <div style={{ background: '#0b0b0b', padding: 12, borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#444', marginBottom: 6 }}><Package size={14} /><span style={{ fontSize: 10, fontWeight: 700 }}>Items</span></div>
                <div style={{ fontSize: 13, color: '#ccc' }}>{order.items?.length ?? 0}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#444', textTransform: 'uppercase', marginBottom: 12 }}>{order.status === 'CANCELLED' ? 'Status' : 'Timeline'}</p>

              {order.status === 'CANCELLED' ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(248,113,113,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle color="#f87171" size={16} /></div>
                  <div style={{ color: '#f87171', fontWeight: 700 }}>Order cancelled</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {timeline.map((step, i) => {
                    const done = i <= stepIdx
                    const active = i === stepIdx + 1
                    const Icon = step.icon
                    return (
                      <div key={step.key} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                        {i < timeline.length - 1 && <div style={{ position: 'absolute', left: 14, top: 30, bottom: 0, width: 2, background: done ? 'var(--accent)' : 'var(--border)' }} />}
                        <div style={{ width: 36, height: 36, borderRadius: 18, background: done ? 'var(--accent)' : active ? 'var(--accent-dim)' : 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${done ? 'var(--accent)' : active ? 'var(--accent-dim2)' : 'var(--border)'}` }}>
                          <Icon size={14} color={done ? '#fff' : active ? 'var(--accent)' : 'var(--muted)'} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: done || active ? '#fff' : '#666' }}>{step.label}</div>
                          <div style={{ fontSize: 12, color: '#777' }}>{step.sub}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(order.shippingRecipient || order.shippingStreet) && (
                <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><MapPin size={14} color="var(--accent)" /><div style={{ fontSize: 11, fontWeight: 700, color: '#444', textTransform: 'uppercase' }}>Ship to</div></div>
                  {order.shippingRecipient && <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{order.shippingRecipient}</div>}
                  {order.shippingStreet && <div style={{ fontSize: 13, color: '#777' }}>{order.shippingStreet}</div>}
                  {order.shippingCity && <div style={{ fontSize: 13, color: '#777' }}>{order.shippingCity}</div>}
                  {order.shippingCountry && <div style={{ fontSize: 13, color: '#777' }}>{order.shippingCountry}</div>}
                  {order.shippingPhoneNumber && <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>{order.shippingPhoneNumber}</div>}
                </div>
              )}

              {order.shipmentInfo && (
                <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Truck size={14} color="var(--accent)" /><div style={{ fontSize: 11, fontWeight: 700, color: '#444', textTransform: 'uppercase' }}>Shipment</div></div>
                  {order.shipmentInfo.carrier && <div style={{ fontSize: 13, color: '#ccc', marginBottom: 6 }}>Carrier: {order.shipmentInfo.carrier}</div>}
                  {order.shipmentInfo.trackingNumber && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Tracking: <span style={{ fontFamily: 'monospace', color: 'var(--accent-light)' }}>{order.shipmentInfo.trackingNumber}</span></div>}
                  {order.shipmentInfo.shippedAt && <div style={{ fontSize: 12, color: '#777' }}>Shipped {fmt(order.shipmentInfo.shippedAt)}</div>}
                </div>
              )}
            </div>
          </div>

          {order.items?.length > 0 && (
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: 14, borderBottom: '1px solid #1a1a1a' }}><div style={{ fontSize: 11, fontWeight: 700, color: '#444', textTransform: 'uppercase' }}>Items</div></div>
              {order.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < order.items.length - 1 ? '1px solid #141414' : 'none' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#121212', border: '1px solid #1a1a1a' }}>
                      {(it.imageUrl || it.productImageUrl) ? <img src={it.imageUrl || it.productImageUrl} alt={it.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={16} color="#333" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>{it.productName}</div>
                      {it.variantInfo && <div style={{ fontSize: 12, color: '#666' }}>{it.variantInfo}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#777' }}>×{it.quantity} · ${parseFloat(it.priceAtPurchase ?? it.unitPrice ?? 0).toFixed(2)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>${parseFloat(it.subtotal ?? 0).toFixed(2)}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: 14, borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#777' }}>Subtotal</span><span style={{ color: '#999' }}>${subtotal.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#777' }}>Shipping</span><span style={{ color: shippingFee > 0 ? '#f59e0b' : '#22c55e' }}>{shippingFee > 0 ? `+$${shippingFee.toFixed(2)}` : 'Free'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1a1a1a', paddingTop: 8 }}><span style={{ fontWeight: 700 }}>Total</span><span style={{ fontWeight: 900, color: '#f59e0b' }}>${parseFloat(order.totalAmount ?? 0).toFixed(2)}</span></div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  )
}
