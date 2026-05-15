import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit3, Save, X, Lock, MapPin, Plus, Trash2, CreditCard, MessageCircle, HelpCircle, ChevronRight, Languages, DollarSign, Palette, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import apiService from '../api/service'
import { useAuth } from '../context/AuthContext'

const LANGUAGES = ['English', 'French', 'Spanish', 'Arabic', 'Kinyarwanda', 'Swahili', 'Portuguese', 'German']
const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'RWF', label: 'RWF — Rwandan Franc' },
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
]
const THEMES = ['Dark', 'Light', 'System']

const formatDate = (v) => v ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

export default function Account() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  // ── Account Details ──────────────────────────────────────────
  const [editingDetails, setEditingDetails] = useState(false)
  const [detailsForm, setDetailsForm] = useState({ name: '', phone: '' })
  const [detailsSaving, setDetailsSaving] = useState(false)

  useEffect(() => {
    if (user) setDetailsForm({ name: user.name || '', phone: user.phone || '' })
  }, [user])

  const saveDetails = async () => {
    if (!detailsForm.name.trim()) return toast.error('Name is required')
    setDetailsSaving(true)
    try {
      const { data } = await apiService.auth.updateProfile({ name: detailsForm.name.trim(), phone: detailsForm.phone.trim() })
      updateUser(data.data)
      setEditingDetails(false)
      toast.success('Details updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setDetailsSaving(false)
    }
  }

  // ── Change Password ───────────────────────────────────────────
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '' })
  const [passSaving, setPassSaving] = useState(false)

  const savePassword = async (e) => {
    e.preventDefault()
    if (!passForm.oldPassword || !passForm.newPassword) return toast.error('Fill in both fields')
    setPassSaving(true)
    try {
      await apiService.auth.changePassword(passForm)
      setPassForm({ oldPassword: '', newPassword: '' })
      toast.success('Password changed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPassSaving(false)
    }
  }

  // ── Addresses ─────────────────────────────────────────────────
  const [addresses, setAddresses] = useState([])
  const [showAddrForm, setShowAddrForm] = useState(false)
  const [addrForm, setAddrForm] = useState({ street: '', city: '', state: '', zipCode: '', country: 'Rwanda' })
  const [addrSaving, setAddrSaving] = useState(false)

  useEffect(() => {
    if (user) {
      apiService.addresses.list()
        .then(({ data }) => setAddresses(Array.isArray(data) ? data : []))
        .catch(() => setAddresses([]))
    }
  }, [user])

  const saveAddress = async () => {
    if (!addrForm.street || !addrForm.city) return toast.error('Street and city are required')
    setAddrSaving(true)
    try {
      const { data } = await apiService.addresses.add(addrForm)
      setAddresses(prev => [...prev, data.data])
      setShowAddrForm(false)
      setAddrForm({ street: '', city: '', state: '', zipCode: '', country: 'Rwanda' })
      toast.success('Address added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address')
    } finally {
      setAddrSaving(false)
    }
  }

  const deleteAddress = async (id) => {
    try {
      await apiService.addresses.delete(id)
      setAddresses(prev => prev.filter(a => a.id !== id))
      toast.success('Address removed')
    } catch { toast.error('Failed to remove') }
  }

  const setDefaultAddress = async (id) => {
    try {
      await apiService.addresses.setDefault(id)
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
      toast.success('Default address updated')
    } catch { toast.error('Failed to update') }
  }

  // ── App Settings ─────────────────────────────────────────────
  const [language, setLanguage] = useState('English')
  const [currency, setCurrency] = useState('USD')
  const [theme, setTheme] = useState('Dark')

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#050505', padding: '72px 0 120px', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(124,92,240,0.07) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div className="container-noir" style={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 56 }}>
          <p className="label-muted" style={{ marginBottom: 10 }}>Account</p>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: 6 }}>My Profile</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Manage your personal details, addresses and security.</p>
        </motion.div>

        {/* ── Section 1: Account Details ── */}
        <Section title="Account Details" delay={0.05}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{user.name}</p>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Member since {formatDate(user.createdAt)}</p>
              </div>
            </div>
            {!editingDetails ? (
              <button onClick={() => setEditingDetails(true)} className="noir-btn-outline" style={{ borderRadius: 10, padding: '8px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Edit3 size={14} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditingDetails(false)} className="noir-btn-outline" style={{ borderRadius: 10, padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <X size={14} /> Cancel
                </button>
                <button onClick={saveDetails} disabled={detailsSaving} className="noir-btn-primary shine" style={{ borderRadius: 10, padding: '8px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Save size={14} /> {detailsSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {editingDetails ? (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Field label="Full Name">
                  <input className="noir-input" value={detailsForm.name} onChange={e => setDetailsForm(f => ({ ...f, name: e.target.value }))} style={{ borderRadius: 10 }} />
                </Field>
                <Field label="Phone Number">
                  <input className="noir-input" value={detailsForm.phone} onChange={e => setDetailsForm(f => ({ ...f, phone: e.target.value }))} placeholder="+250 XXX XXX XXX" style={{ borderRadius: 10 }} />
                </Field>
              </div>

              {/* Change Password — only visible in edit mode */}
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <Lock size={14} style={{ color: 'var(--muted)' }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Change Password</p>
                </div>
                <form onSubmit={savePassword} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <Field label="Current Password">
                    <input type="password" className="noir-input" value={passForm.oldPassword} onChange={e => setPassForm(f => ({ ...f, oldPassword: e.target.value }))} placeholder="••••••••" style={{ borderRadius: 10 }} />
                  </Field>
                  <Field label="New Password">
                    <input type="password" className="noir-input" value={passForm.newPassword} onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="••••••••" style={{ borderRadius: 10 }} />
                  </Field>
                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={passSaving || !passForm.oldPassword || !passForm.newPassword} className="noir-btn-primary shine" style={{ borderRadius: 10, padding: '10px 24px', fontSize: 13 }}>
                      {passSaving ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <div style={{ display: 'grid', gap: 0 }}>
              <InfoRow label="Full Name" value={user.name  ?? '—'} />
              <InfoRow label="Email"     value={user.email ?? '—'} />
              <InfoRow label="Phone"     value={user.phone ?? '—'} last />
            </div>
          )}
        </Section>

        {/* ── Section 2: Payment Methods ── */}
        <Section title="Payment Methods" delay={0.1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} style={{ color: 'var(--muted)' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>No payment methods saved</p>
              <p style={{ fontSize: 12, color: 'var(--muted-dark)', marginTop: 3 }}>Add a card to speed up checkout</p>
            </div>
          </div>
          <button
            style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.7 }}
            onClick={() => toast.info('Payment methods coming soon')}
          >
            <Plus size={15} /> Add payment method
          </button>
        </Section>

        {/* ── Section 3: Shopping Addresses ── */}
        <Section title="Shopping Addresses" delay={0.15}>
          <div style={{ display: 'grid', gap: 12, marginBottom: addresses.length > 0 ? 20 : 0 }}>
            {addresses.map(addr => (
              <motion.div key={addr.id} layout style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: `1px solid ${addr.isDefault ? 'rgba(124,92,240,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <MapPin size={16} style={{ color: addr.isDefault ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{addr.street}</p>
                      {addr.isDefault && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Default</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{addr.city}{addr.state ? `, ${addr.state}` : ''} · {addr.country}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {!addr.isDefault && (
                    <button onClick={() => setDefaultAddress(addr.id)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-dim)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >Set default</button>
                  )}
                  <button onClick={() => deleteAddress(addr.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-dim)'; e.currentTarget.style.color = 'var(--error)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {showAddrForm ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '24px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20 }}>New Address</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Street"><input className="noir-input" value={addrForm.street} onChange={e => setAddrForm(f => ({ ...f, street: e.target.value }))} placeholder="123 Main St" style={{ borderRadius: 10 }} /></Field>
                <Field label="City"><input className="noir-input" value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} placeholder="Kigali" style={{ borderRadius: 10 }} /></Field>
                <Field label="State"><input className="noir-input" value={addrForm.state} onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))} placeholder="Gasabo" style={{ borderRadius: 10 }} /></Field>
                <Field label="Postal Code"><input className="noir-input" value={addrForm.zipCode} onChange={e => setAddrForm(f => ({ ...f, zipCode: e.target.value }))} placeholder="00000" style={{ borderRadius: 10 }} /></Field>
                <Field label="Country" style={{ gridColumn: 'span 2' }}><input className="noir-input" value={addrForm.country} onChange={e => setAddrForm(f => ({ ...f, country: e.target.value }))} style={{ borderRadius: 10 }} /></Field>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={saveAddress} disabled={addrSaving} className="noir-btn-primary shine" style={{ borderRadius: 10, padding: '10px 22px', fontSize: 13 }}>
                  {addrSaving ? 'Saving…' : 'Save Address'}
                </button>
                <button onClick={() => setShowAddrForm(false)} className="noir-btn-outline" style={{ borderRadius: 10, padding: '10px 18px', fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <button onClick={() => setShowAddrForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.8 }}>
              <Plus size={15} /> Add new address
            </button>
          )}
        </Section>

        {/* ── Section 4: App Settings ── */}
        <Section title="App Settings" delay={0.2}>
          <SelectRow
            icon={<Languages size={16} />}
            label="Language"
            value={language}
            options={LANGUAGES.map(l => ({ value: l, label: l }))}
            onChange={setLanguage}
          />
          <SelectRow
            icon={<DollarSign size={16} />}
            label="Currency"
            value={currency}
            options={CURRENCIES.map(c => ({ value: c.code, label: c.label }))}
            onChange={setCurrency}
          />
          <SelectRow
            icon={<Palette size={16} />}
            label="Theme"
            value={theme}
            options={THEMES.map(t => ({ value: t, label: t }))}
            onChange={setTheme}
            last
          />
        </Section>

        {/* ── Section 5: Support & Help ── */}
        <Section title="Support & Help" delay={0.25}>
          <SettingRow icon={<HelpCircle size={16} />} label="FAQ" value="Browse common questions" onClick={() => toast.info('FAQ coming soon')} />
          <SettingRow icon={<Mail size={16} />} label="Contact Support" value="Get help from our team" onClick={() => toast.info('Support coming soon')} />
          <SettingRow icon={<Phone size={16} />} label="Live Chat" value="Chat with us in real time" onClick={() => toast.info('Live chat coming soon')} last />
        </Section>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => { logout(); navigate('/') }}
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.8, transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
          >
            Sign out
          </button>
        </motion.div>

      </div>
    </div>
  )
}

function Section({ title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{ marginBottom: 40 }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-dark)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{title}</p>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '28px 28px' }}>
        {children}
      </div>
    </motion.div>
  )
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <label className="label-muted" style={{ display: 'block', marginBottom: 8, fontSize: 11 }}>{label}</label>
      {children}
    </div>
  )
}

function InfoRow({ label, value, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function SettingRow({ icon, label, value, onClick, last }) {
  const isClickable = !!onClick
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)', cursor: isClickable ? 'pointer' : 'default', transition: 'opacity 0.15s' }}
      onMouseEnter={e => { if (isClickable) e.currentTarget.style.opacity = '0.7' }}
      onMouseLeave={e => { if (isClickable) e.currentTarget.style.opacity = '1' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'var(--muted)' }}>{icon}</span>
        <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{value}</span>
        {isClickable && <ChevronRight size={14} style={{ color: 'var(--muted-dark)' }} />}
      </div>
    </div>
  )
}

function SelectRow({ icon, label, value, options, onChange, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'var(--muted)' }}>{icon}</span>
        <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{label}</span>
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          color: '#fff',
          fontSize: 13,
          fontWeight: 500,
          padding: '7px 32px 7px 12px',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(124,92,240,0.5)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: '#1a1a1a', color: '#fff' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
