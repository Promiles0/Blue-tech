import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { X, Search, User, LogOut } from 'lucide-react'
import { useUI } from '../../context/UIContext'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { label: 'Shop',      to: '/products' },
  { label: 'Audio',     to: '/products?category=Audio' },
  { label: 'Wearables', to: '/products?category=Wearables' },
  { label: 'Cameras',   to: '/products?category=Cameras' },
  { label: 'Computing', to: '/products?category=Computing' },
]

export default function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen, setPaletteOpen } = useUI()
  const { user, logout, isAdmin } = useAuth()
  const navigate         = useNavigate()

  const close = () => setMobileNavOpen(false)

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />

          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              width: 'min(320px, 85vw)',
              background: 'var(--bg)', borderRight: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column',
              padding: 24, zIndex: 201,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'block' }} />
                <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.12em' }}>NOIR</span>
              </div>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--muted)', display: 'flex', padding: 8, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Nav items — stagger */}
            <nav style={{ flex: 1 }}>
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + i * 0.05, duration: 0.28 }}
                >
                  <Link
                    to={item.to}
                    onClick={close}
                    style={{
                      display: 'block',
                      fontFamily: '"Space Grotesk",sans-serif',
                      fontSize: 26, fontWeight: 800,
                      color: 'var(--text)', padding: '10px 0',
                      letterSpacing: '-0.02em',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Bottom actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
              <button
                onClick={() => { setPaletteOpen(true); close() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 16px',
                  color: 'var(--muted)', fontSize: 14, cursor: 'pointer',
                }}
              >
                <Search size={15} /> Search products
              </button>

              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)', fontSize: 14, fontWeight: 700 }}>
                      <User size={15} /> Admin panel
                    </Link>
                  )}
                  <Link to="/account" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 14 }}>
                    <User size={15} /> Profile
                  </Link>
                  {!isAdmin && (
                    <Link to="/orders" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 14 }}>
                      <User size={15} /> My orders
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); close(); navigate('/') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'none', border: 'none',
                      color: '#ef4444', fontSize: 14, cursor: 'pointer', padding: 0,
                    }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 14 }}>
                  <User size={15} /> Sign in
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
