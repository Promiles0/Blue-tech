import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox, Bell, Check } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

const SEV_COLOR = {
  success: '#22c55e',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    '#7c5cf0',
}

const CATEGORIES = ['all', 'shopping', 'account', 'community', 'order', 'system', 'security']

const CATEGORY_LABEL = {
  all:       'All',
  shopping:  'Shopping',
  account:   'Account',
  community: 'Community',
  order:     'Order',
  system:    'System',
  security:  'Security',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, fetchNotifications, markRead, markAllRead } = useNotifications()
  const [filter, setFilter]     = useState('all')
  const [readFilter, setRead]   = useState('all')
  const navigate                = useNavigate()

  useEffect(() => { fetchNotifications(50) }, []) // eslint-disable-line

  const displayed = notifications.filter(n => {
    if (filter !== 'all' && n.category !== filter) return false
    if (readFilter === 'unread' && n.isRead) return false
    return true
  })

  const handleClick = async (n) => {
    if (!n.isRead) await markRead([n.notificationId])
    if (n.href) navigate(n.href)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 16px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={20} style={{ color: '#7c5cf0' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Notifications</h1>
          {unreadCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, background: 'rgba(124,92,240,0.15)',
              color: '#7c5cf0', padding: '2px 8px', borderRadius: 20,
            }}>
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: '#7c5cf0', background: 'rgba(124,92,240,0.1)',
              border: '1px solid rgba(124,92,240,0.25)', borderRadius: 8,
              padding: '6px 12px', cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Check size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* Read filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['all', 'unread'].map(f => (
          <button
            key={f}
            onClick={() => setRead(f)}
            style={{
              fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
              cursor: 'pointer', transition: 'all 0.15s', border: 'none',
              background: readFilter === f ? 'rgba(124,92,240,0.2)' : 'rgba(255,255,255,0.05)',
              color: readFilter === f ? '#7c5cf0' : '#888',
            }}
          >
            {f === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              cursor: 'pointer', transition: 'all 0.15s', border: 'none',
              background: filter === c ? '#7c5cf0' : 'rgba(255,255,255,0.05)',
              color: filter === c ? '#fff' : '#666',
            }}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#555', fontSize: 14 }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: '#444' }}>
            <Inbox size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>No notifications here</div>
          </div>
        ) : (
          displayed.map((n, i) => (
            <div
              key={n.notificationId}
              onClick={() => handleClick(n)}
              style={{
                padding: '14px 18px',
                borderBottom: i < displayed.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                cursor: n.href ? 'pointer' : 'default',
                background: n.isRead ? 'transparent' : 'rgba(124,92,240,0.04)',
                transition: 'background 0.15s',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}
              onMouseEnter={e => { if (n.href) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(124,92,240,0.04)'}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                background: SEV_COLOR[n.severity] ?? '#7c5cf0',
                boxShadow: n.isRead ? 'none' : `0 0 8px ${SEV_COLOR[n.severity] ?? '#7c5cf0'}66`,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: n.isRead ? 400 : 600, color: n.isRead ? '#aaa' : '#fff' }}>
                    {n.title}
                  </span>
                  <span style={{ fontSize: 11, color: '#444', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                </div>
                {n.body && (
                  <div style={{ fontSize: 13, color: '#666', marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>
                )}
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  {n.category && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                      color: '#555', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4,
                    }}>
                      {CATEGORY_LABEL[n.category] ?? n.category}
                    </span>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={e => { e.stopPropagation(); markRead([n.notificationId]) }}
                      style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: '#7c5cf0', background: 'rgba(124,92,240,0.1)', border: 'none',
                        padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
