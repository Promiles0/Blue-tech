import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Heart, ShoppingBag, User, X, Package, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout }     = useAuth()
  const { count }            = useCart()
  const navigate             = useNavigate()
  const location             = useLocation()
  const [searchOpen, setSearchOpen]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(10,10,10,0.92)',
      borderBottom: '1px solid #1a1a1a',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div className="container-noir" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c5cf0', display: 'block', flexShrink: 0 }} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.12em', color: '#fff' }}>NOIR</span>
        </Link>

        {/* Center links */}
        <div className="nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {[
            { label: 'Shop',       to: '/products' },
            { label: 'Audio',      to: '/products?category=Audio' },
            { label: 'Wearables',  to: '/products?category=Wearables' },
            { label: 'Computing',  to: '/products?category=Computing' },
          ].map(({ label, to }) => (
            <NavLink key={label} to={to} active={location.pathname + location.search === to || (to === '/products' && isActive('/products') && !location.search)}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {searchOpen ? (
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                style={{
                  background: '#1c1c1c', border: '1px solid #2a2a2a',
                  borderRadius: 6, padding: '7px 12px', color: '#fff',
                  fontSize: 13, outline: 'none', width: 200,
                }}
              />
              <IconBtn onClick={() => setSearchOpen(false)}><X size={16} /></IconBtn>
            </form>
          ) : (
            <IconBtn onClick={() => setSearchOpen(true)}><Search size={18} /></IconBtn>
          )}

          <Link to="/wishlist"><IconBtn><Heart size={18} /></IconBtn></Link>

          <Link to="/cart" style={{ position: 'relative' }}>
            <IconBtn><ShoppingBag size={18} /></IconBtn>
            {count > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                background: '#7c5cf0', color: '#fff', borderRadius: '50%',
                width: 16, height: 16, fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

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
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 100,
                }}>
                  <DropdownItem to="/account" icon={<User size={14} />} onClick={() => setUserMenuOpen(false)}>
                    My account
                  </DropdownItem>
                  <DropdownItem to="/orders" icon={<Package size={14} />} onClick={() => setUserMenuOpen(false)}>
                    My orders
                  </DropdownItem>
                  <div style={{ height: 1, background: '#2a2a2a', margin: '4px 6px' }} />
                  <DropdownItem
                    icon={<LogOut size={14} />}
                    onClick={() => { logout(); setUserMenuOpen(false); navigate('/') }}
                    danger
                  >
                    Sign out
                  </DropdownItem>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login"><IconBtn><User size={18} /></IconBtn></Link>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      style={{
        fontSize: 14, fontWeight: 400,
        color: active ? '#fff' : '#888',
        transition: 'color 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#ccc' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#888' }}
    >
      {children}
    </Link>
  )
}

function IconBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', color: '#888',
        padding: 8, display: 'flex', alignItems: 'center',
        transition: 'color 0.2s', borderRadius: 6,
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
    cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
    textDecoration: 'none',
  }
  const hover = { background: danger ? 'rgba(239,68,68,0.08)' : '#1e1e1e', color: danger ? '#f87171' : '#fff' }

  if (to) {
    return (
      <Link to={to} onClick={onClick} style={base}
        onMouseEnter={e => Object.assign(e.currentTarget.style, hover)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'none', color: base.color })}
      >
        {icon}{children}
      </Link>
    )
  }
  return (
    <button onClick={onClick} style={base}
      onMouseEnter={e => Object.assign(e.currentTarget.style, hover)}
      onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'none', color: base.color })}
    >
      {icon}{children}
    </button>
  )
}
