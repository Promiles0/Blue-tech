import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Heart, ShoppingBag, User, Package, LogOut, Menu, Bell, ChevronDown, X, Sun, Moon } from 'lucide-react'
import NotificationBell from './site/NotificationBell'
import { motion, useScroll, useTransform, useSpring, useMotionTemplate, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useTheme } from '../context/ThemeContext'
import apiService from '../api/service'

export default function Header() {
  const { user, logout, isAdmin }                           = useAuth()
  const { count }                                           = useCart()
  const { setCartOpen, setMobileNavOpen }                   = useUI()
  const { theme, toggleTheme }                              = useTheme()
  const navigate                                            = useNavigate()
  const [userMenuOpen, setUserMenuOpen]                     = useState(false)
  const [browseOpen, setBrowseOpen]                         = useState(false)
  const [searchOpen, setSearchOpen]                         = useState(false)
  const [searchQuery, setSearchQuery]                       = useState('')
  const [badgeKey, setBadgeKey]                             = useState(0)
  const prevCountRef                                       = useRef(count)
  const userMenuRef                                         = useRef(null)
  const browseRef                                           = useRef(null)
  const searchRef                                           = useRef(null)
  const searchInputRef                                      = useRef(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiService.categories.getAll()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 1000 * 60 * 5,
  })

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
    if (count > prevCountRef.current) setBadgeKey(k => k + 1)
    prevCountRef.current = count
  }, [count])

  // Close menus on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (browseRef.current && !browseRef.current.contains(e.target)) setBrowseOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) { setSearchOpen(false); setSearchQuery('') }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 60)
  }, [searchOpen])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

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
          backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.85)' : bgStyle,
          backdropFilter: filterStyle,
          WebkitBackdropFilter: filterStyle,
          borderBottom: '1px solid',
          borderBottomColor: theme === 'light' ? 'rgba(0,0,0,0.08)' : borderStyle,
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
            'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 60%), radial-gradient(80% 120% at 50% -20%, var(--accent-dim), transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container-noir" style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'relative', zIndex: 1,
      }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'block' }} />
          <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.12em', color: 'var(--text)' }}>NOIR</span>
        </Link>

        {/* Center nav — hidden on mobile */}
        <nav className="nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <Link
            to="/products"
            className="story-link"
            style={{ fontSize: 14, fontWeight: 400, color: 'var(--text)', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--muted)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text)' }}
          >
            Shop
          </Link>

          <div ref={browseRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setBrowseOpen(open => !open)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 14, fontWeight: 400, color: 'var(--text)',
                background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--muted)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text)' }}
            >
              Browse
              <ChevronDown size={14} style={{ transform: browseOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {browseOpen && (
              <>
                {/* Full-width mega menu — fixed to viewport width */}
                <div
                  style={{
                    position: 'fixed',
                    top: 'var(--header-h, 58px)',
                    left: 0, right: 0,
                    background: 'var(--bg)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderBottom: '1px solid var(--glass-border)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                    zIndex: 99,
                    padding: '36px 0 40px',
                  }}
                >
                  <div className="container-noir">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 48 }}>

                      {/* Left — label */}
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
                          Shop by category
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 200 }}>
                          Explore our full range of considered products.
                        </p>
                        <Link
                          to="/products"
                          onClick={() => setBrowseOpen(false)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            marginTop: 20, fontSize: 13, fontWeight: 600,
                            color: 'var(--accent)', textDecoration: 'none',
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          View all <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                        </Link>
                      </div>

                      {/* Right — category grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {categories.map(cat => (
                          <Link
                            key={cat.categoryId}
                            to={`/products?category=${encodeURIComponent(cat.name)}`}
                            onClick={() => setBrowseOpen(false)}
                            style={{
                              display: 'block',
                              padding: '14px 16px',
                              borderRadius: 12,
                              background: 'var(--glass-bg)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--text)',
                              textDecoration: 'none',
                              fontSize: 14,
                              fontWeight: 500,
                              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'var(--accent-dim)'
                              e.currentTarget.style.borderColor = 'var(--accent-border)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'var(--glass-bg)'
                              e.currentTarget.style.borderColor = 'var(--glass-border)'
                            }}
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Click-away backdrop */}
                <div
                  onClick={() => setBrowseOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                />
              </>
            )}
          </div>
        </nav>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

          {/* Inline expanding search */}
          <div ref={searchRef} style={{ display: 'flex', alignItems: 'center' }}>
            <AnimatePresence mode="wait">
              {searchOpen ? (
                <motion.form
                  key="search-open"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                  onSubmit={handleSearch}
                  style={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 10, padding: '0 12px',
                    height: 36, width: '100%',
                    boxShadow: '0 0 0 3px var(--accent-dim)',
                  }}>
                    <Search size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginRight: 8 }} />
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search…"
                      style={{
                        flex: 1, background: 'none', border: 'none',
                        outline: 'none', color: 'var(--text)', fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', padding: 0, marginLeft: 4 }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </motion.form>
              ) : null}
            </AnimatePresence>
            <IconBtn
              onClick={() => { setSearchOpen(o => !o); if (searchOpen) setSearchQuery('') }}
              title="Search"
              active={searchOpen}
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </IconBtn>
          </div>

          <Link to="/wishlist">
            <IconBtn><Heart size={18} /></IconBtn>
          </Link>

          {user && <NotificationBell />}

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
                  background: 'var(--accent)', color: '#fff',
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

          {/* Theme toggle */}
          <IconBtn onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </IconBtn>

          {/* Account — avatar circle when logged in */}
          {user ? (
            <div ref={userMenuRef} style={{ position: 'relative', marginLeft: 4 }}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: userMenuOpen ? 'var(--accent-hover)' : 'var(--accent)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${userMenuOpen ? 'var(--accent-border)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
                  outline: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.background = 'var(--accent)' }}
                title={user.name ?? user.email}
              >
                {(user.name ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </button>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '6px', minWidth: 180,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)', zIndex: 100,
                }}>
                  {/* User info header */}
                  <div style={{ padding: '10px 12px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'var(--accent)', color: '#fff',
                        fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {(user.name ?? user.email ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <DropdownItem to="/account"       icon={<User size={14} />}     onClick={() => setUserMenuOpen(false)}>My profile</DropdownItem>
                  <DropdownItem to="/orders"        icon={<Package size={14} />}  onClick={() => setUserMenuOpen(false)}>My orders</DropdownItem>
                  <DropdownItem to="/notifications" icon={<Bell size={14} />}     onClick={() => setUserMenuOpen(false)}>Notifications</DropdownItem>
                  {isAdmin && (
                    <DropdownItem to="/admin" icon={<span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--accent)' }}>ADM</span>} onClick={() => setUserMenuOpen(false)}>
                      Admin panel
                    </DropdownItem>
                  )}
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />
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
            style={{ background: 'none', border: 'none', color: 'var(--text)', padding: 8, alignItems: 'center', cursor: 'pointer', borderRadius: 6, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--muted)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </motion.header>
  )
}

function IconBtn({ children, onClick, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'var(--accent-dim)' : 'none',
        border: 'none',
        color: active ? 'var(--accent-light)' : 'var(--text)',
        padding: 8, display: 'flex', alignItems: 'center',
        transition: 'color 0.2s, background 0.2s', borderRadius: 8, cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--muted)'; if (!active) e.currentTarget.style.background = 'var(--overlay-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.color = active ? 'var(--accent-light)' : 'var(--text)'; e.currentTarget.style.background = active ? 'var(--accent-dim)' : 'none' }}
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
    color: danger ? '#f87171' : 'var(--text)',
    cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
    textDecoration: 'none',
  }

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        style={base}
        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'var(--overlay-hover)', color: 'var(--text)' })}
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
      onMouseEnter={e => Object.assign(e.currentTarget.style, { background: danger ? 'rgba(239,68,68,0.08)' : 'var(--overlay-hover)', color: danger ? '#f87171' : 'var(--text)' })}
      onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'none', color: base.color })}
    >
      {icon}{children}
    </button>
  )
}
