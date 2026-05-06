import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import orderService from '../services/orderService'

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const STATUS_STYLES = {
  PENDING:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
  PROCESSING: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'  },
  SHIPPED:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
  DELIVERED:  { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  CANCELLED:  { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
}

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

function fmt(dt) {
  if (!dt) return null
  return new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    orderService.getById(id)
      .then(setOrder)
      .catch(() => setError('Order not found or access denied.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ padding: '80px 24px', maxWidth: 760, margin: '0 auto' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 12 }} />)}
    </div>
  )

  if (error || !order) return (
    <div style={{ padding: '80px 24px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
      <p style={{ color: '#888' }}>{error || 'Order not found.'}</p>
      <Link to="/orders" style={{ color: '#7c5cf0', fontSize: 14, marginTop: 16, display: 'inline-block' }}>← Back to orders</Link>
    </div>
  )

  const stepIdx = order.status === 'CANCELLED' ? -1 : STATUS_STEPS.indexOf(order.status)

  const timelineSteps = [
    { key: 'PENDING',    label: 'Order placed',  sublabel: fmt(order.createdAt),             icon: Clock         },
    { key: 'PROCESSING', label: 'Processing',    sublabel: 'Preparing your items',            icon: Package       },
    { key: 'SHIPPED',    label: 'Shipped',        sublabel: order.shipmentInfo?.carrier
        ? `${order.shipmentInfo.carrier}${order.shipmentInfo.trackingNumber ? ' · ' + order.shipmentInfo.trackingNumber : ''}`
        : fmt(order.shipmentInfo?.shippedAt) ?? 'On the way',                                  icon: Truck         },
    { key: 'DELIVERED',  label: 'Delivered',      sublabel: 'Enjoy your order',               icon: CheckCircle2  },
  ]

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir" style={{ maxWidth: 760 }}>

        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888', marginBottom: 32, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#888'}
        >
          <ArrowLeft size={14} /> Back to orders
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#444', textTransform: 'uppercase', marginBottom: 6 }}>Order</p>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>#{order.orderId}</h1>
              <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{fmt(order.createdAt)}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <StatusBadge status={order.status} />
              <span style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>
                ${parseFloat(order.totalAmount ?? 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>

            {/* Timeline */}
            <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, padding: '24px 20px' }}>
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
                timelineSteps.map((step, i) => (
                  <TimelineStep
                    key={step.key}
                    label={step.label}
                    sublabel={step.sublabel}
                    done={i <= stepIdx}
                    active={i === stepIdx + 1}
                    last={i === timelineSteps.length - 1}
                    icon={step.icon}
                  />
                ))
              )}
            </div>

            {/* Shipping + Shipment info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(order.shippingRecipient || order.shippingStreet) && (
                <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, padding: '20px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#555', textTransform: 'uppercase', marginBottom: 12 }}>Ship to</p>
                  {order.shippingRecipient && <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{order.shippingRecipient}</p>}
                  {order.shippingStreet  && <p style={{ fontSize: 13, color: '#888' }}>{order.shippingStreet}</p>}
                  {order.shippingCity    && <p style={{ fontSize: 13, color: '#888' }}>{order.shippingCity}</p>}
                  {order.shippingCountry && <p style={{ fontSize: 13, color: '#888' }}>{order.shippingCountry}</p>}
                  {order.shippingPhoneNumber && <p style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{order.shippingPhoneNumber}</p>}
                </div>
              )}

              {order.shipmentInfo && (
                <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, padding: '20px' }}>
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
            <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #1e1e1e' }}>
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
                    {item.variantInfo && <p style={{ fontSize: 12, color: '#555' }}>{item.variantInfo}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, color: '#888' }}>{item.quantity} × ${parseFloat(item.priceAtPurchase ?? 0).toFixed(2)}</p>
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
