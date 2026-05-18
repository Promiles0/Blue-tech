import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, CheckCheck, X, Inbox, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../../context/NotificationContext'

const SEV = {
  success: { color: '#22c55e', glow: 'rgba(34,197,94,0.35)'  },
  error:   { color: '#ef4444', glow: 'rgba(239,68,68,0.35)'  },
  warning: { color: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
  info:    { color: '#7c5cf0', glow: 'rgba(124,92,240,0.35)' },
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
  const [onlyUnread, setUnread] = useState(false)
  const [badgeKey, setBadgeKey] = useState(0)
  const [prevCount, setPrev]    = useState(unreadCount)
  const [hoverId, setHoverId]   = useState(null)
  const ref    = useRef(null)
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
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displayed = onlyUnread ? notifications.filter(n => !n.isRead) : notifications

  const handleItem = async (n) => {
    if (!n.isRead) await markRead([n.notificationId])
    if (n.href) { setOpen(false); navigate(n.href) }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* Bell */}
      <button onClick={open ? () => setOpen(false) : handleOpen}
        style={{ background: 'none', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer',
          color: open ? '#fff' : '#666', display: 'flex', alignItems: 'center',
          transition: 'color 0.2s', position: 'relative' }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = '#666' }}>
        <Bell size={18} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span key={badgeKey}
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{ position: 'absolute', top: 3, right: 3,
                background: '#ef4444', color: '#fff', borderRadius: '50%',
                width: 14, height: 14, fontSize: 8, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none', border: '1.5px solid #050505' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0,
              width: 360, maxHeight: 520,
              background: '#111', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(124,92,240,0.15)',
                    color: '#a78bfa', padding: '2px 8px', borderRadius: 999,
                    border: '1px solid rgba(124,92,240,0.2)' }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    style={{ display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, color: '#7c5cf0', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,240,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <CheckCheck size={11} /> All read
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                    padding: 4, borderRadius: 6, display: 'flex', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#555'}>
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Filter */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', gap: 6 }}>
              {[false, true].map(v => (
                <button key={String(v)} onClick={() => setUnread(v)}
                  style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    background: onlyUnread === v ? 'rgba(124,92,240,0.18)' : 'rgba(255,255,255,0.04)',
                    color: onlyUnread === v ? '#a78bfa' : '#555' }}>
                  {v ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` : 'All'}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: 8 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />)}
                </div>
              ) : displayed.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <Inbox size={24} color="#333" style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: 13, color: '#444', margin: 0 }}>
                    {onlyUnread ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                </div>
              ) : (
                displayed.map(n => {
                  const sev = SEV[n.severity] ?? SEV.info
                  return (
                    <div key={n.notificationId} onClick={() => handleItem(n)}
                      onMouseEnter={() => setHoverId(n.notificationId)}
                      onMouseLeave={() => setHoverId(null)}
                      style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
                        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                        cursor: n.href ? 'pointer' : 'default',
                        transition: 'background 0.2s',
                        background: hoverId === n.notificationId && n.href
                          ? 'rgba(255,255,255,0.04)'
                          : n.isRead ? 'transparent' : 'rgba(124,92,240,0.03)' }}>

                      <div style={{ marginTop: 5, flexShrink: 0, width: 7, height: 7, borderRadius: '50%',
                        background: sev.color,
                        boxShadow: n.isRead ? 'none' : `0 0 7px ${sev.glow}` }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600,
                            color: n.isRead ? '#777' : '#e8e8e8', lineHeight: 1.35 }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: 10, color: '#444', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                        </div>
                        {n.body && (
                          <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.4,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.body}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Link to="/notifications" onClick={() => setOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 12, color: '#555', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#555'}>
                <span>View all notifications</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
