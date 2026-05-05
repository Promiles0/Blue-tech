import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, X, Inbox } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../../context/NotificationContext'
import api from '../../api/axios'

const SEV_COLOR = {
  success: '#22c55e',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    '#7c5cf0',
}

const CATEGORY_LABEL = {
  shopping:  'Shopping',
  account:   'Account',
  community: 'Community',
  system:    'System',
  security:  'Security',
  business:  'Business',
  order:     'Order',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminNotificationBell() {
  const { adminUnread, fetchAdminUnreadCount } = useNotifications()
  const [open, setOpen]         = useState(false)
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [badgeKey, setBadgeKey] = useState(0)
  const [prevCount, setPrev]    = useState(adminUnread)
  const popoverRef = useRef(null)
  const navigate   = useNavigate()

  useEffect(() => {
    if (adminUnread > prevCount) setBadgeKey(k => k + 1)
    setPrev(adminUnread)
  }, [adminUnread]) // eslint-disable-line

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications/admin?limit=50')
      setItems(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const markAllRead = async () => {
    try {
      await api.post('/notifications/admin/mark-all-read')
      setItems(prev => prev.map(n => ({ ...n, isRead: true })))
      fetchAdminUnreadCount()
    } catch {}
  }

  const handleOpen = async () => {
    setOpen(true)
    await fetchItems()
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const handleItemClick = (n) => {
    if (n.href) { setOpen(false); navigate(n.href) }
  }

  return (
    <div ref={popoverRef} style={{ position: 'relative' }}>
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        style={{
          background: 'none', border: 'none',
          color: open ? '#fff' : 'var(--admin-muted)',
          padding: 6, display: 'flex', alignItems: 'center',
          transition: 'color 0.2s', borderRadius: 6, cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = 'var(--admin-muted)' }}
      >
        <Bell size={16} />
        {adminUnread > 0 && (
          <motion.span
            key={badgeKey}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              position: 'absolute', top: 1, right: 1,
              background: '#ef4444', color: '#fff',
              borderRadius: '50%', width: 14, height: 14,
              fontSize: 8, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {adminUnread > 9 ? '9+' : adminUnread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 340, maxHeight: 460,
              background: 'var(--admin-card)',
              border: '1px solid var(--admin-border)',
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '12px 14px 10px',
              borderBottom: '1px solid var(--admin-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Admin Notifications</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {adminUnread > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--admin-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-muted)', cursor: 'pointer', padding: 2 }}>
                  <X size={13} />
                </button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
              ) : items.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--admin-muted)' }}>
                  <Inbox size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div style={{ fontSize: 13 }}>No notifications</div>
                </div>
              ) : (
                items.map(n => (
                  <div
                    key={n.notificationId}
                    onClick={() => handleItemClick(n)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--admin-border)',
                      cursor: n.href ? 'pointer' : 'default',
                      background: n.isRead ? 'transparent' : 'rgba(124,92,240,0.04)',
                      transition: 'background 0.12s',
                      display: 'flex', gap: 9, alignItems: 'flex-start',
                    }}
                    onMouseEnter={e => { if (n.href) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(124,92,240,0.04)'}
                  >
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      background: SEV_COLOR[n.severity] ?? '#7c5cf0',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: n.isRead ? 400 : 600, color: n.isRead ? 'var(--admin-muted)' : '#fff' }}>
                          {n.title}
                        </span>
                        {!n.isRead && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c5cf0', flexShrink: 0, marginTop: 4 }} />}
                      </div>
                      {n.body && (
                        <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.body}
                        </div>
                      )}
                      <div style={{ marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{timeAgo(n.createdAt)}</span>
                        {n.category && (
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)', padding: '1px 4px', borderRadius: 3 }}>
                            {CATEGORY_LABEL[n.category] ?? n.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
