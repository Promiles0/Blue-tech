import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Inbox, ShoppingBag, User, Globe, Shield, Package, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../context/NotificationContext'

const SEV = {
  success: { color: '#22c55e', glow: 'rgba(34,197,94,0.3)'   },
  error:   { color: '#ef4444', glow: 'rgba(239,68,68,0.3)'   },
  warning: { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)'  },
  info:    { color: '#7c5cf0', glow: 'rgba(124,92,240,0.3)'  },
}

const CATS = [
  { id: 'all',       label: 'All',       icon: Bell       },
  { id: 'order',     label: 'Orders',    icon: ShoppingBag },
  { id: 'account',   label: 'Account',   icon: User        },
  { id: 'system',    label: 'System',    icon: Cpu         },
  { id: 'security',  label: 'Security',  icon: Shield      },
  { id: 'community', label: 'Community', icon: Globe       },
  { id: 'shopping',  label: 'Shopping',  icon: Package     },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, fetchNotifications, markRead, markAllRead } = useNotifications()
  const [cat, setCat]         = useState('all')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [hoverId, setHoverId] = useState(null)
  const navigate              = useNavigate()

  useEffect(() => { fetchNotifications(60) }, []) // eslint-disable-line

  const displayed = notifications.filter(n => {
    if (onlyUnread && n.isRead) return false
    if (cat !== 'all' && n.category !== cat) return false
    return true
  })

  const handleClick = async (n) => {
    if (!n.isRead) await markRead([n.notificationId])
    if (n.href) navigate(n.href)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '56px 0 100px', position: 'relative', overflow: 'hidden' }}>
      {/* bg orb */}
      <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(124,92,240,0.05) 0%, transparent 65%)',
        borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="container-noir" style={{ maxWidth: 700, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,92,240,0.12)',
                border: '1px solid rgba(124,92,240,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={16} color="#7c5cf0" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Notifications</h1>
              {unreadCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(124,92,240,0.15)',
                  color: '#a78bfa', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(124,92,240,0.2)' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#555', margin: 0 }}>Stay on top of your orders, account, and updates.</p>
          </div>

          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                color: '#7c5cf0', background: 'rgba(124,92,240,0.08)', border: '1px solid rgba(124,92,240,0.2)',
                borderRadius: 8, padding: '8px 14px', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,240,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,92,240,0.08)'}>
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>

          {/* Unread toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[false, true].map(v => (
              <button key={String(v)} onClick={() => setOnlyUnread(v)}
                style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 999, cursor: 'pointer',
                  border: 'none', transition: 'all 0.15s',
                  background: onlyUnread === v ? 'rgba(124,92,240,0.18)' : 'rgba(255,255,255,0.04)',
                  color: onlyUnread === v ? '#a78bfa' : '#555' }}>
                {v ? 'Unread only' : 'All'}
              </button>
            ))}
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
            {CATS.map(c => {
              const Icon   = c.icon
              const active = cat === c.id
              return (
                <button key={c.id} onClick={() => setCat(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                    border: `1px solid ${active ? 'rgba(124,92,240,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    background: active ? 'rgba(124,92,240,0.12)' : 'transparent',
                    color: active ? '#a78bfa' : '#555', transition: 'all 0.15s' }}>
                  <Icon size={11} />
                  {c.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px',
              background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(124,92,240,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Inbox size={24} color="#7c5cf0" style={{ opacity: 0.5 }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>All caught up</p>
              <p style={{ fontSize: 13, color: '#444' }}>No notifications match your current filter.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, overflow: 'hidden' }}>
                {displayed.map((n, i) => {
                  const sev = SEV[n.severity] ?? SEV.info
                  return (
                    <motion.div key={n.notificationId}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleClick(n)}
                      onMouseEnter={() => setHoverId(n.notificationId)}
                      onMouseLeave={() => setHoverId(null)}
                      style={{ display: 'flex', gap: 14, alignItems: 'flex-start',
                        padding: '16px 20px', cursor: n.href ? 'pointer' : 'default',
                        borderBottom: i < displayed.length - 1 ? '1px solid #161616' : 'none',
                        transition: 'background 0.2s',
                        background: hoverId === n.notificationId && n.href
                          ? 'rgba(255,255,255,0.03)'
                          : n.isRead ? 'transparent' : 'rgba(124,92,240,0.04)' }}>

                      {/* Severity indicator */}
                      <div style={{ marginTop: 3, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: sev.color,
                          boxShadow: n.isRead ? 'none' : `0 0 8px ${sev.glow}` }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: n.isRead ? 500 : 700,
                            color: n.isRead ? '#888' : '#fff', lineHeight: 1.4 }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: 11, color: '#444', flexShrink: 0, marginTop: 1 }}>{timeAgo(n.createdAt)}</span>
                        </div>

                        {n.body && (
                          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, margin: 0, marginBottom: 8 }}>{n.body}</p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {n.category && (
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                              color: '#444', background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 4 }}>
                              {n.category}
                            </span>
                          )}
                          {!n.isRead && (
                            <button onClick={e => { e.stopPropagation(); markRead([n.notificationId]) }}
                              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                                color: '#7c5cf0', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                opacity: 0.7, transition: 'opacity 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  )
}
