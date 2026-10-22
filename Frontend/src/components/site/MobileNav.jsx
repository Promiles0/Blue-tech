import { useEffect, useState } from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
import { useT } from '../../lib/i18n'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { X, User, LogOut, Heart, GitCompare, HelpCircle, Sparkles, Moon, Sun, Download } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { openLiveChat } from '../../lib/liveChat'
import { promptInstall, useCanInstall, isIosSafari } from '../../lib/pwa'
import CurrencySwitcher from './CurrencySwitcher'
import LanguageSwitcher from './LanguageSwitcher'
import { useUI } from '../../context/UIContext'
import { useAuth } from '../../context/AuthContext'
import Logo from './Logo'
import HeaderSearch from './HeaderSearch'

const NAV_ITEMS = [
  { label: 'Shop',                to: '/products' },
  { label: 'Interactive Screens', to: '/interactive-screens' },
  { label: 'Laptops',             to: '/products?category=Laptops' },
  { label: 'Desktops',            to: '/products?category=Desktops' },
  { label: 'Printers',            to: `/products?category=${encodeURIComponent('Printers & Photocopiers')}` },
  { label: 'Network Devices',     to: `/products?category=${encodeURIComponent('Network Devices')}` },
  { label: 'Accessories',         to: '/products?category=Accessories' },
]

export default function MobileNav() {
  const { t } = useT()
  const { mobileNavOpen, setMobileNavOpen } = useUI()
  const { user, logout, isAdmin, canUseAdmin } = useAuth()
  const navigate         = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const canInstall = useCanInstall()
  const [showIosHint, setShowIosHint] = useState(false)

  const close = () => setMobileNavOpen(false)
  // A search from inside the menu changes the page; close the menu when that happens.
  const { pathname, search } = useLocation()
  useEffect(() => { setMobileNavOpen(false) }, [pathname, search, setMobileNavOpen])

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
              padding: 20, zIndex: 201, overflowY: 'auto', overscrollBehavior: 'contain',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Logo height={17} />
              </div>
              <button onClick={close} aria-label={t('Close menu')} className="hdr-icon">
                <X size={20} />
              </button>
            </div>

            {/* Search first: it's what most people open the menu for (UX audit B11) */}
            <div style={{ marginBottom: 12 }}><HeaderSearch /></div>

            {/* Nav items — stagger */}
            <nav style={{ flex: 1 }}>
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  <Link
                    to={item.to}
                    onClick={close}
                    style={{
                      display: 'block',
                      fontFamily: '"Space Grotesk",sans-serif',
                      fontSize: 20, fontWeight: 700,
                      color: 'var(--text)', padding: '9px 0',
                      letterSpacing: '-0.02em',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
                  >
                    {t(item.label)}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Things the phone header hides to fit: wishlist, compare, help, Blue, theme, currency. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
              {!isAdmin && <Link to="/wishlist" onClick={close} className="mnav-chip"><Heart size={15} /> {t('Wishlist')}</Link>}
              <Link to="/compare" onClick={close} className="mnav-chip"><GitCompare size={15} /> {t('Compare')}</Link>
              <Link to="/help?v=faq" onClick={close} className="mnav-chip"><HelpCircle size={15} /> {t('Help')}</Link>
              <button onClick={() => { close(); openLiveChat() }} className="mnav-chip"><Sparkles size={15} /> {t('Ask Blue')}</button>
              <button onClick={toggleTheme} className="mnav-chip">
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />} {theme === 'dark' ? t('Light mode') : t('Dark mode')}
              </button>
              <div className="mnav-chip" style={{ justifyContent: 'space-between' }}>{t('Currency')} <CurrencySwitcher /></div>
              <div className="mnav-chip" style={{ justifyContent: 'space-between', gridColumn: '1 / -1' }}>{t('Language')} <LanguageSwitcher full /></div>
              {(canInstall || isIosSafari()) && (
                <button className="mnav-chip" style={{ gridColumn: '1 / -1', justifyContent: 'center', background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}
                  onClick={() => canInstall ? promptInstall() : setShowIosHint(v => !v)}>
                  <Download size={15} /> {t('Install the Blue-Tech app')}
                </button>
              )}
              {showIosHint && (
                <p style={{ gridColumn: '1 / -1', fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>{t('On iPhone: tap Share, then “Add to Home Screen”.')}</p>
              )}
            </div>

            {/* Bottom actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
              {user ? (
                <>
                  {canUseAdmin && (
                    <Link to="/admin" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-light)', fontSize: 14, fontWeight: 700 }}>
                      <User size={15} /> {t('Admin panel')}
                    </Link>
                  )}
                  <Link to="/account" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 14 }}>
                    <User size={15} /> {t('Profile')}
                  </Link>
                  {!isAdmin && (
                    <Link to="/orders" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 14 }}>
                      <User size={15} /> {t('My orders')}
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); close(); navigate('/') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'none', border: 'none',
                      color: 'var(--error)', fontSize: 14, cursor: 'pointer', padding: 0,
                    }}
                  >
                    <LogOut size={15} /> {t('Sign out')}
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 14 }}>
                  <User size={15} /> {t('Sign in')}
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
