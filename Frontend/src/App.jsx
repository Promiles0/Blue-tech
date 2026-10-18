import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider }         from './context/ThemeContext'
import LanguageProvider          from './components/site/LanguageProvider'
import { CurrencyProvider }      from './context/CurrencyContext'
import { AuthProvider }    from './context/AuthContext'
import { CartProvider }    from './context/CartContext'
import { UIProvider }      from './context/UIContext'
import { WishlistProvider }       from './context/WishlistContext'
import { NotificationProvider }  from './context/NotificationContext'
import { useAuth }               from './context/AuthContext'
import SiteLayout          from './components/site/SiteLayout'
import SplashScreen        from './components/site/SplashScreen'
import ProtectedRoute      from './components/ProtectedRoute'

// Loaded only when first visited, so shoppers don't download the admin dashboard and
// checkout code just to browse the store.
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const InteractiveScreensPage = lazy(() => import('./pages/InteractiveScreensPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const PromotionPage = lazy(() => import('./pages/PromotionPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminShipments = lazy(() => import('./pages/admin/AdminShipments'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'))
const AdminQuoteRequests = lazy(() => import('./pages/admin/AdminQuoteRequests'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'))
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'))
const AdminHeroSlides = lazy(() => import('./pages/admin/AdminHeroSlides'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminBlue = lazy(() => import('./pages/admin/AdminBlue'))
const AdminProformas = lazy(() => import('./pages/admin/AdminProformas'))

function PageFallback() {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skeleton" style={{ width: 160, height: 10, borderRadius: 6 }} />
    </div>
  )
}
import HomePage            from './pages/HomePage'
import ProductsPage        from './pages/ProductsPage'
import ProductDetailPage   from './pages/ProductDetailPage'
import NotFoundPage           from './pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2 } },
})

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

// Shows the typing-effect splash for at least as long as the wordmark takes to type out, AND at
// least until auth resolves — whichever is longer. `children` always renders immediately
// underneath (real data-fetching starts in parallel). Once both conditions are met, `exiting`
// tells the splash to start its fade-out; it only actually stops being rendered once the splash
// reports the fade has finished (onExited), so the transition can't get cut short.
// The animated splash is a first-visit welcome; returning shoppers go straight to the store.
const SPLASH_KEY = 'bt-splash-seen'
function splashAlreadySeen() {
  try {
    const seen = localStorage.getItem(SPLASH_KEY) === '1'
    if (!seen) localStorage.setItem(SPLASH_KEY, '1')
    return seen
  } catch { return false }
}

function SplashGate({ children }) {
  const { loading } = useAuth()
  const [typingDone, setTypingDone] = useState(false)
  const [splashGone, setSplashGone] = useState(splashAlreadySeen)
  const exiting = typingDone && !loading

  return (
    <>
      {!splashGone && (
        <SplashScreen
          exiting={exiting}
          onTypingDone={() => setTypingDone(true)}
          onExited={() => setSplashGone(true)}
        />
      )}
      {children}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
      <CurrencyProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <SplashGate>
                <CartProvider>
                  <WishlistProvider>
                    <NotificationProvider>
                      <UIProvider>
                        <ScrollToTop />
                        <Suspense fallback={<PageFallback />}><Routes>
                          {/* Admin section — no SiteLayout, ADMIN role required */}
                          <Route path="/admin/*" element={<AdminSection />} />

                          {/* Customer site — wrapped in SiteLayout */}
                          <Route path="*" element={<CustomerSite />} />
                        </Routes></Suspense>
                      </UIProvider>
                    </NotificationProvider>
                  </WishlistProvider>
                </CartProvider>
              </SplashGate>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </CurrencyProvider>
    </LanguageProvider>
    </ThemeProvider>
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
    <Suspense fallback={<PageFallback />}><Routes>
      <Route element={<AdminLayout />}>
        <Route index             element={<AdminDashboard />} />
        <Route path="products"   element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders"     element={<AdminOrders />} />
        <Route path="shipments"  element={<AdminShipments />} />
        <Route path="users"      element={<AdminUsers />} />
        <Route path="reviews"    element={<AdminReviews />} />
        <Route path="quote-requests" element={<AdminQuoteRequests />} />
        <Route path="coupons"      element={<AdminCoupons />} />
        <Route path="hero-slides"  element={<AdminHeroSlides />} />
        <Route path="analytics"    element={<AdminAnalytics />} />
        <Route path="audit"          element={<AdminAudit />} />
        <Route path="notifications"  element={<AdminNotifications />} />
        <Route path="settings"       element={<AdminSettings />} />
        <Route path="blue"           element={<AdminBlue />} />
        <Route path="proformas"      element={<AdminProformas />} />
      </Route>
    </Routes></Suspense>
  )
}

function CustomerSite() {
  const { isAdmin, loading } = useAuth()
  if (loading) return null
  return (
    <SiteLayout>
      {isAdmin && <AdminBar />}
      <Suspense fallback={<PageFallback />}><Routes>
        <Route path="/"             element={<HomePage />} />
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/products"          element={<ProductsPage />} />
        <Route path="/products/:id"      element={<ProductDetailPage />} />
        <Route path="/interactive-screens" element={<InteractiveScreensPage />} />
        <Route path="/search"            element={<SearchPage />} />
        <Route path="/compare"           element={<ComparePage />} />
        <Route path="/category/:slug"    element={<CategoryPage />} />

        <Route path="/cart"     element={<CartPage />} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/account"  element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders"        element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="/orders/:id"    element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/help"          element={<HelpPage />} />
        <Route path="/promotions/:slug" element={<PromotionPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes></Suspense>
    </SiteLayout>
  )
}

function AdminBar() {
  const { pathname } = useLocation()

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'rgba(10,10,12,0.92)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--accent-border)',
      borderRadius: 999,
      padding: '8px 16px 8px 12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px var(--accent-dim)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent-light)', textTransform: 'uppercase' }}>
          Admin Preview
        </span>
      </div>
      <div style={{ width: 1, height: 14, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {pathname}
      </span>
      <div style={{ width: 1, height: 14, background: 'var(--border)' }} />
      <Link
        to="/admin"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11,
          fontWeight: 700,
          color: '#fff',
          background: 'var(--accent-dim2)',
          border: '1px solid var(--accent-border)',
          borderRadius: 999,
          padding: '4px 12px',
          textDecoration: 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-focus)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-dim2)' }}
      >
        <LayoutDashboard size={11} /> Dashboard
      </Link>
    </div>
  )
}
