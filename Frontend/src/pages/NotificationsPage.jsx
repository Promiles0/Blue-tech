import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Inbox, ShoppingBag, User, Globe, Shield, Package, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotifications } from '../context/NotificationContext'

const SEV = {
  success: { color: '#22c55e', glow: 'rgba(34,197,94,0.18)' },
  error:   { color: '#ef4444', glow: 'rgba(239,68,68,0.18)' },
  warning: { color: '#f59e0b', glow: 'rgba(245,158,11,0.14)' },
  info:    { color: 'var(--accent)', glow: 'var(--accent-glow)' },
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

const CATEGORY_LABEL = CATS.reduce((acc, c) => (acc[c.id] = c.label, acc), {})

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
  const [cat, setCat] = useState('all')
  const [onlyUnread, setOnlyUnread] = useState(false)
const navigate = useNavigate()

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
      <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 65%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="container-noir" style={{ maxWidth: 700, position: 'relative', zIndex: 1 }}>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', border: '1px solid var(--accent-dim2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={16} color="var(--accent)" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>Notifications</h1>
              {unreadCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent-dim)', color: 'var(--accent-light)', padding: '3px 10px', borderRadius: 999, border: '1px solid var(--accent-dim2)' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Stay on top of your orders, account, and updates.</p>
          </div>

          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-dim2)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-dim2)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}>
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATS.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} style={{ fontSize: 12, fontWeight: 700, padding: '6px 10px', borderRadius: 999, cursor: 'pointer', border: '1px solid var(--border)', background: cat === c.id ? 'var(--accent)' : 'var(--surface)', color: cat === c.id ? '#fff' : 'var(--muted)' }}>{c.label}</button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: onlyUnread ? 'var(--text)' : 'var(--muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Unread only</span>
              </label>
            </div>
          </div>
        </motion.div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center', color: 'var(--muted)' }}>
              <Inbox size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
              <div style={{ fontSize: 14 }}>No notifications here</div>
            </div>
          ) : (
            displayed.map((n, i) => (
              <div key={n.notificationId} onClick={() => handleClick(n)} style={{ padding: '14px 18px', borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none', cursor: n.href ? 'pointer' : 'default', background: n.isRead ? 'transparent' : 'var(--accent-dim)', transition: 'background 0.12s', display: 'flex', gap: 12, alignItems: 'flex-start' }} onMouseEnter={e => { if (n.href) e.currentTarget.style.background = 'var(--overlay-hover)' }} onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'var(--accent-dim)'}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: (SEV[n.severity]?.color) ?? 'var(--accent)', boxShadow: n.isRead ? 'none' : `0 0 12px ${(SEV[n.severity]?.glow) ?? 'var(--accent-glow)'}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: n.isRead ? 400 : 700, color: n.isRead ? 'var(--muted)' : 'var(--text)' }}>{n.title}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted-dark)', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  {n.body && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>{n.body}</div>}
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {n.category && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', background: 'var(--glass-bg)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 6 }}>{CATEGORY_LABEL[n.category] ?? n.category}</span>}
                    {!n.isRead && <button onClick={e => { e.stopPropagation(); markRead([n.notificationId]) }} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-dim2)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Mark read</button>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
