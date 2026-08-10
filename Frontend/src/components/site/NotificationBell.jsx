import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, CheckCheck, X, Inbox, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../../context/NotificationContext'

const SEV_COLOR = {
  success: 'var(--success)',
  error:   'var(--error)',
  warning: 'var(--warning)',
  info:    'var(--brand)',
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
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationBell() {
  const { unreadCount, notifications, loading, fetchNotifications, markRead, markAllRead } = useNotifications()
  const [open, setOpen]         = useState(false)
  const [filter, setFilter]     = useState('all')
  const [badgeKey, setBadgeKey] = useState(0)
  const [prevCount, setPrev]    = useState(unreadCount)
  const popoverRef              = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (unreadCount > prevCount) setBadgeKey(k => k + 1)
    setPrev(unreadCount)
  }, [unreadCount]) // eslint-disable-line

  const handleOpen = useCallback(async () => {
    setOpen(true)
    await fetchNotifications(30)
  }, [fetchNotifications])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displayed = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications

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
          background: 'none', border: 'none', color: open ? 'var(--icon-color)' : 'var(--icon-muted)',
          padding: 8, display: 'flex', alignItems: 'center',
          transition: 'color 0.2s', borderRadius: 6, cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--icon-color)'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = 'var(--icon-muted)' }}
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
              background: 'var(--error)', color: 'var(--brand-text)',
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
              background: 'var(--bg-surface)',
              border: '1px solid var(--card-border)',
              borderRadius: 14,
              boxShadow: 'var(--card-shadow)',
              zIndex: 200,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid var(--card-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '2px 6px', borderRadius: 4,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--icon-muted)', cursor: 'pointer', padding: 2 }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Filter pills */}
            <div style={{ padding: '8px 12px', display: 'flex', gap: 6, borderBottom: '1px solid var(--card-border)' }}>
              {['all', 'unread'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                    background: filter === f ? 'var(--brand-soft)' : 'var(--glass-bg2)',
                    color: filter === f ? 'var(--brand)' : 'var(--text-secondary)',
                  }}
                >
                  {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
              ) : displayed.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
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
                      borderBottom: '1px solid var(--card-border)',
                      cursor: n.href ? 'pointer' : 'default',
                      background: n.isRead ? 'transparent' : 'var(--brand-tint)',
                      transition: 'background 0.15s',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}
                    onMouseEnter={e => { if (n.href) e.currentTarget.style.background = 'var(--overlay-hover)' }}
                    onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'var(--brand-tint)'}
                  >
                    {/* Severity dot */}
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      background: SEV_COLOR[n.severity] ?? 'var(--brand)',
                      boxShadow: '0 0 6px var(--brand-glow)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.3 }}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: 4 }} />
                        )}
                      </div>
                      {n.body && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.body}
                        </div>
                      )}
                      <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</span>
                        {n.category && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                            color: 'var(--text-muted)', background: 'var(--glass-bg2)', padding: '1px 5px', borderRadius: 3,
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
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--card-border)' }}>
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                style={{ fontSize: 12, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <ArrowRight size={11} /> View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
