import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Package, Search, ChevronRight, ShoppingBag, Clock, Loader2, SendHorizonal, BadgeCheck, Undo2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import apiService from '../api/service'

const TABS = [
  { id: 'all',        label: 'All Orders',  icon: ShoppingBag   },
  { id: 'PENDING',    label: 'Pending',     icon: Clock         },
  { id: 'PROCESSING', label: 'In Progress', icon: Loader2       },
  { id: 'SHIPPED',    label: 'Shipped',     icon: SendHorizonal },
  { id: 'DELIVERED',  label: 'Delivered',   icon: BadgeCheck    },
  { id: 'CANCELLED',  label: 'Returns',     icon: Undo2         },
]

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    color: 'var(--price)', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
  PROCESSING: { label: 'Processing', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'  },
  SHIPPED:    { label: 'Shipped',    color: 'var(--accent-light)', bg: 'var(--accent-dim)', border: 'var(--accent-dim2)' },
  DELIVERED:  { label: 'Delivered',  color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  CANCELLED:  { label: 'Cancelled',  color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
}

const fmt = (v) => `$${Number(v ?? 0).toFixed(2)}`
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export default function OrderHistoryPage() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('all')
  const [search, setSearch]   = useState('')

  useEffect(() => {
    let cancelled = false
    apiService.orders.getUserOrders()
      .then(({ data }) => { if (!cancelled) setOrders(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setOrders([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let list = tab === 'all' ? orders : orders.filter(o => o.status === tab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        String(o.orderId ?? o.id).includes(q) ||
        o.items?.some(i => i.productName?.toLowerCase().includes(q))
      )
    }
    return list
  }, [orders, tab, search])

  const counts = useMemo(() => {
    const c = { all: orders.length }
    TABS.slice(1).forEach(t => { c[t.id] = orders.filter(o => o.status === t.id).length })
    return c
  }, [orders])

  const totalSpent    = orders.reduce((s, o) => s + Number(o.totalAmount ?? o.total ?? 0), 0)
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '64px 0 120px', position: 'relative', overflow: 'hidden' }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '-5%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div className="container-noir" style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: 6 }}>My Orders</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Track and manage all your purchases.</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Orders Placed', value: orders.length },
            { label: 'Total Spent',   value: fmt(totalSpent), highlight: true },
            { label: 'Delivered',     value: deliveredCount },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '20px 24px' }}>
              <p className="label-muted" style={{ fontSize: 10, marginBottom: 10 }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: s.highlight ? 'var(--price)' : '#fff' }}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Search + Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order number or product name…"
              className="noir-input"
              style={{ paddingLeft: 44, paddingRight: search ? 40 : 16, borderRadius: 12, fontSize: 14 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: 32 }}>
            {TABS.map(t => {
              const active = tab === t.id
              const count  = counts[t.id]
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '18px 8px',
                    fontSize: 14, fontWeight: active ? 700 : 400,
                    border: 'none', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                    background: 'none',
                    color: active ? '#fff' : 'var(--muted-dark)',
                    cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s',
                    marginBottom: -1,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--muted)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--muted-dark)' }}
                >
                  <t.icon size={16} style={{ flexShrink: 0 }} />
                  <span>{t.label}</span>
                  {count > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, lineHeight: 1,
                      background: active ? 'var(--accent)' : 'var(--glass-border)',
                      color: active ? '#fff' : 'var(--muted-dark)',
                      borderRadius: 999, padding: '3px 7px',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Order list */}
        {loading ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 40px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--glass-border)', borderRadius: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent)' }}>
              <Package size={28} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              {search ? 'No orders match your search' : tab === 'all' ? 'No orders yet' : `No ${TABS.find(t => t.id === tab)?.label.toLowerCase()} orders`}
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 300, margin: '0 auto' }}>
              {search ? 'Try a different order number or product name.' : 'Once you place an order it will appear here.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="noir-btn-outline" style={{ marginTop: 24, borderRadius: 10, fontSize: 13 }}>
                Clear search
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div style={{ display: 'grid', gap: 14 }}>
              {filtered.map((order, i) => {
                const cfg      = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
                const items    = order.items ?? []
                const thumbs   = items.slice(0, 4)
                const extra    = items.length - 4

                return (
                  <motion.div
                    key={order.orderId ?? order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      to={`/orders/${order.orderId ?? order.id}`}
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <div style={{
                        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                        borderRadius: 20, padding: '22px 24px', transition: 'border-color 0.2s, transform 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                      >
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                          <div>
                            <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                              Order #{order.orderId ?? order.id}
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--muted-dark)' }}>{fmtDate(order.createdAt ?? order.orderedAt)}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 999, padding: '4px 12px' }}>
                              {cfg.label}
                            </span>
                            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--price)' }}>{fmt(order.totalAmount ?? order.total)}</p>
                            <ChevronRight size={16} style={{ color: 'var(--accent)' }} />
                          </div>
                        </div>

                        {/* Product thumbnails */}
                        {thumbs.length > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {thumbs.map((item, idx) => (
                              <div key={idx} style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Package size={18} style={{ color: 'var(--muted-dark)' }} />
                                  </div>
                                )}
                              </div>
                            ))}
                            {extra > 0 && (
                              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>
                                +{extra}
                              </div>
                            )}
                            <div style={{ marginLeft: 4 }}>
                              <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                                {items.length} {items.length === 1 ? 'item' : 'items'}
                              </p>
                              {items[0]?.productName && (
                                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {items.map(i => i.productName).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                              <Package size={20} />
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--muted)' }}>No item details available</p>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
