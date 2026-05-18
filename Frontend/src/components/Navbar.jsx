import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Heart, ShoppingBag, User, X, Package, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import apiService from '../api/service'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { count }            = useCart()
  const navigate             = useNavigate()
  const [searchOpen, setSearchOpen]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const userMenuRef = useRef(null)
  const megaRef = useRef(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiService.categories.getAll()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
      if (megaRef.current && !megaRef.current.contains(e.target)) {
        setMegaOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  // const isActive = (path) => location.pathname === path

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
          <NavLink to="/products">
            Shop
          </NavLink>

          <div
            ref={megaRef}
            style={{ position: 'relative' }}
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button
              onMouseEnter={e => e.currentTarget.style.color = '#ccc'}
              onMouseLeave={e => e.currentTarget.style.color = '#fff'}
              style={{
                fontSize: 14, fontWeight: 400,
                color: '#fff', background: 'none', border: 'none', cursor: 'pointer',
                transition: 'color 0.2s', padding: 0,
              }}
            >
              Browse
            </button>

            {megaOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 12px)', left: 0,
                width: 320, background: '#0f0f10', border: '1px solid #222',
                borderRadius: 18, padding: 20, boxShadow: '0 28px 64px rgba(0,0,0,0.35)',
                zIndex: 100,
              }}>
                <p style={{ margin: 0, marginBottom: 14, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7c5cf0' }}>
                  Shop by category
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  {categories.slice(0, 8).map(cat => (
                    <Link
                      key={cat.categoryId}
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      style={{
                        display: 'block', padding: '10px 12px', borderRadius: 14,
                        color: '#fff', textDecoration: 'none', background: '#141414',
                        transition: 'background 0.2s, color 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#1c1c1c'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#141414'; e.currentTarget.style.color = '#fff' }}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
                <Link
                  to="/products"
                  style={{
                    display: 'inline-flex', marginTop: 16, alignItems: 'center', gap: 8,
                    fontSize: 13, color: '#7c5cf0', textDecoration: 'none', fontWeight: 600,
                  }}
                >
                  View all categories
                </Link>
              </div>
            )}
          </div>
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

          {!isAdmin && (
            <>
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
            </>
          )}

          {user ? (
            <div ref={userMenuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => setUserMenuOpen(o => !o)}
                style={{ 
                  width: 32, height: 32, borderRadius: '50%', background: '#7c5cf0', 
                  color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', border: 'none', 
                  cursor: 'pointer', marginLeft: 8, transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                  background: '#141414', border: '1px solid #2a2a2a',
                  borderRadius: 12, padding: '6px', minWidth: 180,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 100,
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a2a', marginBottom: 4 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>{user.name}</p>
                    <p style={{ fontSize: 11, color: '#666', margin: 0 }}>{user.email}</p>
                  </div>

                  {isAdmin && (
                    <DropdownItem to="/admin" icon={<LayoutDashboard size={14} />} onClick={() => setUserMenuOpen(false)}>
                      Admin Dashboard
                    </DropdownItem>
                  )}
                  
                  <DropdownItem to="/account" icon={<User size={14} />} onClick={() => setUserMenuOpen(false)}>
                    Account Settings
                  </DropdownItem>

                  {!isAdmin && (
                    <DropdownItem to="/orders" icon={<Package size={14} />} onClick={() => setUserMenuOpen(false)}>
                      My Orders
                    </DropdownItem>
                  )}

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

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        fontSize: 14, fontWeight: 400,
        color: '#fff',
        transition: 'color 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = '#ccc' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#fff' }}
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
        background: 'none', border: 'none', color: '#fff',
        padding: 8, display: 'flex', alignItems: 'center',
        transition: 'color 0.2s', borderRadius: 6,
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#ccc'}
      onMouseLeave={e => e.currentTarget.style.color = '#fff'}
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
    color: danger ? '#f87171' : '#fff',
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
