import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider }    from './context/AuthContext'
import { CartProvider }    from './context/CartContext'
import { UIProvider }      from './context/UIContext'
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
            </UIProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
