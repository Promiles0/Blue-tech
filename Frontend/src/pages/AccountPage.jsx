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
          if (!cancelled) setOrders(Array.isArray(data.data) ? data.data : [])
        })
        .catch(() => { if (!cancelled) setOrders([]) })
        .finally(() => { if (!cancelled) setLoadingOrders(false) })
      return () => { cancelled = true }
    }
    if (tab === 'address') {
      apiService.addresses.list()
        .then(({ data }) => setAddresses(Array.isArray(data.data) ? data.data : []))
        .catch(() => setAddresses([]))
    }
  }, [tab, user])

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    street: '', city: '', state: '', zipCode: '', country: 'Rwanda'
  })

  const handleAddAddress = async () => {
    if (!addressForm.street || !addressForm.city) {
      toast.error('Please fill in street and city')
      return
    }
    setLoading(true)
    try {
      const { data } = await apiService.addresses.add(addressForm)
      setAddresses([...addresses, data.data])
      setShowAddressForm(false)
      setAddressForm({ street: '', city: '', state: '', zipCode: '', country: 'Rwanda' })
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
      setAddresses(addresses.filter(a => a.id !== id))
      toast.success('Address removed')
    } catch {
      toast.error('Failed to remove address')
    }
  }

  const handleSetDefaultAddress = async (id) => {
    try {
      await apiService.addresses.setDefault(id)
      setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })))
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
      
      updateUser(response.data.data)
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

  const STATUS_COLORS = { PENDING: '#f59e0b', PROCESSING: '#7c5cf0', SHIPPED: '#3b82f6', DELIVERED: '#22c55e', CANCELLED: '#ef4444' }

  return (
    <div style={{ padding: '64px 0 120px' }}>
      <div className="container-noir">
        <div style={{ 
          display: isAdmin ? 'block' : 'grid', 
          gridTemplateColumns: isAdmin ? 'none' : '280px 1fr', 
          gap: isAdmin ? 0 : 80, 
          alignItems: 'start',
          maxWidth: isAdmin ? 800 : 'none',
          margin: isAdmin ? '0 auto' : '0'
        }}>

          {/* Sidebar (Ref #1 & #6) */}
          {!isAdmin && (
            <div style={{ 
              background: '#161616', 
              border: '1px solid #262626', 
              borderRadius: 20, 
              overflow: 'hidden', 
              position: 'sticky', top: 80,
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}>
              {/* User info */}
              <div style={{ padding: '32px 24px', borderBottom: '1px solid #262626' }}>
                <div style={{ 
                  width: 56, height: 56, borderRadius: '50%', background: '#7c5cf0', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  marginBottom: 16, fontSize: 22, fontWeight: 900, color: '#fff',
                  boxShadow: '0 4px 12px rgba(124, 92, 240, 0.3)'
                }}>
                  {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, letterSpacing: '-0.01em' }}>{user.name ?? 'User'}</p>
                <p style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>{maskEmail(user.email)}</p>
              </div>

              {/* Nav */}
              <nav style={{ padding: '12px 12px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredTabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => {
                      if (id === 'orders') { setLoadingOrders(true); setOrders([]) }
                      setTab(id)
                    }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px', borderRadius: 12,
                        background: tab === id ? '#7c5cf010' : 'none',
                        color: tab === id ? '#7c5cf0' : '#666',
                        border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                        transition: 'all 0.2s', textAlign: 'left',
                      }}
                      onMouseEnter={e => { if (tab !== id) { e.currentTarget.style.background = '#1e1e1e'; e.currentTarget.style.color = '#fff' } }}
                      onMouseLeave={e => { if (tab !== id) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#666' } }}
                    >
                      <Icon size={18} strokeWidth={1.5} /> {label}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #262626' }}>
                  <button onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: 'none', color: '#666', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, textAlign: 'left', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'none' }}
                  >
                    <LogOut size={18} strokeWidth={1.5} /> Sign out
                  </button>
                </div>
              </nav>
            </div>
          )}

          {/* Content */}
          <div className="fade-in" key={tab} style={{ paddingTop: 8 }}>
            {tab === 'profile' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Profile Settings</h1>
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} 
                      style={{ background: 'none', border: '1px solid #2a2a2a', color: '#888', padding: '6px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#444' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#2a2a2a' }}
                    >
                      <Edit3 size={14} /> Edit Profile
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                       <button onClick={() => setIsEditing(false)} 
                        style={{ background: 'none', border: 'none', color: '#888', padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button onClick={handleProfileUpdate} disabled={updating}
                        style={{ background: '#7c5cf0', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                      >
                        {updating ? 'Saving...' : <><Save size={14} /> Save Changes</>}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, padding: '12px 28px' }}>
                  {isEditing ? (
                    <form onSubmit={handleProfileUpdate}>
                      <div style={{ padding: '16px 0', borderBottom: '1px solid #1e1e1e' }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 8 }}>Full Name</label>
                        <input 
                          type="text" 
                          value={profileForm.name} 
                          onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="noir-input"
                          style={{ maxWidth: 400 }}
                          required
                        />
                      </div>
                      <div style={{ padding: '16px 0' }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 8 }}>Phone Number</label>
                        <input 
                          type="text" 
                          value={profileForm.phone} 
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="noir-input"
                          style={{ maxWidth: 400 }}
                          placeholder="+250 XXX XXX XXX"
                        />
                      </div>
                    </form>
                  ) : (
                    <>
                      <InfoRow label="Name"  value={user.name ?? '—'} />
                      <InfoRow label="Email" value={user.email ?? '—'} />
                      <InfoRow label="Phone" value={user.phone ?? '—'} />
                      <InfoRow label="Role"  value={user.role ?? 'CUSTOMER'} last />
                    </>
                  )}
                </div>

                {/* Password Change Section */}
                <div style={{ marginTop: 40 }}>
                   <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 20, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 10 }}>
                     <Lock size={18} style={{ color: '#7c5cf0' }} /> Change Password
                   </h2>
                   <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, padding: 28 }}>
                     <form onSubmit={handlePasswordChange} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                       <div>
                         <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 8 }}>Current Password</label>
                         <input 
                           type="password" 
                           value={passForm.oldPassword}
                           onChange={e => setPassForm({ ...passForm, oldPassword: e.target.value })}
                           className="noir-input"
                           placeholder="••••••••"
                         />
                       </div>
                       <div>
                         <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 8 }}>New Password</label>
                         <input 
                           type="password" 
                           value={passForm.newPassword}
                           onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                           className="noir-input"
                           placeholder="••••••••"
                         />
                       </div>
                       <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                         <button type="submit" disabled={passLoading || !passForm.oldPassword || !passForm.newPassword}
                           style={{ background: 'none', border: '1px solid #7c5cf0', color: '#7c5cf0', padding: '10px 24px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                           onMouseEnter={e => { e.currentTarget.style.background = '#7c5cf0'; e.currentTarget.style.color = '#fff' }}
                           onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#7c5cf0' }}
                         >
                           {passLoading ? 'Updating...' : 'Update Password'}
                         </button>
                       </div>
                     </form>
                   </div>
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 32, letterSpacing: '-0.02em' }}>My Orders</h1>
                
                {/* Order Sub-Tabs (Ref #2 & #5) */}
                <div style={{ 
                  display: 'flex', gap: 72, borderBottom: '1px solid #1e1e1e', 
                  marginBottom: 32, paddingBottom: 2, overflowX: 'auto', 
                  scrollbarWidth: 'none', position: 'relative'
                }}>
                  {[
                    { id: 'all', label: 'All', icon: ShoppingBag },
                    { id: 'PENDING', label: 'To Pay', icon: Wallet },
                    { id: 'PROCESSING', label: 'Processing', icon: Timer },
                    { id: 'SHIPPED', label: 'Shipped', icon: Truck },
                    { id: 'DELIVERED', label: 'To Review', icon: MessageSquareMore },
                    { id: 'CANCELLED', label: 'Returns', icon: RotateCcw }
                  ].map(sub => (
                    <button 
                      key={sub.id} 
                      onClick={() => setOrderSubTab(sub.id)}
                      style={{ 
                        background: 'none', border: 'none', padding: '0 0 14px 0',
                        color: orderSubTab === sub.id ? '#fff' : '#666',
                        fontSize: 14, fontWeight: orderSubTab === sub.id ? 700 : 500, 
                        cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 10,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <sub.icon size={18} strokeWidth={orderSubTab === sub.id ? 2 : 1.5} />
                      {sub.label}
                      {orderSubTab === sub.id && (
                        <motion.div 
                          layoutId="activeSubTabIndicator"
                          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#7c5cf0', borderRadius: 2 }} 
                        />
                      )}
                    </button>
                  ))}
                </div>

                {loadingOrders ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
                  </div>
                ) : (orders.filter(o => orderSubTab === 'all' || o.status === orderSubTab)).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '100px 0', background: '#111', border: '1px solid #1e1e1e', borderRadius: 20 }}>
                    <div style={{ width: 80, height: 80, background: '#161616', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <ShoppingBag size={32} style={{ color: '#2a2a2a' }} />
                    </div>
                    <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                      {orderSubTab === 'all' ? 'Your history is empty' : `No ${orderSubTab.toLowerCase().replace('_', ' ')} orders`}
                    </p>
                    <p style={{ color: '#555', fontSize: 14, maxWidth: 300, margin: '0 auto 32px', lineHeight: 1.6 }}>
                      {orderSubTab === 'CANCELLED' 
                        ? 'You haven\'t initiated any return requests yet.' 
                        : 'Explore our latest collections and find your next piece.'}
                    </p>
                    <Link to="/products" className="noir-btn-primary shine" style={{ display: 'inline-flex', padding: '14px 32px', fontSize: 14, fontWeight: 700 }}>
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {orders
                      .filter(order => orderSubTab === 'all' || order.status === orderSubTab)
                      .map(order => (
                      <div key={order.orderId} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                          <div style={{ width: 48, height: 48, background: '#1a1a1a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c5cf0' }}>
                            <Package size={20} />
                          </div>
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Order #{order.orderId}</p>
                            <p style={{ fontSize: 13, color: '#666' }}>{order.items?.length ?? 0} items · ${parseFloat(order.totalAmount ?? 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100, background: STATUS_COLORS[order.status] + '15', color: STATUS_COLORS[order.status], letterSpacing: '0.05em' }}>
                              {order.status}
                            </span>
                            <p style={{ fontSize: 11, color: '#444', marginTop: 6 }}>PLACED ON {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <ChevronRight size={18} style={{ color: '#333' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'address' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Shipping Addresses</h3>
                  <button 
                    onClick={() => setShowAddressForm(true)}
                    className="noir-btn-outline" 
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    + Add Address
                  </button>
                </div>

                {/* Add Address Form - Normal Slide-down */}
                {showAddressForm && (
                  <div className="fade-in" style={{ 
                    background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, 
                    padding: 28, marginBottom: 32 
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div className="form-group-noir">
                        <label style={{ color: '#888' }}>STREET ADDRESS</label>
                        <input 
                          className="noir-input"
                          value={addressForm.street} 
                          onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                          placeholder="e.g. 123 Designer Row" 
                        />
                      </div>
                      <div className="form-group-noir">
                        <label style={{ color: '#888' }}>CITY</label>
                        <input 
                          className="noir-input"
                          value={addressForm.city} 
                          onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                          placeholder="Kigali" 
                        />
                      </div>
                      <div className="form-group-noir">
                        <label style={{ color: '#888' }}>STATE / PROVINCE</label>
                        <input 
                          className="noir-input"
                          value={addressForm.state} 
                          onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                          placeholder="Gasabo" 
                        />
                      </div>
                      <div className="form-group-noir">
                        <label style={{ color: '#888' }}>POSTAL CODE</label>
                        <input 
                          className="noir-input"
                          value={addressForm.zipCode} 
                          onChange={e => setAddressForm({...addressForm, zipCode: e.target.value})}
                          placeholder="00000" 
                        />
                      </div>
                      <div className="form-group-noir" style={{ gridColumn: 'span 2' }}>
                        <label style={{ color: '#888' }}>COUNTRY</label>
                        <input 
                          className="noir-input"
                          value={addressForm.country} 
                          onChange={e => setAddressForm({...addressForm, country: e.target.value})}
                          placeholder="Rwanda" 
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                      <button 
                        onClick={handleAddAddress}
                        disabled={loading}
                        className="noir-btn-primary" 
                        style={{ flex: 1, padding: '14px' }}
                      >
                        {loading ? 'Saving...' : 'Save Address'}
                      </button>
                      <button 
                        onClick={() => setShowAddressForm(false)}
                        className="noir-btn-outline" 
                        style={{ padding: '14px 24px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 && !showAddressForm ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16 }}>
                    <MapPin size={40} style={{ color: '#2a2a2a', margin: '0 auto 14px' }} />
                    <p style={{ color: '#888', fontSize: 15 }}>No saved addresses.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {addresses.map(addr => (
                      <div 
                        key={addr.id} 
                        style={{ 
                          background: '#141414', border: '1px solid #1e1e1e', 
                          borderRadius: 16, padding: '20px 24px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <div>
                          {addr.isDefault && (
                            <span style={{ 
                              fontSize: 10, fontWeight: 800, color: '#7c5cf0', 
                              letterSpacing: '0.12em', display: 'block', marginBottom: 6 
                            }}>
                              DEFAULT
                            </span>
                          )}
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{addr.street}</p>
                          <p style={{ fontSize: 13, color: '#666' }}>{addr.city}, {addr.country}</p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 12 }}>
                          {!addr.isDefault && (
                            <button 
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              style={{ 
                                background: 'none', border: 'none', color: '#7c5cf0', 
                                fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 4 
                              }}
                            >
                              Set as Default
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteAddress(addr.id)}
                            style={{ 
                              background: 'none', border: 'none', color: '#f87171', 
                              fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 4 
                            }}
                          >
                            Delete
                          </button>
                        </div>
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
