import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Heart, ShoppingBag, User, Package, LogOut, Menu } from 'lucide-react'
import { motion, useScroll, useTransform, useSpring, useMotionTemplate } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'

export default function Header() {
  const { user, logout, isAdmin }                           = useAuth()
  const { count }                                           = useCart()
  const { setCartOpen, setPaletteOpen, setMobileNavOpen }   = useUI()
  const navigate                                            = useNavigate()
  const location                                            = useLocation()
  const [userMenuOpen, setUserMenuOpen]                     = useState(false)
  const [prevCount, setPrevCount]                           = useState(count)
  const [badgeKey, setBadgeKey]                             = useState(0)
  const userMenuRef                                         = useRef(null)

  // Scroll-linked transforms — liquid glass
  const { scrollY }  = useScroll()
  const rawHeight    = useTransform(scrollY, [0, 80], [76, 58])
  const height       = useSpring(rawHeight, { stiffness: 180, damping: 28 })
  const bgOpacity    = useTransform(scrollY, [0, 80], [0.35, 0.62])
  const blurPx       = useTransform(scrollY, [0, 80], [22, 32])
  const saturatePct  = useTransform(scrollY, [0, 80], [160, 200])
  const borderOpac   = useTransform(scrollY, [0, 80], [0.04, 0.10])
  const bgStyle      = useMotionTemplate`rgba(10,10,12,${bgOpacity})`
  const filterStyle  = useMotionTemplate`blur(${blurPx}px) saturate(${saturatePct}%)`
  const borderStyle  = useMotionTemplate`rgba(255,255,255,${borderOpac})`

  // Cart badge pulse on count increase
  useEffect(() => {
    if (count > prevCount) setBadgeKey(k => k + 1)
    setPrevCount(count)
  }, [count]) // eslint-disable-line

  // Close user menu on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const isActive = (path, search = '') =>
    location.pathname === path && (!search || location.search === search)

  return (
    <motion.header
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        height,
        display: 'flex', alignItems: 'center',
      }}
    >
      {/* Liquid-glass background layer */}
      <motion.div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          backgroundColor: bgStyle,
          backdropFilter: filterStyle,
          WebkitBackdropFilter: filterStyle,
          borderBottom: '1px solid',
          borderBottomColor: borderStyle,
          // Subtle inner highlight for the "liquid" sheen
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(255,255,255,0.02)',
        }}
      />
      {/* Soft top gradient sheen */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 60%), radial-gradient(80% 120% at 50% -20%, rgba(124,92,240,0.10), transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container-noir" style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'relative', zIndex: 1,
      }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c5cf0', display: 'block' }} />
          <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.12em' }}>NOIR</span>
        </Link>

        {/* Center nav — hidden on mobile */}
        <nav className="nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {[
            { label: 'Shop',      to: '/products',                   search: '' },
            { label: 'Audio',     to: '/products', search: '?category=Audio' },
            { label: 'Wearables', to: '/products', search: '?category=Wearables' },
            { label: 'Computing', to: '/products', search: '?category=Computing' },
          ].map(({ label, to, search }) => {
            const href   = to + search
            const active = location.pathname + location.search === href
                        || (label === 'Shop' && location.pathname === '/products' && !location.search)
            return (
              <Link
                key={label}
                to={href}
                className="story-link"
                style={{ fontSize: 14, fontWeight: 400, color: active ? '#fff' : '#888', transition: 'color 0.2s' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#ccc' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#888' }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

          <IconBtn onClick={() => setPaletteOpen(true)} title="Search (⌘K)">
            <Search size={18} />
          </IconBtn>

          <Link to="/wishlist">
            <IconBtn><Heart size={18} /></IconBtn>
          </Link>

          {/* Cart → drawer */}
          <div style={{ position: 'relative' }}>
            <IconBtn onClick={() => setCartOpen(true)}>
              <ShoppingBag size={18} />
            </IconBtn>
            {count > 0 && (
              <motion.span
                key={badgeKey}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{
                  position: 'absolute', top: 2, right: 2,
                  background: '#7c5cf0', color: '#fff',
                  borderRadius: '50%', width: 15, height: 15,
                  fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                {count > 9 ? '9+' : count}
              </motion.span>
            )}
          </div>

          {/* Account */}
          {user ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <IconBtn onClick={() => setUserMenuOpen(o => !o)}>
                <User size={18} />
              </IconBtn>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#141414', border: '1px solid #2a2a2a',
                  borderRadius: 12, padding: '6px', minWidth: 160,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 100,
                }}>
                  <DropdownItem to="/account" icon={<User size={14} />} onClick={() => setUserMenuOpen(false)}>My account</DropdownItem>
                  <DropdownItem to="/orders"  icon={<Package size={14} />} onClick={() => setUserMenuOpen(false)}>My orders</DropdownItem>
                  {isAdmin && (
                    <DropdownItem to="/admin" icon={<span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', color: '#7c5cf0' }}>ADM</span>} onClick={() => setUserMenuOpen(false)}>
                      Admin panel
                    </DropdownItem>
                  )}
                  <div style={{ height: 1, background: '#2a2a2a', margin: '4px 6px' }} />
                  <DropdownItem danger icon={<LogOut size={14} />} onClick={() => { logout(); setUserMenuOpen(false); navigate('/') }}>
                    Sign out
                  </DropdownItem>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login"><IconBtn><User size={18} /></IconBtn></Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="mobile-menu-btn"
            style={{ background: 'none', border: 'none', color: '#888', padding: 8, alignItems: 'center', cursor: 'pointer', borderRadius: 6, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#888'}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </motion.header>
  )
}

function IconBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none', border: 'none', color: '#888',
        padding: 8, display: 'flex', alignItems: 'center',
        transition: 'color 0.2s', borderRadius: 6, cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
      onMouseLeave={e => e.currentTarget.style.color = '#888'}
    >
      {children}
    </button>
  )
}

function DropdownItem({ to, icon, onClick, danger, children }) {
  const base = {
    display: 'flex', alignItems: 'center', gap: 9,
    width: '100%', padding: '9px 10px', borderRadius: 8,
    fontSize: 13, fontWeight: 500, border: 'none', background: 'none',
    color: danger ? '#f87171' : '#aaa',
    cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
    textDecoration: 'none',
  }

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        style={base}
        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: '#1e1e1e', color: '#fff' })}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'none', color: base.color })}
      >
        {icon}{children}
      </Link>
    )
  }
  return (
    <button
      onClick={onClick}
      style={base}
      onMouseEnter={e => Object.assign(e.currentTarget.style, { background: danger ? 'rgba(239,68,68,0.08)' : '#1e1e1e', color: danger ? '#f87171' : '#fff' })}
      onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'none', color: base.color })}
    >
      {icon}{children}
    </button>
  )
}
