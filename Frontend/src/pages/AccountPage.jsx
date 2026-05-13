import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Package, MapPin, LogOut, ChevronRight, Edit3, Save, Lock, ShoppingBag, Wallet, Timer, Truck, MessageSquareMore, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import apiService from '../api/service'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'profile', label: 'Profile',   icon: User },
  { id: 'orders',  label: 'Orders',    icon: Package },
  { id: 'address', label: 'Addresses', icon: MapPin },
]

const ORDER_FILTERS = [
  { id: 'all', label: 'All', icon: ShoppingBag },
  { id: 'PENDING', label: 'To Pay', icon: Wallet },
  { id: 'PROCESSING', label: 'Processing', icon: Timer },
  { id: 'SHIPPED', label: 'Shipped', icon: Truck },
  { id: 'DELIVERED', label: 'To Review', icon: MessageSquareMore },
  { id: 'CANCELLED', label: 'Returns', icon: RotateCcw }
]

const STATUS_LABELS = {
  PENDING: 'pending', PROCESSING: 'processing', SHIPPED: 'shipped', DELIVERED: 'delivered', CANCELLED: 'cancelled'
}

const formatCurrency = (value) => `$${Number(value ?? 0).toFixed(2)}`
const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export default function Account() {
  const { user, logout, updateUser, isAdmin } = useAuth()
  const navigate          = useNavigate()
  
  // Helper for masking email
  const maskEmail = (email) => {
    if (!email) return ''
    const [name, domain] = email.split('@')
    return `${name.substring(0, 3)}****@${domain}`
  }

  // Filter tabs for admin
  const filteredTabs = TABS.filter(t => !isAdmin || t.id === 'profile')

  const [tab, setTab]     = useState(isAdmin ? 'profile' : 'orders')
  const [orderSubTab, setOrderSubTab] = useState('all')
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loading, setLoading] = useState(false)

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [updating, setUpdating] = useState(false)

  // Password State
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '' })
  const [passLoading, setPassLoading] = useState(false)

  // Sync form with user data when user changes or entering edit mode
  useEffect(() => {
    if (user) {
      // Use Promise.resolve() to defer state update and avoid cascading render warning
      Promise.resolve().then(() => {
        setProfileForm({ 
          name: user.name || '', 
          phone: user.phone || '' 
        })
      })
    }
  }, [user, isEditing])

  useEffect(() => {
    if (tab === 'orders' && user) {
      let cancelled = false
      Promise.resolve().then(() => setLoadingOrders(true))
      apiService.orders.getUserOrders()
        .then(({ data }) => {
          // interceptor already unwraps ApiResponse → data is the orders array or Page
          if (!cancelled) setOrders(Array.isArray(data) ? data : (data?.content ?? []))
        })
        .catch(() => { if (!cancelled) setOrders([]) })
        .finally(() => { if (!cancelled) setLoadingOrders(false) })
      return () => { cancelled = true }
    }
    if (tab === 'address') {
      apiService.addresses.list()
        .then(({ data }) => setAddresses(Array.isArray(data) ? data : []))
        .catch(() => setAddresses([]))
    }
  }, [tab, user])

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    recipientName: '', phoneNumber: '', streetAddress: '', city: '', country: 'Rwanda', landmarks: ''
  })

  const handleAddAddress = async () => {
    if (!addressForm.recipientName || !addressForm.phoneNumber || !addressForm.streetAddress || !addressForm.city) {
      toast.error('Please fill in name, phone, street and city')
      return
    }
    setLoading(true)
    try {
      const { data } = await apiService.addresses.add(addressForm)
      setAddresses([...addresses, data])
      setShowAddressForm(false)
      setAddressForm({ recipientName: '', phoneNumber: '', streetAddress: '', city: '', country: 'Rwanda', landmarks: '' })
      toast.success('Address added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (id) => {
    try {
      await apiService.addresses.delete(id)
      setAddresses(addresses.filter(a => a.addressId !== id))
      toast.success('Address removed')
    } catch {
      toast.error('Failed to remove address')
    }
  }

  const handleSetDefaultAddress = async (id) => {
    try {
      await apiService.addresses.setDefault(id)
      setAddresses(addresses.map(a => ({ ...a, isDefault: a.addressId === id })))
      toast.success('Default address updated')
    } catch {
      toast.error('Failed to update default address')
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const handleProfileUpdate = async (e) => {
    if (e) e.preventDefault()
    
    if (!profileForm.name.trim()) {
      toast.error('Name is required')
      return
    }

    setUpdating(true)
    try {
      // Backend expects { name, phone }
      const response = await apiService.auth.updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim()
      })

      updateUser(response.data)
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message || err.message || 'Failed to update profile'
      toast.error(`Error ${status || ''}: ${msg}`)
      console.error('Update error details:', err.response?.data)
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!passForm.oldPassword || !passForm.newPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    setPassLoading(true)
    try {
      await apiService.auth.changePassword(passForm)
      setPassForm({ oldPassword: '', newPassword: '' })
      toast.success('Password changed successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPassLoading(false)
    }
  }

  if (!user) return null

  const orderCount = orders.length
  const orderTotal = orders.reduce((sum, order) => sum + Number(order.totalAmount ?? order.total ?? 0), 0)
  const defaultAddress = addresses.find(a => a.isDefault)
  const STATUS_COLORS = { PENDING: '#f59e0b', PROCESSING: '#7c5cf0', SHIPPED: '#3b82f6', DELIVERED: '#22c55e', CANCELLED: '#ef4444' }

  return (
    <div style={{ position: 'relative', padding: '80px 0 120px', minHeight: '100vh', background: '#050505', overflow: 'hidden' }}>
      {/* Advanced Background Elements */}
      <div className="orb-1" style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(124, 92, 240, 0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div className="orb-2" style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.04) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
      <div className="orb-3" style={{ position: 'absolute', top: '30%', right: '20%', width: '20vw', height: '20vw', background: 'radial-gradient(circle, rgba(124, 92, 240, 0.03) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />
      
      <div className="container-noir" style={{ position: 'relative', zIndex: 1 }}>
        <div className={isAdmin ? 'mx-auto max-w-3xl' : 'dashboard-layout'}>

          {/* Sidebar */}
          {!isAdmin && (
            <motion.aside 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sidebar-nav"
            >
              {/* User profile summary */}
              <div style={{ padding: '0 8px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 32 }}>
                <div className="avatar-premium shine">
                  {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{user.name ?? 'User'}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Account</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted-dark)', marginTop: 12, fontWeight: 500 }}>{maskEmail(user.email)}</p>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--muted-dark)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 18 }}>Navigation</p>
                {filteredTabs.map(({ id, label, icon: Icon }) => (
                  <button 
                    key={id} 
                    onClick={() => {
                      if (id === 'orders') { setLoadingOrders(true); setOrders([]) }
                      setTab(id)
                    }}
                    className={`sidebar-item ${tab === id ? 'active' : ''}`}
                  >
                    <Icon size={20} strokeWidth={tab === id ? 2 : 1.5} />
                    {label}
                  </button>
                ))}

                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button 
                    onClick={handleLogout}
                    className="sidebar-item"
                    style={{ color: 'var(--error)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--error-dim)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={20} strokeWidth={1.5} />
                    Sign out
                  </button>
                </div>

                {/* System Status Section */}
                
              </div>
            </motion.aside>
          )}

          {/* Content */}
          <div className="fade-in" key={tab} style={{ paddingTop: 8 }}>
            {tab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="fade-in"
              >
                <div style={{ marginBottom: 40 }}>
                  <p className="label-muted" style={{ marginBottom: 8 }}>Account Dashboard</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
                    <div>
                      <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                        {isAdmin ? 'Admin Console' : 'Your Profile'}
                      </h1>
                      <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 16 }}>Manage your account settings and preferences.</p>
                    </div>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="noir-btn-outline" style={{ borderRadius: 14 }}>
                        <Edit3 size={16} /> Edit Profile
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setIsEditing(false)} className="noir-btn-outline" style={{ borderRadius: 14 }}>Cancel</button>
                        <button onClick={handleProfileUpdate} disabled={updating} className="noir-btn-primary shine" style={{ borderRadius: 14 }}>
                          {updating ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats Grid */}
                {!isAdmin && (
                  <div className="stat-grid">
                    <div className="stat-card-premium glass-border">
                      <p className="label-muted" style={{ fontSize: 10 }}>Total Orders</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 8 }}>{orderCount}</p>
                    </div>
                    <div className="stat-card-premium glass-border">
                      <p className="label-muted" style={{ fontSize: 10 }}>Total Investment</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--price)', marginTop: 8 }}>{formatCurrency(orderTotal)}</p>
                    </div>
                    {defaultAddress && (
                      <div className="stat-card-premium glass-border">
                        <p className="label-muted" style={{ fontSize: 10 }}>Primary City</p>
                        <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{defaultAddress.city}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="dashboard-panel" style={{ padding: 40, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {isEditing ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                      <div className="form-group-noir">
                        <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>Full Name</label>
                        <input 
                          type="text" 
                          value={profileForm.name} 
                          onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="noir-input"
                          style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}
                          required
                        />
                      </div>
                      <div className="form-group-noir">
                        <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>Phone Number</label>
                        <input 
                          type="text" 
                          value={profileForm.phone} 
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="noir-input"
                          style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}
                          placeholder="+250 XXX XXX XXX"
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="label-muted">Full Name</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{user.name ?? '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="label-muted">Email Address</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{user.email ?? '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="label-muted">Phone Number</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{user.phone ?? '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="label-muted">Account Role</span>
                        <span className="status-pill status-pill--delivered" style={{ fontSize: 10 }}>{user.role ?? 'CUSTOMER'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Password Management */}
                <div style={{ marginTop: 60 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <Lock size={20} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Security</h2>
                  </div>
                  
                  <div className="dashboard-panel" style={{ padding: 40 }}>
                    <form onSubmit={handlePasswordChange} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                      <div>
                        <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>Current Password</label>
                        <input 
                          type="password" 
                          value={passForm.oldPassword}
                          onChange={e => setPassForm({ ...passForm, oldPassword: e.target.value })}
                          className="noir-input"
                          style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>New Password</label>
                        <input 
                          type="password" 
                          value={passForm.newPassword}
                          onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                          className="noir-input"
                          style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}
                          placeholder="••••••••"
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button 
                          type="submit" 
                          disabled={passLoading || !passForm.oldPassword || !passForm.newPassword}
                          className="noir-btn-primary shine"
                          style={{ borderRadius: 100, padding: '12px 32px' }}
                        >
                          {passLoading ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'orders' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="fade-in"
              >
                <div style={{ marginBottom: 40 }}>
                  <p className="label-muted" style={{ marginBottom: 8 }}>Order History</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
                    <div>
                      <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>My Orders</h1>
                      <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 16 }}>Track and manage your recent purchases.</p>
                    </div>
                    {orderCount > 0 && (
                      <div className="status-pill status-pill--delivered" style={{ borderRadius: 12, padding: '8px 16px' }}>
                        Active Customer
                      </div>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {ORDER_FILTERS.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setOrderSubTab(sub.id)}
                        className={`order-filter-pill ${orderSubTab === sub.id ? 'active' : ''}`}
                      >
                        <sub.icon size={14} />
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingOrders ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="skeleton" style={{ height: 120, borderRadius: 24 }} />
                    ))}
                  </div>
                ) : (orders.filter(o => orderSubTab === 'all' || o.status === orderSubTab)).length === 0 ? (
                  <div className="empty-state-card">
                    <div style={{ 
                      width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-dim)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                      margin: '0 auto 24px'
                    }}>
                      <ShoppingBag size={32} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                      {orderSubTab === 'all' ? 'No orders yet' : `No ${orderSubTab.toLowerCase()} orders`}
                    </h3>
                    <p style={{ color: 'var(--muted)', maxWidth: 300, margin: '0 auto 32px', lineHeight: 1.6 }}>
                      {orderSubTab === 'CANCELLED' 
                        ? "You haven't initiated any returns." 
                        : "Ready to find something you love? Start exploring our collections."}
                    </p>
                    <Link to="/products" className="noir-btn-primary shine" style={{ borderRadius: 100, padding: '14px 32px' }}>
                      Browse Collections
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
                    {orders
                      .filter(order => orderSubTab === 'all' || order.status === orderSubTab)
                      .map(order => (
                      <Link key={order.orderId ?? order.id} to={`/orders/${order.orderId ?? order.id}`} className="order-card glass-border" style={{ padding: 28, borderRadius: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: 20 }}>
                            <div style={{ 
                              width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.03)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              <Package size={24} />
                            </div>
                            <div>
                              <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                Order #{order.orderId ?? order.id}
                              </p>
                              <p style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                                {order.items?.length ?? 0} {order.items?.length === 1 ? 'Item' : 'Items'}
                              </p>
                              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                                Placed on {formatDate(order.createdAt ?? order.orderedAt)}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--price)', marginBottom: 8 }}>
                              {formatCurrency(order.totalAmount ?? order.total)}
                            </p>
                            <span className={`status-pill status-pill--${(order.status ?? 'PENDING').toLowerCase()}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ 
                          marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.04)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', gap: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ 
                                width: 32, height: 32, borderRadius: 8, background: 
                                order.paymentStatus === 'COMPLETED' ? 'rgba(34,197,94,0.12)' : 
                                order.paymentStatus === 'PENDING' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: `1px solid ${
                                  order.paymentStatus === 'COMPLETED' ? 'rgba(34,197,94,0.3)' : 
                                  order.paymentStatus === 'PENDING' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'
                                }`
                              }}>
                                <Wallet size={14} style={{ 
                                  color: order.paymentStatus === 'COMPLETED' ? '#22c55e' : 
                                         order.paymentStatus === 'PENDING' ? '#f59e0b' : '#ef4444' 
                                }} />
                              </div>
                              <div>
                                <p className="label-muted" style={{ fontSize: 10, marginBottom: 2 }}>Payment</p>
                                <p style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{order.paymentStatus ?? 'Completed'}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ 
                                width: 32, height: 32, borderRadius: 8, background: 'rgba(124,92,240,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(124,92,240,0.3)'
                              }}>
                                <Truck size={14} style={{ color: '#7c5cf0' }} />
                              </div>
                              <div>
                                <p className="label-muted" style={{ fontSize: 10, marginBottom: 2 }}>Shipping</p>
                                <p style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{order.shippingMethod ?? 'Standard'}</p>
                              </div>
                            </div>
                          </div>
                          <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                            View Details <ChevronRight size={16} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'address' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="fade-in"
              >
                <div style={{ marginBottom: 40 }}>
                  <p className="label-muted" style={{ marginBottom: 8 }}>Shipping details</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
                    <div>
                      <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Addresses</h1>
                      <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 16 }}>Manage your delivery locations.</p>
                    </div>
                    {!showAddressForm && (
                      <button 
                        onClick={() => setShowAddressForm(true)}
                        className="noir-btn-primary shine" 
                        style={{ borderRadius: 14, padding: '12px 24px' }}
                      >
                        + Add New Address
                      </button>
                    )}
                  </div>
                </div>

                {/* Add Address Form */}
                {showAddressForm && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="dashboard-panel" 
                    style={{ padding: 40, marginBottom: 40, background: 'rgba(255,255,255,0.02)' }}
                  >
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 32 }}>New Shipping Address</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      <div className="form-group-noir">
                        <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>Recipient Name *</label>
                        <input
                          className="noir-input"
                          value={addressForm.recipientName}
                          onChange={e => setAddressForm({...addressForm, recipientName: e.target.value})}
                          placeholder="Full name"
                          style={{ borderRadius: 12 }}
                        />
                      </div>
                      <div className="form-group-noir">
                        <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>Phone Number *</label>
                        <input
                          className="noir-input"
                          value={addressForm.phoneNumber}
                          onChange={e => setAddressForm({...addressForm, phoneNumber: e.target.value})}
                          placeholder="+250 XXX XXX XXX"
                          style={{ borderRadius: 12 }}
                        />
                      </div>
                      <div className="form-group-noir" style={{ gridColumn: 'span 2' }}>
                        <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>Street Address *</label>
                        <input
                          className="noir-input"
                          value={addressForm.streetAddress}
                          onChange={e => setAddressForm({...addressForm, streetAddress: e.target.value})}
                          placeholder="e.g. 123 Designer Row"
                          style={{ borderRadius: 12 }}
                        />
                      </div>
                      <div className="form-group-noir">
                        <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>City *</label>
                        <input
                          className="noir-input"
                          value={addressForm.city}
                          onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                          placeholder="Kigali"
                          style={{ borderRadius: 12 }}
                        />
                      </div>
                      <div className="form-group-noir">
                        <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>Country *</label>
                        <input
                          className="noir-input"
                          value={addressForm.country}
                          onChange={e => setAddressForm({...addressForm, country: e.target.value})}
                          placeholder="Rwanda"
                          style={{ borderRadius: 12 }}
                        />
                      </div>
                      <div className="form-group-noir" style={{ gridColumn: 'span 2' }}>
                        <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>Landmarks (optional)</label>
                        <input
                          className="noir-input"
                          value={addressForm.landmarks}
                          onChange={e => setAddressForm({...addressForm, landmarks: e.target.value})}
                          placeholder="Near, opposite, behind..."
                          style={{ borderRadius: 12 }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
                      <button 
                        onClick={handleAddAddress}
                        disabled={loading}
                        className="noir-btn-primary shine" 
                        style={{ flex: 1, padding: '16px', borderRadius: 14 }}
                      >
                        {loading ? 'Saving...' : 'Save Address'}
                      </button>
                      <button 
                        onClick={() => setShowAddressForm(false)}
                        className="noir-btn-outline" 
                        style={{ padding: '16px 32px', borderRadius: 14 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {addresses.length === 0 && !showAddressForm ? (
                  <div className="empty-state-card">
                    <div style={{ 
                      width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-dim)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                      margin: '0 auto 24px'
                    }}>
                      <MapPin size={32} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>No addresses saved</h3>
                    <p style={{ color: 'var(--muted)', maxWidth: 300, margin: '0 auto 32px', lineHeight: 1.6 }}>
                      Add a shipping address to speed up your checkout process.
                    </p>
                    <button 
                      onClick={() => setShowAddressForm(true)}
                      className="noir-btn-primary shine" 
                      style={{ borderRadius: 100, padding: '14px 32px' }}
                    >
                      + Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 20 }}>
                    {addresses.map(addr => (
                      <motion.div
                        key={addr.addressId}
                        layout
                        className="dashboard-panel"
                        style={{
                          padding: 28, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 24
                        }}
                      >
                        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: 14, background: addr.isDefault ? 'var(--accent-dim)' : 'rgba(255,255,255,0.03)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: addr.isDefault ? 'var(--accent)' : 'var(--muted)'
                          }}>
                            <MapPin size={20} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{addr.streetAddress}</p>
                              {addr.isDefault && (
                                <span className="status-pill status-pill--delivered" style={{ fontSize: 9, padding: '2px 8px' }}>
                                  Default
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 14, color: 'var(--muted)' }}>{addr.city} • {addr.country}</p>
                            {addr.recipientName && <p style={{ fontSize: 12, color: 'var(--muted-dark)', marginTop: 2 }}>{addr.recipientName} · {addr.phoneNumber}</p>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.addressId)}
                              className="sidebar-item"
                              style={{ padding: '8px 16px', fontSize: 12, color: 'var(--accent)' }}
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr.addressId)}
                            className="sidebar-item"
                            style={{ padding: '8px 16px', fontSize: 12, color: 'var(--error)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--error-dim)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
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
