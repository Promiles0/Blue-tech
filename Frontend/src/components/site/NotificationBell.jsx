import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, Check, X, ExternalLink, Inbox } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../../context/NotificationContext'

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

export default function NotificationBell() {
  const { unreadCount, notifications, loading, fetchNotifications, markRead, markAllRead } = useNotifications()
  const [open, setOpen]       = useState(false)
  const [filter, setFilter]   = useState('all')
  const [badgeKey, setBadgeKey] = useState(0)
  const [prevCount, setPrevCount] = useState(unreadCount)
  const popoverRef = useRef(null)
  const navigate   = useNavigate()

  // Animate badge on new notification
  useEffect(() => {
    if (unreadCount > prevCount) setBadgeKey(k => k + 1)
    setPrevCount(unreadCount)
  }, [unreadCount]) // eslint-disable-line

  // Fetch + mark unread as seen when opening
  const handleOpen = useCallback(async () => {
    setOpen(true)
    await fetchNotifications(30)
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications

  const handleItemClick = async (n) => {
    if (!n.isRead) await markRead([n.notificationId])
    if (n.href) { setOpen(false); navigate(n.href) }
  }

  return (
    <div ref={popoverRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        style={{
          background: 'none', border: 'none', color: open ? '#fff' : '#888',
          padding: 8, display: 'flex', alignItems: 'center',
          transition: 'color 0.2s', borderRadius: 6, cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = '#888' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            key={badgeKey}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              position: 'absolute', top: 2, right: 2,
              background: '#ef4444', color: '#fff',
              borderRadius: '50%', width: 15, height: 15,
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: 360, maxHeight: 500,
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
              zIndex: 200,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      fontSize: 11, color: '#7c5cf0', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '2px 6px', borderRadius: 4,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 2 }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Filter pills */}
            <div style={{ padding: '8px 12px', display: 'flex', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {['all', 'unread'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                    background: filter === f ? 'rgba(124,92,240,0.2)' : 'rgba(255,255,255,0.05)',
                    color: filter === f ? '#7c5cf0' : '#888',
                  }}
                >
                  {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#555', fontSize: 13 }}>Loading…</div>
              ) : displayed.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#444' }}>
                  <Inbox size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div style={{ fontSize: 13 }}>No notifications</div>
                </div>
              ) : (
                displayed.map(n => (
                  <div
                    key={n.notificationId}
                    onClick={() => handleItemClick(n)}
                    style={{
                      padding: '11px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: n.href ? 'pointer' : 'default',
                      background: n.isRead ? 'transparent' : 'rgba(124,92,240,0.04)',
                      transition: 'background 0.15s',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}
                    onMouseEnter={e => { if (n.href) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(124,92,240,0.04)'}
                  >
                    {/* Severity dot */}
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      background: SEV_COLOR[n.severity] ?? '#7c5cf0',
                      boxShadow: `0 0 6px ${SEV_COLOR[n.severity] ?? '#7c5cf0'}66`,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: n.isRead ? '#aaa' : '#fff', lineHeight: 1.3 }}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c5cf0', flexShrink: 0, marginTop: 4 }} />
                        )}
                      </div>
                      {n.body && (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 2, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.body}
                        </div>
                      )}
                      <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#444' }}>{timeAgo(n.createdAt)}</span>
                        {n.category && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                            color: '#555', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3,
                          }}>
                            {CATEGORY_LABEL[n.category] ?? n.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                style={{ fontSize: 12, color: '#7c5cf0', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <ExternalLink size={11} /> View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
