import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ProtectedRoute    from './components/ProtectedRoute'
import Navbar            from './components/Navbar'
import Footer            from './components/Footer'
import HomePage          from './pages/HomePage'
import LoginPage         from './pages/LoginPage'
import RegisterPage      from './pages/RegisterPage'
import ProductsPage      from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage          from './pages/CartPage'
import WishlistPage      from './pages/WishlistPage'
import AccountPage       from './pages/AccountPage'
import CheckoutPage      from './pages/CheckoutPage'
import OrderHistoryPage  from './pages/OrderHistoryPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
              <Navbar />
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
              <Footer />
            </div>
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                style: {
                  background: '#141414',
                  border: '1px solid #262626',
                  color: '#fff',
                  fontSize: '13px',
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
