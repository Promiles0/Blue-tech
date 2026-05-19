import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Bell, Search, RefreshCw, Pause, Play,
  Check, Filter, Inbox,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import api from '../../api/axios'
import { useNotifications } from '../../context/NotificationContext'

const SEV_COLOR = {
  success: '#22c55e',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    'var(--accent)',
}

const CATEGORIES = ['all', 'shopping', 'account', 'community', 'order', 'system', 'security', 'business']
const SEVERITIES = ['all', 'info', 'success', 'warning', 'error']

const CAT_LABEL = {
  all: 'All', shopping: 'Shopping', account: 'Account',
  community: 'Community', order: 'Order', system: 'System',
  security: 'Security', business: 'Business',
}

const tooltipStyle = {
  contentStyle: {
    background: 'var(--admin-card)', border: '1px solid var(--admin-border)',
    borderRadius: 8, fontSize: 12,
  },
  labelStyle: { color: 'rgba(255,255,255,0.55)', marginBottom: 4 },
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

export default function AdminNotifications() {
  const { fetchAdminUnreadCount } = useNotifications()
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [paused, setPaused]       = useState(false)
  const [search, setSearch]       = useState('')
  const [catFilter, setCat]       = useState('all')
  const [sevFilter, setSev]       = useState('all')
  const [lastRefresh, setLast]    = useState(null)
  const [hoverId, setHoverId]     = useState(null)
  const intervalRef               = useRef(null)
  const navigate                  = useNavigate()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications/admin?limit=100')
      setItems(data ?? [])
      setLast(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  const markAllRead = async () => {
    await api.post('/notifications/admin/mark-all-read')
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    fetchAdminUnreadCount()
  }

  const markOne = async (id) => {
    await api.post('/notifications/mark-read', { ids: [id] })
    setItems(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n))
    fetchAdminUnreadCount()
  }

  // Auto-refresh every 30s unless paused
  useEffect(() => {
    fetchItems()
    if (!paused) {
      intervalRef.current = setInterval(fetchItems, 30_000)
    }
    return () => clearInterval(intervalRef.current)
  }, [paused, fetchItems])

  const displayed = items.filter(n => {
    if (catFilter !== 'all' && n.category !== catFilter) return false
    if (sevFilter !== 'all' && n.severity !== sevFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!n.title?.toLowerCase().includes(q) && !n.body?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const unreadCount = items.filter(n => !n.isRead).length

  // Analytics: counts by severity and category
  const bySev = Object.entries(
    items.reduce((acc, n) => { acc[n.severity] = (acc[n.severity] ?? 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value }))

  const byCat = Object.entries(
    items.reduce((acc, n) => { acc[n.category] = (acc[n.category] ?? 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name: CAT_LABEL[name] ?? name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const PIE_COLORS = ['var(--accent)', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#ec4899']

  return (
    <div style={{ padding: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Notifications
          </h1>
          <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>
            Live admin event stream
            {lastRefresh && <span style={{ marginLeft: 8 }}>· refreshed {timeAgo(lastRefresh)}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPaused(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, padding: '7px 13px', borderRadius: 8, cursor: 'pointer',
              background: paused ? 'rgba(245,158,11,0.1)' : 'var(--glass-bg2)',
              border: `1px solid ${paused ? 'rgba(245,158,11,0.3)' : 'var(--admin-border)'}`,
              color: paused ? '#f59e0b' : 'var(--admin-muted)',
              transition: 'all 0.15s',
            }}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={fetchItems}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, padding: '7px 13px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
              color: 'var(--accent)', transition: 'opacity 0.15s', opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, padding: '7px 13px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                color: '#22c55e', transition: 'opacity 0.15s',
              }}
            >
              <Check size={12} /> Mark all read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Analytics strip */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 260px', gap: 14, marginBottom: 24 }}>
          {/* Severity counts */}
          {['info', 'success', 'warning', 'error'].map(sev => {
            const count = items.filter(n => n.severity === sev).length
            return (
              <div
                key={sev}
                className="surface"
                style={{ borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'opacity 0.15s', opacity: sevFilter === sev ? 1 : 0.75 }}
                onClick={() => setSev(s => s === sev ? 'all' : sev)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: SEV_COLOR[sev] }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-muted)' }}>
                    {sev}
                  </span>
                </div>
                <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 24, fontWeight: 700, color: SEV_COLOR[sev] }}>
                  {count}
                </span>
              </div>
            )
          })}
          {/* Category pie */}
          <div className="surface" style={{ borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-muted)', marginBottom: 4 }}>
              By Category
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={byCat} dataKey="value" cx="50%" cy="50%" outerRadius={34} innerRadius={18}>
                  {byCat.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={v => [v, 'events']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '0 0 260px' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notifications…"
            style={{
              width: '100%', background: 'var(--admin-card)', border: '1px solid var(--admin-border)',
              borderRadius: 8, padding: '7px 10px 7px 30px', fontSize: 12, color: '#fff',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                cursor: 'pointer', transition: 'all 0.12s', border: 'none',
                background: catFilter === c ? 'var(--admin-primary)' : 'var(--glass-bg2)',
                color: catFilter === c ? '#fff' : 'var(--admin-muted)',
              }}
            >
              {CAT_LABEL[c]}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: 'var(--admin-muted)', marginLeft: 'auto' }}>
          {displayed.length} result{displayed.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      <div style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: 14, overflow: 'hidden' }}>
        {loading && items.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--admin-muted)' }}>
            <Inbox size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
            <div style={{ fontSize: 13 }}>No notifications match your filters</div>
          </div>
        ) : (
          displayed.map((n, i) => (
            <div
              key={n.notificationId}
              onMouseEnter={() => setHoverId(n.notificationId)}
              onMouseLeave={() => setHoverId(null)}
              style={{
                padding: '12px 18px',
                borderBottom: i < displayed.length - 1 ? '1px solid var(--admin-border)' : 'none',
                display: 'flex', gap: 12, alignItems: 'flex-start',
                transition: 'background 0.2s',
                background: hoverId === n.notificationId
                  ? 'rgba(255,255,255,0.03)'
                  : n.isRead ? 'transparent' : 'rgba(124,92,240,0.03)',
              }}
            >
              {/* Severity dot */}
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                background: SEV_COLOR[n.severity] ?? 'var(--accent)',
                boxShadow: n.isRead ? 'none' : `0 0 8px ${SEV_COLOR[n.severity] ?? 'var(--accent)'}55`,
              }} />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: n.isRead ? 'var(--admin-muted)' : '#fff' }}>
                    {n.title}
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {!n.isRead && (
                      <button
                        onClick={() => markOne(n.notificationId)}
                        style={{ fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Mark read
                      </button>
                    )}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
                {n.body && (
                  <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 2, lineHeight: 1.5 }}>{n.body}</div>
                )}
                <div style={{ marginTop: 5, display: 'flex', gap: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                    color: SEV_COLOR[n.severity] ?? 'var(--accent)',
                    background: `${SEV_COLOR[n.severity] ?? 'var(--accent)'}18`,
                    padding: '1px 5px', borderRadius: 3,
                  }}>
                    {n.severity}
                  </span>
                  {n.category && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.3)', background: 'var(--glass-bg2)',
                      padding: '1px 5px', borderRadius: 3,
                    }}>
                      {CAT_LABEL[n.category] ?? n.category}
                    </span>
                  )}
                  {n.href && (
                    <button
                      onClick={() => navigate(n.href)}
                      style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      View →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
