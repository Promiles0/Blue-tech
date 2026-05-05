import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider }    from './context/AuthContext'
import { CartProvider }    from './context/CartContext'
import { UIProvider }      from './context/UIContext'
import { WishlistProvider } from './context/WishlistContext'
import { useAuth }         from './context/AuthContext'
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
import NotFoundPage        from './pages/NotFoundPage'
import AdminLayout         from './pages/admin/AdminLayout'
import AdminDashboard      from './pages/admin/AdminDashboard'
import AdminProducts       from './pages/admin/AdminProducts'
import AdminCategories     from './pages/admin/AdminCategories'
import AdminOrders         from './pages/admin/AdminOrders'
import AdminShipments      from './pages/admin/AdminShipments'
import AdminUsers          from './pages/admin/AdminUsers'
import AdminReviews        from './pages/admin/AdminReviews'
import AdminAnalytics      from './pages/admin/AdminAnalytics'
import AdminAudit          from './pages/admin/AdminAudit'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <UIProvider>
                <Toaster position="bottom-right" richColors />
                <Routes>
                  {/* Admin section — no SiteLayout, ADMIN role required */}
                  <Route path="/admin/*" element={<AdminSection />} />

                  {/* Customer site — wrapped in SiteLayout */}
                  <Route path="*" element={<CustomerSite />} />
                </Routes>
              </UIProvider>
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
        <Route path="analytics"  element={<AdminAnalytics />} />
        <Route path="audit"      element={<AdminAudit />} />
      </Route>
    </Routes>
  )
}

function CustomerSite() {
  return (
    <SiteLayout>
      <Routes>
        <Route path="/"             element={<HomePage />} />
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/products"     element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        <Route path="/cart"     element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/account"  element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders"   element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteLayout>
  )
}
