import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Package, MapPin, LogOut, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'profile', label: 'Profile',   icon: User },
  { id: 'orders',  label: 'Orders',    icon: Package },
  { id: 'address', label: 'Addresses', icon: MapPin },
]

export default function Account() {
  const { user, logout } = useAuth()
  const navigate          = useNavigate()
  const [tab, setTab]     = useState('profile')
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    if (tab === 'orders' && user) {
      let cancelled = false
      api.get('/admin/analytics/orders')
        .then(({ data }) => {
          if (cancelled) return
          const list = data?.content ?? (Array.isArray(data) ? data : [])
          setOrders(list.filter(o => o.userId === user.id || o.user?.id === user.id))
        })
        .catch(() => { if (!cancelled) setOrders([]) })
        .finally(() => { if (!cancelled) setLoadingOrders(false) })
      return () => { cancelled = true }
    }
    if (tab === 'address') {
      api.get('/addresses')
        .then(({ data }) => setAddresses(Array.isArray(data) ? data : []))
        .catch(() => setAddresses([]))
    }
  }, [tab, user])

  const handleLogout = () => { logout(); navigate('/') }

  if (!user) return null

  const STATUS_COLORS = { PENDING: '#f59e0b', PROCESSING: '#7c5cf0', SHIPPED: '#3b82f6', DELIVERED: '#22c55e', CANCELLED: '#ef4444' }

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 80 }}>
            {/* User info */}
            <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e1e1e' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#7c5cf0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{user.name ?? 'User'}</p>
              <p style={{ fontSize: 13, color: '#888', wordBreak: 'break-all' }}>{user.email}</p>
            </div>

            {/* Nav */}
            <nav style={{ padding: 8 }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => {
                  if (id === 'orders') { setLoadingOrders(true); setOrders([]) }
                  setTab(id)
                }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    background: tab === id ? '#7c5cf015' : 'none',
                    color: tab === id ? '#7c5cf0' : '#888',
                    border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                    transition: 'all 0.2s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (tab !== id) { e.currentTarget.style.background = '#1e1e1e'; e.currentTarget.style.color = '#fff' } }}
                  onMouseLeave={e => { if (tab !== id) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888' } }}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}

              <button onClick={handleLogout}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'none', color: '#888', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, marginTop: 4, textAlign: 'left', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'none' }}
              >
                <LogOut size={16} /> Sign out
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="fade-in" key={tab}>
            {tab === 'profile' && (
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 28, letterSpacing: '-0.01em' }}>Profile</h1>
                <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, padding: 28 }}>
                  <InfoRow label="Name"  value={user.name ?? '—'} />
                  <InfoRow label="Email" value={user.email ?? '—'} />
                  <InfoRow label="Role"  value={user.role ?? 'CUSTOMER'} last />
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 28, letterSpacing: '-0.01em' }}>Orders</h1>
                {loadingOrders ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16 }}>
                    <Package size={40} style={{ color: '#2a2a2a', margin: '0 auto 14px' }} />
                    <p style={{ color: '#888', fontSize: 15 }}>No orders yet.</p>
                    <Link to="/products" className="noir-btn-primary" style={{ display: 'inline-flex', marginTop: 20, padding: '10px 20px', fontSize: 14 }}>Start shopping</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {orders.map(order => (
                      <div key={order.id} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Order #{order.id}</p>
                          <p style={{ fontSize: 12, color: '#888' }}>{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''} · ${parseFloat(order.totalAmount ?? 0).toFixed(2)}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: STATUS_COLORS[order.status] + '20', color: STATUS_COLORS[order.status] }}>
                            {order.status}
                          </span>
                          <ChevronRight size={16} style={{ color: '#555' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'address' && (
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 28, letterSpacing: '-0.01em' }}>Addresses</h1>
                {addresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16 }}>
                    <MapPin size={40} style={{ color: '#2a2a2a', margin: '0 auto 14px' }} />
                    <p style={{ color: '#888', fontSize: 15 }}>No saved addresses.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {addresses.map(addr => (
                      <div key={addr.id} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 12, padding: '16px 20px' }}>
                        {addr.isDefault && <span style={{ fontSize: 10, fontWeight: 700, color: '#7c5cf0', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>DEFAULT</span>}
                        <p style={{ fontSize: 14, color: '#fff' }}>{addr.street}</p>
                        <p style={{ fontSize: 13, color: '#888' }}>{addr.city}, {addr.country}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: last ? 'none' : '1px solid #1e1e1e' }}>
      <span style={{ fontSize: 13, color: '#888' }}>{label}</span>
      <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
