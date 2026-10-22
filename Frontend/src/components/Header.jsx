import { useState, useRef, useEffect } from 'react'
import { useT } from '../lib/i18n'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, User, Package, LogOut, Menu, Bell } from 'lucide-react'
import NotificationBell from './site/NotificationBell'
import CategoriesMenu from './site/CategoriesMenu'
import HeaderSearch from './site/HeaderSearch'
import PreferencesMenu from './site/PreferencesMenu'
import HelpMenu from './site/HelpMenu'
import Logo from './site/Logo'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'

export default function Header() {
  const { t } = useT()
  const { user, logout, isAdmin, canUseAdmin }              = useAuth()
  const { count }                                           = useCart()
  const { setCartOpen, setMobileNavOpen }                   = useUI()
  const navigate                                            = useNavigate()
  const [userMenuOpen, setUserMenuOpen]                     = useState(false)
  const userMenuRef                                         = useRef(null)

  // Close the account menu on an outside click or Escape
  useEffect(() => {
    const onDown = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setUserMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])

  // Fixed height and a plain frosted background: no resizing while scrolling (UX audit D1).
  return (
    <header className="site-header">
      <div className="container-noir hdr-row">
        <Link to="/" className="hdr-logo" aria-label={t('Blue-Tech home')}>
          <Logo height={17} />
        </Link>

        {/* Center nav, hidden on phones (the menu has it) */}
        <nav className="nav-links" aria-label={t('Main')}>
          <Link to="/products" className="story-link hdr-nav-link">{t('Store')}</Link>
          <CategoriesMenu />
          <Link to="/interactive-screens" className="story-link hdr-nav-link">{t('Interactive Screens')}</Link>
        </nav>

        <HeaderSearch className="hdr-search-inline" />

        <div className="hdr-icons">
          <span className="hdr-hide-sm"><PreferencesMenu /></span>
          <span className="hdr-hide-sm"><HelpMenu /></span>
          {!isAdmin && (
            <Link to="/wishlist" className="hdr-icon hdr-hide-sm" aria-label={t('Wishlist')} title={t('Wishlist')}>
              <Heart size={19} />
            </Link>
          )}
          {user && !isAdmin && <NotificationBell />}
          {!isAdmin && (
            <button type="button" className="hdr-icon hdr-hide-phone" onClick={() => setCartOpen(true)}
              aria-label={count > 0 ? t('Cart, {n} items', { n: count }) : t('Cart')} title={t('Cart')}>
              <ShoppingBag size={19} />
              {count > 0 && <span className="hdr-badge" aria-hidden>{count > 9 ? '9+' : count}</span>}
            </button>
          )}

          {user ? (
            <div ref={userMenuRef} style={{ position: 'relative' }} className={isAdmin ? undefined : 'hdr-hide-phone'}>
              <button
                type="button"
                className="hdr-icon"
                onClick={() => setUserMenuOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label={t('Account menu')}
                title={user.name ?? user.email}
              >
                <span className="hdr-avatar">{(user.name ?? user.email ?? 'U').charAt(0).toUpperCase()}</span>
              </button>
              {userMenuOpen && (
                <div className="hdr-menu" role="menu" style={{ minWidth: 200 }}>
                  <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.isGuest ? t('Guest checkout') : user.email}
                    </p>
                  </div>
                  {!isAdmin && <DropdownItem to="/account"       icon={<User size={14} />}     onClick={() => setUserMenuOpen(false)}>{user.isGuest ? t('Save my account') : t('My profile')}</DropdownItem>}
                  {!isAdmin && <DropdownItem to="/orders"        icon={<Package size={14} />}  onClick={() => setUserMenuOpen(false)}>{t('My orders')}</DropdownItem>}
                  {!isAdmin && <DropdownItem to="/notifications" icon={<Bell size={14} />}     onClick={() => setUserMenuOpen(false)}>{t('Notifications')}</DropdownItem>}
                  {canUseAdmin && (
                    <DropdownItem to="/admin" icon={<span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--accent-light)' }}>ADM</span>} onClick={() => setUserMenuOpen(false)}>
                      {t('Admin panel')}
                    </DropdownItem>
                  )}
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />
                  <DropdownItem danger icon={<LogOut size={14} />} onClick={() => { logout(); setUserMenuOpen(false); navigate('/') }}>
                    {t('Sign out')}
                  </DropdownItem>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="hdr-icon hdr-hide-phone" aria-label={t('Sign in')} title={t('Sign in')}><User size={19} /></Link>
          )}

          <button type="button" onClick={() => setMobileNavOpen(true)} className="hdr-icon mobile-menu-btn" aria-label={t('Open menu')}>
            <Menu size={21} />
          </button>
        </div>
      </div>

      {/* Phones and tablets: search gets its own full-width row under the bar */}
      <div className="container-noir hdr-search-row">
        <HeaderSearch />
      </div>
    </header>
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
      onMouseEnter={e => Object.assign(e.currentTarget.style, { background: danger ? 'var(--danger-soft)' : 'var(--overlay-hover)', color: danger ? 'var(--error)' : 'var(--text)' })}
      onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'none', color: base.color })}
    >
      {icon}{children}
    </button>
  )
}
