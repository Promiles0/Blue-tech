import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import apiService from '../api/service'

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const STATUS_STYLES = {
  PENDING:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
  PROCESSING: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'  },
  SHIPPED:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
  DELIVERED:  { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  CANCELLED:  { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
}

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : null
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: 100,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  )
}

function TimelineStep({ label, sublabel, done, active, last, icon: Icon }) {
  return (
    <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
      {/* Line */}
      {!last && (
        <div style={{
          position: 'absolute', left: 15, top: 32, bottom: -8,
          width: 2,
          background: done ? '#7c5cf0' : '#1e1e1e',
          transition: 'background 0.4s',
        }} />
      )}
      {/* Node */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? '#7c5cf0' : active ? 'rgba(124,92,240,0.18)' : '#141414',
        border: `2px solid ${done ? '#7c5cf0' : active ? 'rgba(124,92,240,0.5)' : '#2a2a2a'}`,
        transition: 'all 0.3s',
        zIndex: 1,
      }}>
        <Icon size={14} color={done ? '#fff' : active ? '#7c5cf0' : '#555'} />
      </div>
      {/* Text */}
      <div style={{ paddingBottom: last ? 0 : 28 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: done || active ? '#fff' : '#555', marginBottom: 2 }}>{label}</p>
        {sublabel && <p style={{ fontSize: 12, color: '#555' }}>{sublabel}</p>}
      </div>
    </div>
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
    <div style={{ padding: '80px 24px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
      <p style={{ color: '#888' }}>{error || 'Order not found.'}</p>
      <Link to="/orders" style={{ color: '#7c5cf0', fontSize: 14, marginTop: 16, display: 'inline-block' }}>← Back to orders</Link>
    </div>
  )

  const stepIdx = order.status === 'CANCELLED' ? -1 : STATUS_STEPS.indexOf(order.status)

  const timeline = [
    { key: 'PENDING',    label: 'Order Placed',  sub: fmtDate(order.createdAt),   icon: Clock        },
    { key: 'PROCESSING', label: 'Processing',    sub: 'Preparing your items',      icon: Package      },
    { key: 'SHIPPED',    label: 'Shipped',        sub: order.shipmentInfo?.carrier ?? 'On the way', icon: Truck },
    { key: 'DELIVERED',  label: 'Delivered',      sub: 'Enjoy your order',          icon: CheckCircle2 },
  ]

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir" style={{ maxWidth: 760 }}>

        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#999', marginBottom: 32, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#555'}>
          <ArrowLeft size={13} /> Back to orders
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#444', textTransform: 'uppercase', marginBottom: 6 }}>Order</p>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>#{order.orderId}</h1>
              <p style={{ fontSize: 13, color: '#999', marginTop: 6 }}>{fmt(order.createdAt)}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, minWidth: 190 }}>
              <StatusBadge status={order.status} />
              <span style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>${parseFloat(order.totalAmount ?? 0).toFixed(2)}</span>
              <p style={{ color: '#999', fontSize: 13 }}>Items: {order.items?.length ?? 0}</p>
            </div>
          </div>

          <div className="order-summary-meta" style={{ marginBottom: 28 }}>
            <div className="dashboard-card-secondary">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(59,130,246,0.3)'
                }}>
                  <Clock size={16} style={{ color: '#3b82f6' }} />
                </div>
                <span className="label-muted">Order date</span>
              </div>
              <p style={{ marginTop: 10, fontSize: 18, fontWeight: 700, color: '#fff' }}>{fmt(order.createdAt)}</p>
            </div>
            <div className="dashboard-card-secondary">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background:
                  order.paymentStatus === 'COMPLETED' ? 'rgba(34,197,94,0.12)' :
                  order.paymentStatus === 'PENDING' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${
                    order.paymentStatus === 'COMPLETED' ? 'rgba(34,197,94,0.3)' :
                    order.paymentStatus === 'PENDING' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'
                  }`
                }}>
                  <Wallet size={16} style={{
                    color: order.paymentStatus === 'COMPLETED' ? '#22c55e' :
                           order.paymentStatus === 'PENDING' ? '#f59e0b' : '#ef4444'
                  }} />
                </div>
                <span className="label-muted">Payment</span>
              </div>
              <p style={{ marginTop: 10, fontSize: 18, fontWeight: 700, color: '#fff' }}>{order.paymentMethod ?? 'Credit card'}</p>
              <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{order.paymentStatus ?? 'Completed'}</p>
            </div>
            <div className="dashboard-card-secondary">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: 'rgba(124,92,240,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(124,92,240,0.3)'
                }}>
                  <Truck size={16} style={{ color: '#7c5cf0' }} />
                </div>
                <span className="label-muted">Shipping</span>
              </div>
              <p style={{ marginTop: 10, fontSize: 18, fontWeight: 700, color: '#fff' }}>{order.shippingMethod ?? 'Standard delivery'}</p>
              <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Estimated delivery: 3-5 days</p>
            </div>
          </div>

          <div className="order-detail-panel" style={{ marginBottom: 32 }}>

            {/* Timeline */}
            <div className="dashboard-panel">
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#555', textTransform: 'uppercase', marginBottom: 20 }}>
                {order.status === 'CANCELLED' ? 'Cancelled' : 'Timeline'}
              </p>
              {order.status === 'CANCELLED' ? (
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(248,113,113,0.12)', border: '2px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XCircle size={14} color="#f87171" />
                  </div>
                  <p style={{ fontSize: 14, color: '#f87171', fontWeight: 600 }}>Order cancelled</p>
                </div>
              ) : (
                timeline.map((step, i) => (
                  <TimelineStep
                    key={step.key}
                    label={step.label}
                    sublabel={step.sub}
                    done={i <= stepIdx}
                    active={i === stepIdx + 1}
                    last={i === timeline.length - 1}
                    icon={step.icon}
                  />
                ))
              )}
            </div>

            {/* Shipping + Shipment info */}
            <div className="order-details-grid">
              {(order.shippingRecipient || order.shippingStreet) && (
                <div className="dashboard-panel">
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#555', textTransform: 'uppercase', marginBottom: 12 }}>Ship to</p>
                  {order.shippingRecipient && <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{order.shippingRecipient}</p>}
                  {order.shippingStreet  && <p style={{ fontSize: 13, color: '#999' }}>{order.shippingStreet}</p>}
                  {order.shippingCity    && <p style={{ fontSize: 13, color: '#999' }}>{order.shippingCity}</p>}
                  {order.shippingCountry && <p style={{ fontSize: 13, color: '#999' }}>{order.shippingCountry}</p>}
                  {order.shippingPhoneNumber && <p style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{order.shippingPhoneNumber}</p>}
                </div>
              )}

              {order.shipmentInfo && (
                <div className="dashboard-panel">
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#555', textTransform: 'uppercase', marginBottom: 12 }}>Shipment</p>
                  {order.shipmentInfo.carrier && (
                    <p style={{ fontSize: 13, color: '#ccc', marginBottom: 4 }}>
                      <span style={{ color: '#555' }}>Carrier: </span>{order.shipmentInfo.carrier}
                    </p>
                  )}
                  {order.shipmentInfo.trackingNumber && (
                    <p style={{ fontSize: 13, color: '#ccc', marginBottom: 4 }}>
                      <span style={{ color: '#555' }}>Tracking: </span>
                      <span style={{ fontFamily: 'monospace', color: '#a78bfa' }}>{order.shipmentInfo.trackingNumber}</span>
                    </p>
                  )}
                  {order.shipmentInfo.shippedAt && (
                    <p style={{ fontSize: 12, color: '#555', marginTop: 6 }}>Shipped {fmt(order.shipmentInfo.shippedAt)}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          {order.items?.length > 0 && (
            <div className="dashboard-panel" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#555', textTransform: 'uppercase' }}>Items</p>
              </div>
              {order.items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < order.items.length - 1 ? '1px solid #1a1a1a' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 2 }}>{item.productName}</p>
                    {item.variantInfo && <p style={{ fontSize: 12, color: '#999' }}>{item.variantInfo}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, color: '#999' }}>{item.quantity} × ${parseFloat(item.priceAtPurchase ?? 0).toFixed(2)}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>${parseFloat(item.subtotal ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div style={{ padding: '14px 20px', borderTop: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#555' }}>Total</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>${parseFloat(order.totalAmount ?? 0).toFixed(2)}</span>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  )
}
