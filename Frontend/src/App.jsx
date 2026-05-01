import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider }    from './context/AuthContext'
import { CartProvider }    from './context/CartContext'
import { UIProvider }      from './context/UIContext'
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
import AdminLayout         from './pages/admin/AdminLayout'
import AdminDashboard      from './pages/admin/AdminDashboard'
import AdminProducts       from './pages/admin/AdminProducts'
import AdminCategories     from './pages/admin/AdminCategories'
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
            <UIProvider>
              <Routes>
                {/* Admin section — no SiteLayout, ADMIN role required */}
                <Route path="/admin/*" element={<AdminSection />} />

                {/* Customer site — wrapped in SiteLayout */}
                <Route path="*" element={<CustomerSite />} />
              </Routes>
            </UIProvider>
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
        <Route index          element={<AdminDashboard />} />
        <Route path="products"   element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteLayout>
  )
}
