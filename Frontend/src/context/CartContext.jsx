import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { track } from '../lib/analytics'
import { toast } from 'sonner'
import apiService from '../api/service'
import { useAuth } from './AuthContext'
import { useT } from '../lib/i18n'
import { getProductThumb } from '../lib/productImage'

// Lets the motion layer fly the product photo into the cart icon.
const announceAdded = (snapshot) => window.dispatchEvent(new CustomEvent('bt:added-to-cart', { detail: { image: snapshot ? getProductThumb(snapshot.product ?? snapshot) : null } }))

const CartContext = createContext(null)

// Guests can fill a cart before signing in. It lives in this browser only, in the same
// shape as a server cart item, and is merged into their account cart when they sign in.
const GUEST_KEY = 'bt-guest-cart'
function readGuest() {
  try {
    const saved = JSON.parse(localStorage.getItem(GUEST_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch { return [] }
}
function writeGuest(items) {
  try {
    if (items.length) localStorage.setItem(GUEST_KEY, JSON.stringify(items))
    else localStorage.removeItem(GUEST_KEY)
  } catch { /* non-fatal */ }
}


const NO_SAVINGS = { bundleDiscount: 0, saleItemsTotal: 0, saleSavings: 0, bundlesApplied: [] }

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const { user, logout } = useAuth()
  const { t } = useT()

  const count = items.length
  // Use cartTotal from backend when available, fallback to client calculation
  const [serverTotal, setServerTotal] = useState(0)
  // Bundle savings and the sale part of the cart (coupons skip sale items), from the API.
  const [savings, setSavings] = useState(NO_SAVINGS)
  const total = serverTotal || items.reduce((sum, i) => sum + parseFloat(i.unitPrice ?? 0) * (i.quantity ?? 1), 0)
  const cart = { items }

  // Tracks the active user to discard stale in-flight fetch responses after an account switch
  const activeUserRef = useRef(user?.userId ?? null)

  const fetchCart = useCallback(async () => {
    const expectedUser = activeUserRef.current
    try {
      const { data } = await apiService.cart.get()
      // Discard response if the user changed while the request was in flight
      if (activeUserRef.current !== expectedUser) return
      setItems(data?.items ?? [])
      setServerTotal(parseFloat(data?.cartTotal ?? 0))
      setSavings({
        bundleDiscount: Number(data?.bundleDiscount) || 0,
        saleItemsTotal: Number(data?.saleItemsTotal) || 0,
        saleSavings: Number(data?.saleSavings) || 0,
        bundlesApplied: data?.bundlesApplied ?? [],
      })
    } catch {
      if (activeUserRef.current === expectedUser) {
        setItems([])
        setServerTotal(0)
        setSavings(NO_SAVINGS)
      }
    }
  }, [])

  useEffect(() => {
    activeUserRef.current = user?.userId ?? null
    // Always clear immediately so no previous user's items ever bleed through
    setItems([])
    setServerTotal(0)
    setSavings(NO_SAVINGS)
    if (!user) { setItems(readGuest()); return }

    // Just signed in: move anything added as a guest into the account cart, then load it.
    const guest = readGuest()
    if (!guest.length) { fetchCart(); return }
    writeGuest([])
    Promise.allSettled(guest.map(g => apiService.cart.addItem({ variantId: g.variantId, quantity: g.quantity })))
      .then(results => {
        const moved = results.filter(r => r.status === 'fulfilled').length
        if (moved) toast.success(moved === 1 ? t('1 item from before you signed in is in your cart') : t('{n} items from before you signed in are in your cart', { n: moved }))
        if (moved < guest.length) toast.error(t('Some items could not be added — they may be out of stock'))
      })
      .finally(fetchCart)
  }, [user, fetchCart])

  const setGuest = (next) => { writeGuest(next); setItems(next) }

  const addToCart = async (variantId, quantity = 1, snapshot = null) => {
    if (!user) {
      const current = readGuest()
      const existing = current.find(i => i.variantId === variantId)
      const next = existing
        ? current.map(i => i.variantId === variantId ? { ...i, quantity: i.quantity + quantity } : i)
        : [...current, { cartItemId: `guest-${variantId}`, variantId, quantity, ...(snapshot ?? {}) }]
      setGuest(next)
      toast.success(t('Added to cart'))
      announceAdded(snapshot)
      track('add_to_cart', { value: (snapshot?.unitPrice ?? 0) * quantity, items: [{ id: snapshot?.product?.productId ?? variantId, name: snapshot?.productName, price: snapshot?.unitPrice, quantity }] })
      return
    }
    try {
      await apiService.cart.addItem({ variantId, quantity })
      await fetchCart()
      toast.success(t('Added to cart'))
      announceAdded(snapshot)
      track('add_to_cart', { value: (snapshot?.unitPrice ?? 0) * quantity, items: [{ id: snapshot?.product?.productId ?? variantId, name: snapshot?.productName, price: snapshot?.unitPrice, quantity }] })
    } catch (err) {
      const status = err.response?.status
      const message = err.response?.data?.message?.toLowerCase() || ''
      if (status === 401 || status === 403 || message.includes('invalid or expired token') || message.includes('unauthorized')) {
        logout()
        window.location.href = '/login'
        return
      }
      toast.error(t('Failed to add to cart'))
    }
  }

  const removeFromCart = async (itemId) => {
    if (!user) { setGuest(readGuest().filter(i => i.cartItemId !== itemId)); toast(t('Item removed')); return }
    try {
      await apiService.cart.removeItem(itemId)
      await fetchCart()
      toast(t('Item removed'))
    } catch {
      toast.error(t('Failed to remove item'))
    }
  }

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return removeFromCart(itemId)
    if (!user) { setGuest(readGuest().map(i => i.cartItemId === itemId ? { ...i, quantity } : i)); return }
    try {
      await apiService.cart.updateQuantity(itemId, quantity)
      await fetchCart()
    } catch {
      toast.error(t('Failed to update quantity'))
    }
  }

  const isInCart = (variantId) => items.some(i => i.variantId === variantId)
  const clearCart = () => {
    if (!user) writeGuest([])
    setItems([])
    setServerTotal(0)
    setSavings(NO_SAVINGS)
  }

  return (
    <CartContext.Provider value={{ cart, items, count, total, savings, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart, isInCart }}>
      {children}
    </CartContext.Provider>
  )
}

/* eslint-disable-next-line react-refresh/only-export-components */
export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
