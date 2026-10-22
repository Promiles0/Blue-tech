import { NavLink, useLocation } from 'react-router-dom'
import { Home, Store, LayoutGrid, ShoppingBag, User } from 'lucide-react'
import { useT } from '../../lib/i18n'
import { useCart } from '../../context/CartContext'
import { useUI } from '../../context/UIContext'
import { useAuth } from '../../context/AuthContext'

// Phones: the five things people reach for most, always one thumb-tap away (UX audit B11).
// Hidden on checkout, which has its own sticky "Confirm & pay" bar.
const HIDDEN_ON = ['/checkout', '/login', '/register']

export default function MobileTabBar() {
  const { t } = useT()
  const { count } = useCart()
  const { setCartOpen, setMobileNavOpen } = useUI()
  const { user, isAdmin } = useAuth()
  const { pathname } = useLocation()
  if (isAdmin || HIDDEN_ON.some(p => pathname.startsWith(p))) return null

  return (
    <nav className="tabbar" aria-label={t('Quick links')}>
      <NavLink to="/" end className="tabbar-item"><Home size={20} /><span>{t('Home')}</span></NavLink>
      <NavLink to="/products" className="tabbar-item"><Store size={20} /><span>{t('Shop')}</span></NavLink>
      <button type="button" className="tabbar-item" onClick={() => setMobileNavOpen(true)}>
        <LayoutGrid size={20} /><span>{t('Categories')}</span>
      </button>
      <button type="button" className="tabbar-item" onClick={() => setCartOpen(true)} aria-label={count > 0 ? t('Cart, {n} items', { n: count }) : t('Cart')}>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <ShoppingBag size={20} />
          {count > 0 && <span className="tabbar-badge" aria-hidden>{count > 9 ? '9+' : count}</span>}
        </span>
        <span aria-hidden>{t('Cart')}</span>
      </button>
      <NavLink to={user ? '/account' : '/login'} className="tabbar-item"><User size={20} /><span>{user ? t('Account') : t('Sign in')}</span></NavLink>
    </nav>
  )
}
