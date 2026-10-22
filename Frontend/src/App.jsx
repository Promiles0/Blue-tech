import { LazyMotion } from 'framer-motion'
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom'
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
import { CampaignBanner }  from './components/site/SaleBits'
import { captureReferral } from './lib/referral'
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
const AboutPage = lazy(() => import('./pages/AboutPage'))
const PromotionPage = lazy(() => import('./pages/PromotionPage'))
const SalePage = lazy(() => import('./pages/SalePage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'))
const AdminQuoteRequests = lazy(() => import('./pages/admin/AdminQuoteRequests'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'))
const AdminErrors = lazy(() => import('./pages/admin/AdminErrors'))
const AdminCatalogHealth = lazy(() => import('./pages/admin/AdminCatalogHealth'))
const AdminServiceRequests = lazy(() => import('./pages/admin/AdminServiceRequests'))
const AdminRestock = lazy(() => import('./pages/admin/AdminRestock'))
const AdminSpreadsheets = lazy(() => import('./pages/admin/AdminSpreadsheets'))
const AdminSecurity = lazy(() => import('./pages/admin/AdminSecurity'))
const AdminQuestions = lazy(() => import('./pages/admin/AdminQuestions'))
const AdminSales = lazy(() => import('./pages/admin/AdminSales'))
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'))
const AdminHeroSlides = lazy(() => import('./pages/admin/AdminHeroSlides'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminBlue = lazy(() => import('./pages/admin/AdminBlue'))
const AdminProformas = lazy(() => import('./pages/admin/AdminProformas'))
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'))
const AdminPrograms = lazy(() => import('./pages/admin/AdminPrograms'))

function PageFallback() {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skeleton" style={{ width: 160, height: 10, borderRadius: 6 }} />
    </div>
  )
}
import HomePage            from './pages/HomePage'
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
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

const loadMotionFeatures = () => import('./lib/motionFeatures').then(r => r.default)

export default function App() {
  return (
    <LazyMotion features={loadMotionFeatures}>
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
    </LazyMotion>
  )
}

// Pages only admins may open; staff see a short explanation instead.
function AdminOnly({ children }) {
  const { isAdmin } = useAuth()
  if (isAdmin) return children
  return (
    <div style={{ padding: 40, maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Admins only</h1>
      <p style={{ color: 'var(--admin-muted)', fontSize: 14, lineHeight: 1.6 }}>
        Your staff account can manage orders, shipping, products, quotes, proformas, reviews and messages.
        Ask an admin if you need access to this page.
      </p>
    </div>
  )
}

function AdminSection() {
  const { canUseAdmin, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !canUseAdmin) navigate('/login', { state: { from: '/admin' }, replace: true })
  }, [canUseAdmin, loading, navigate])

  if (loading) return null
  if (!canUseAdmin) return null

  return (
    <Suspense fallback={<PageFallback />}><Routes>
      <Route element={<AdminLayout />}>
        <Route index             element={<AdminDashboard />} />
        <Route path="products"   element={<AdminProducts />} />
        <Route path="categories" element={<AdminOnly><AdminCategories /></AdminOnly>} />
        <Route path="orders"     element={<AdminOrders />} />
        <Route path="shipments"  element={<Navigate to="/admin/orders?filter=to-ship" replace />} />
        <Route path="users"      element={<AdminOnly><AdminUsers /></AdminOnly>} />
        <Route path="reviews"    element={<AdminReviews />} />
        <Route path="quote-requests" element={<AdminQuoteRequests />} />
        <Route path="coupons"      element={<AdminOnly><AdminCoupons /></AdminOnly>} />
        <Route path="hero-slides"  element={<AdminOnly><AdminHeroSlides /></AdminOnly>} />
        <Route path="analytics"    element={<AdminOnly><AdminAnalytics /></AdminOnly>} />
        <Route path="audit"          element={<AdminOnly><AdminAudit /></AdminOnly>} />
        <Route path="errors"         element={<AdminOnly><AdminErrors /></AdminOnly>} />
        <Route path="catalog-health" element={<AdminCatalogHealth />} />
        <Route path="service-requests" element={<AdminServiceRequests />} />
        <Route path="restock"        element={<AdminRestock />} />
        <Route path="spreadsheets"   element={<AdminSpreadsheets />} />
        <Route path="security"       element={<AdminSecurity />} />
        <Route path="questions"      element={<AdminQuestions />} />
        <Route path="sales"          element={<AdminOnly><AdminSales /></AdminOnly>} />
        <Route path="notifications"  element={<AdminNotifications />} />
        <Route path="settings"       element={<AdminOnly><AdminSettings /></AdminOnly>} />
        <Route path="blue"           element={<AdminOnly><AdminBlue /></AdminOnly>} />
        <Route path="proformas"      element={<AdminProformas />} />
        <Route path="messages"       element={<AdminMessages />} />
        <Route path="programs"       element={<AdminOnly><AdminPrograms /></AdminOnly>} />
      </Route>
    </Routes></Suspense>
  )
}

function CustomerSite() {
  const { isAdmin, loading } = useAuth()
  useEffect(() => { captureReferral() }, [])   // ?ref=CODE invite links
  if (loading) return null
  return (
    <SiteLayout>
      {isAdmin && <AdminBar />}
      <CampaignBanner />
      <Suspense fallback={<PageFallback />}><Routes>
        <Route path="/"             element={<HomePage />} />
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/products"          element={<ProductsPage />} />
        <Route path="/products/:id"      element={<ProductDetailPage />} />
        <Route path="/interactive-screens" element={<InteractiveScreensPage />} />
        <Route path="/search"            element={<SearchPage />} />
        <Route path="/compare"           element={<ComparePage />} />
        <Route path="/about"             element={<AboutPage />} />
        <Route path="/category/:slug"    element={<CategoryPage />} />

        <Route path="/cart"     element={<CartPage />} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/account"  element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders"        element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="/orders/:id"    element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/help"          element={<HelpPage />} />
        <Route path="/promotions/:slug" element={<PromotionPage />} />
        <Route path="/sale/:slug"       element={<SalePage />} />

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
