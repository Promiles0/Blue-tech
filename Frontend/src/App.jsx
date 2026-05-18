import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider }    from './context/AuthContext'
import { CartProvider }    from './context/CartContext'
import { UIProvider }      from './context/UIContext'
import { WishlistProvider }       from './context/WishlistContext'
import { NotificationProvider }  from './context/NotificationContext'
import { useAuth }               from './context/AuthContext'
import SiteLayout          from './components/site/SiteLayout'
import ProtectedRoute      from './components/ProtectedRoute'
import HomePage            from './pages/HomePage'
import LoginPage           from './pages/LoginPage'
import RegisterPage        from './pages/RegisterPage'
import ProductsPage        from './pages/ProductsPage'
import ProductDetailPage   from './pages/ProductDetailPage'
import CartPage            from './pages/CartPage'
import WishlistPage        from './pages/WishlistPage'
import AccountPage         from './pages/AccountPage'
import CheckoutPage        from './pages/CheckoutPage'
import OrderHistoryPage    from './pages/OrderHistoryPage'
import OrderDetailPage     from './pages/OrderDetailPage'
import SearchPage         from './pages/SearchPage'
import CategoryPage       from './pages/CategoryPage'
import NotFoundPage           from './pages/NotFoundPage'
import NotificationsPage      from './pages/NotificationsPage'
import HelpPage               from './pages/HelpPage'
import AdminLayout            from './pages/admin/AdminLayout'
import AdminDashboard      from './pages/admin/AdminDashboard'
import AdminProducts       from './pages/admin/AdminProducts'
import AdminCategories     from './pages/admin/AdminCategories'
import AdminOrders         from './pages/admin/AdminOrders'
import AdminShipments      from './pages/admin/AdminShipments'
import AdminUsers          from './pages/admin/AdminUsers'
import AdminReviews        from './pages/admin/AdminReviews'
import AdminAnalytics      from './pages/admin/AdminAnalytics'
import AdminAudit          from './pages/admin/AdminAudit'
import AdminNotifications  from './pages/admin/AdminNotifications'
import AdminCoupons        from './pages/admin/AdminCoupons'
import AdminHeroSlides     from './pages/admin/AdminHeroSlides'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2 } },
})

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <NotificationProvider>
                <UIProvider>
                  <ScrollToTop />
                  <Routes>
                    {/* Admin section — no SiteLayout, ADMIN role required */}
                    <Route path="/admin/*" element={<AdminSection />} />

                    {/* Customer site — wrapped in SiteLayout */}
                    <Route path="*" element={<CustomerSite />} />
                  </Routes>
                </UIProvider>
              </NotificationProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function AdminSection() {
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/login', { state: { from: '/admin' }, replace: true })
  }, [isAdmin, loading, navigate])

  if (loading) return null
  if (!isAdmin) return null

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index             element={<AdminDashboard />} />
        <Route path="products"   element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders"     element={<AdminOrders />} />
        <Route path="shipments"  element={<AdminShipments />} />
        <Route path="users"      element={<AdminUsers />} />
        <Route path="reviews"    element={<AdminReviews />} />
        <Route path="coupons"      element={<AdminCoupons />} />
        <Route path="hero-slides"  element={<AdminHeroSlides />} />
        <Route path="analytics"    element={<AdminAnalytics />} />
        <Route path="audit"          element={<AdminAudit />} />
        <Route path="notifications"  element={<AdminNotifications />} />
      </Route>
    </Routes>
  )
}

function CustomerSite() {
  const { isAdmin, loading } = useAuth()
  if (loading) return null
  return (
    <SiteLayout>
      {isAdmin && <AdminBar />}
      <Routes>
        <Route path="/"             element={<HomePage />} />
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/products"          element={<ProductsPage />} />
        <Route path="/products/:id"      element={<ProductDetailPage />} />
        <Route path="/search"            element={<SearchPage />} />
        <Route path="/category/:slug"    element={<CategoryPage />} />

        <Route path="/cart"     element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/account"  element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders"        element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="/orders/:id"    element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/help"          element={<HelpPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteLayout>
  )
}

function AdminBar() {
  const { pathname } = useLocation()
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(10,10,12,0.92)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(124,92,240,0.35)',
      borderRadius: 999, padding: '8px 16px 8px 12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,92,240,0.1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c5cf0', boxShadow: '0 0 6px #7c5cf0' }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#7c5cf0', textTransform: 'uppercase' }}>Admin Preview</span>
      </div>
      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
      <span style={{ fontSize: 11, color: '#555', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {pathname}
      </span>
      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
      <Link to="/admin" style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 700, color: '#fff',
        background: 'rgba(124,92,240,0.2)', border: '1px solid rgba(124,92,240,0.3)',
        borderRadius: 999, padding: '4px 12px', textDecoration: 'none',
        transition: 'background 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,240,0.35)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,92,240,0.2)'}
      >
        <LayoutDashboard size={11} /> Dashboard
      </Link>
    </div>
  )
}
