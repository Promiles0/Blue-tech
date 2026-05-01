import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Tag, ScrollText, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/admin',            label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/admin/products',   label: 'Products',   icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/audit',      label: 'Audit Logs', icon: ScrollText },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <aside style={{
        width: 232, flexShrink: 0,
        borderRight: '1px solid #1a1a1a',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', inset: '0 auto 0 0',
        background: '#0d0d0d',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c5cf0', display: 'block' }} />
            <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 800, fontSize: 14, letterSpacing: '0.12em' }}>NOIR</span>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#7c5cf0',
              background: 'rgba(124,92,240,0.12)', padding: '2px 6px', borderRadius: 4, marginLeft: 2,
            }}>ADMIN</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                color: isActive ? '#fff' : '#555',
                background: isActive ? '#1c1c1c' : 'transparent',
                textDecoration: 'none',
                transition: 'color 0.15s, background 0.15s',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {isActive && <ChevronRight size={12} style={{ opacity: 0.4 }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 2, fontWeight: 500 }}>{user?.name ?? 'Admin'}</div>
          <div style={{ fontSize: 11, color: '#444', marginBottom: 10 }}>{user?.email}</div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 12, color: '#555', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 232, flex: 1, padding: '40px 44px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}
