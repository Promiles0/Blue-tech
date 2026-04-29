import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home          from './pages/Home'
import Login         from './pages/Login'
import Register      from './pages/Register'
import Products      from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart          from './pages/Cart'
import Wishlist      from './pages/Wishlist'
import Account       from './pages/Account'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
            <Navbar />
            <Routes>
              <Route path="/"            element={<Home />} />
              <Route path="/login"       element={<Login />} />
              <Route path="/register"    element={<Register />} />
              <Route path="/products"    element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart"        element={<Cart />} />
              <Route path="/wishlist"    element={<Wishlist />} />
              <Route path="/account"     element={<Account />} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
