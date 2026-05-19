import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, Wallet, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import apiService from '../api/service'
import api from '../api/axios'
import { toast } from 'sonner'
import { StarInput } from '../components/site/StarRating'

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
          background: done ? 'var(--accent)' : 'var(--border)',
          transition: 'background 0.4s',
        }} />
      )}
      {/* Node */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'var(--accent)' : active ? 'var(--accent-dim)' : 'var(--bg-deep)',
        border: `2px solid ${done ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'all 0.3s',
        zIndex: 1,
      }}>
        <Icon size={14} color={done ? '#fff' : active ? 'var(--accent)' : 'var(--text-muted)'} />
      </div>
      {/* Text */}
      <div style={{ paddingBottom: last ? 0 : 28 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: done || active ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
        {sublabel && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sublabel}</p>}
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeReviewProduct, setActiveReviewProduct] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    apiService.orders.getOrderDetails(id)
      .then(({ data }) => setOrder(data))
      .catch(() => setError('Order not found or access denied.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleConfirmDelivery = async () => {
    try {
      await api.put(`/orders/${id}/deliver`)
      toast.success("Order marked as delivered!")
      const { data } = await apiService.orders.getOrderDetails(id)
      setOrder(data)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to confirm delivery")
    }
  }

  if (loading) return (
    <div style={{ padding: '80px 24px', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[120, 80, 200].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 16 }} />)}
    </div>
  )

  if (error || !order) return (
    <div style={{ padding: '80px 24px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)' }}>{error || 'Order not found.'}</p>
      <Link to="/orders" style={{ color: 'var(--accent)', fontSize: 14, marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>← Back to orders</Link>
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

        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, transition: 'color 0.2s', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <ArrowLeft size={13} /> Back to orders
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Order</p>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>#{order.orderId}</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{fmt(order.createdAt)}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, minWidth: 190 }}>
              <StatusBadge status={order.status} />
              {order.status === 'SHIPPED' && (
                <button
                  onClick={handleConfirmDelivery}
                  className="noir-btn-cta"
                  style={{
                    padding: '8px 16px',
                    fontSize: 12,
                    borderRadius: 8,
                    fontWeight: 700,
                    marginTop: 4,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Delivery
                </button>
              )}
              <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--price-color, #f59e0b)' }}>${parseFloat(order.totalAmount ?? 0).toFixed(2)}</span>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Items: {order.items?.length ?? 0}</p>
            </div>
          </div>

          <div className="order-summary-meta" style={{ marginBottom: 28 }}>
            <div className="dashboard-card-secondary" style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 20 }}>
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
              <p style={{ marginTop: 10, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(order.createdAt)}</p>
            </div>
            <div className="dashboard-card-secondary" style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 20 }}>
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
              <p style={{ marginTop: 10, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{order.paymentMethod ?? 'Credit card'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{order.paymentStatus ?? 'Completed'}</p>
            </div>
            <div className="dashboard-card-secondary" style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: 'rgba(124,92,240,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(124,92,240,0.3)'
                }}>
                  <Truck size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <span className="label-muted">Shipping</span>
              </div>
              <p style={{ marginTop: 10, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{order.shippingMethod ?? 'Standard delivery'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Estimated delivery: 3-5 days</p>
            </div>
          </div>

          <div className="order-detail-panel" style={{ marginBottom: 32 }}>

            {/* Timeline */}
            <div className="dashboard-panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 20 }}>
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
                <div className="dashboard-panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Ship to</p>
                  {order.shippingRecipient && <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{order.shippingRecipient}</p>}
                  {order.shippingStreet  && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{order.shippingStreet}</p>}
                  {order.shippingCity    && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{order.shippingCity}</p>}
                  {order.shippingCountry && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{order.shippingCountry}</p>}
                  {order.shippingPhoneNumber && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{order.shippingPhoneNumber}</p>}
                </div>
              )}

              {order.shipmentInfo && (
                <div className="dashboard-panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Shipment</p>
                  {order.shipmentInfo.carrier && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Carrier: </span>{order.shipmentInfo.carrier}
                    </p>
                  )}
                  {order.shipmentInfo.trackingNumber && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tracking: </span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{order.shipmentInfo.trackingNumber}</span>
                    </p>
                  )}
                  {order.shipmentInfo.shippedAt && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Shipped {fmt(order.shipmentInfo.shippedAt)}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          {order.items?.length > 0 && (
            <div className="dashboard-panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 0, overflow: 'hidden', marginBottom: 32 }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--card-border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items</p>
              </div>
              {order.items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 24px',
                  borderBottom: i < order.items.length - 1 ? '1px solid var(--card-border)' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{item.productName}</p>
                    {item.variantInfo && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.variantInfo}</p>}
                    {order.status === 'DELIVERED' && (
                      <button
                        onClick={() => setActiveReviewProduct({ id: item.productId, name: item.productName })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          marginTop: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Star size={12} fill="currentColor" /> Write a review
                      </button>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.quantity} × ${parseFloat(item.priceAtPurchase ?? 0).toFixed(2)}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>${parseFloat(item.subtotal ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div style={{ padding: '18px 24px', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', background: 'var(--glass-bg2)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--price-color, #f59e0b)' }}>${parseFloat(order.totalAmount ?? 0).toFixed(2)}</span>
              </div>
            </div>
          )}

        </motion.div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {activeReviewProduct && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 460, borderRadius: 16, padding: 28,
                background: 'var(--bg-surface)', border: '1px solid var(--card-border)',
                position: 'relative', margin: 16
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                Review Product
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                {activeReviewProduct.name}
              </p>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Rating</label>
                <StarInput value={rating} onChange={setRating} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Your Thoughts</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                    background: 'var(--bg-input, #1a1a1a)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', resize: 'none', outline: 'none', lineHeight: 1.6,
                    fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setActiveReviewProduct(null)
                    setRating(0)
                    setComment('')
                  }}
                  className="noir-btn-outline"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!rating) {
                      toast.error('Please select a star rating.')
                      return
                    }
                    setSubmittingReview(true)
                    try {
                      await api.post(`/products/${activeReviewProduct.id}/reviews`, { rating, comment })
                      toast.success('Review posted successfully!')
                      setActiveReviewProduct(null)
                      setRating(0)
                      setComment('')
                    } catch (err) {
                      toast.error(err.response?.data?.message ?? 'Could not post review.')
                    } finally {
                      setSubmittingReview(false)
                    }
                  }}
                  className="noir-btn-cta"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
