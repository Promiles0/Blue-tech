import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart,
  Truck, Users, MessageSquare, BarChart3, ScrollText,
  LogOut, ArrowLeft, Bell, Tag, Image, Sun, Moon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import AdminNotificationBell from '../../components/admin/AdminNotificationBell'

const NAV = [
  { to: '/admin',            label: 'Overview',    icon: LayoutDashboard, end: true },
  { to: '/admin/products',   label: 'Products',    icon: Package },
  { to: '/admin/categories', label: 'Categories',  icon: FolderTree },
  { to: '/admin/orders',     label: 'Orders',      icon: ShoppingCart },
  { to: '/admin/shipments',  label: 'Shipments',   icon: Truck },
  { to: '/admin/users',      label: 'Users',       icon: Users },
  { to: '/admin/reviews',    label: 'Reviews',     icon: MessageSquare },
  { to: '/admin/coupons',      label: 'Coupons',      icon: Tag },
  { to: '/admin/hero-slides',  label: 'Hero Slides',  icon: Image },
  { to: '/admin/analytics',    label: 'Analytics',    icon: BarChart3 },
  { to: '/admin/audit',          label: 'Audit Log',      icon: ScrollText },
  { to: '/admin/notifications',  label: 'Notifications',  icon: Bell },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="admin-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--admin-bg)', color: 'var(--text)' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0,
        borderRight: '1px solid var(--admin-sidebar-border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', inset: '0 auto 0 0',
        background: 'var(--admin-sidebar)',
        zIndex: 20,
      }}>
        {/* Logo & Theme Toggle */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--admin-sidebar-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: theme === 'light' ? '#ffffff' : 'var(--admin-primary)', flexShrink: 0 }} />
            <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.14em', color: '#ffffff' }}>NOIR</span>
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: theme === 'light' ? '#354380' : 'var(--admin-primary)',
              background: '#ffffff', padding: '2px 6px', borderRadius: 4,
            }}>ADMIN</span>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--admin-sidebar-muted)', padding: 4, display: 'flex', alignItems: 'center',
              borderRadius: 6, transition: 'color 0.15s, background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--admin-sidebar-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-sidebar-muted)'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Back to store */}
        <div style={{ padding: '10px 10px 4px' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 7, fontSize: 12, color: 'var(--admin-sidebar-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--admin-sidebar-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-sidebar-muted)'}
          >
            <ArrowLeft size={12} /> Back to store
          </NavLink>
        </div>

        {/* Nav label */}
        <div style={{ padding: '14px 18px 6px', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--admin-sidebar-muted)', opacity: 0.5, textTransform: 'uppercase' }}>
          Admin
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '2px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
               style={({ isActive }) => ({
                 display: 'flex', alignItems: 'center', gap: 9,
                 padding: '8px 11px', borderRadius: 8,
                 fontSize: 13, fontWeight: 500,
                 color: isActive ? 'var(--admin-sidebar-text)' : 'var(--admin-sidebar-muted)',
                 background: isActive ? 'var(--admin-sidebar-active)' : 'transparent',
                 textDecoration: 'none',
                 transition: 'color 0.15s, background 0.15s',
               })}
               onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = 'var(--admin-sidebar-text)' }}
               onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = 'var(--admin-sidebar-muted)' }}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--admin-sidebar-border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-sidebar-text)', opacity: 0.95, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name ?? 'Admin'}</div>
          <div style={{ fontSize: 11, color: 'var(--admin-sidebar-muted)', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--admin-sidebar-muted)', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-sidebar-muted)'}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', background: 'var(--admin-bg)' }}>
        {/* Top bar with admin bell */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          padding: '10px 24px',
          background: 'var(--admin-bg)',
          borderBottom: '1px solid var(--admin-border)',
        }}>
          <AdminNotificationBell />
        </div>
        <Outlet />
      </main>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            border: '1px solid #262626',
            color: '#fff',
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}
