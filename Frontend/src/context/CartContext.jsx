import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import apiService from '../api/service'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const { user, logout } = useAuth()

  const count = items.length
  // Use cartTotal from backend when available, fallback to client calculation
  const [serverTotal, setServerTotal] = useState(0)
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
    } catch {
      if (activeUserRef.current === expectedUser) {
        setItems([])
        setServerTotal(0)
      }
    }
  }, [])

  useEffect(() => {
    activeUserRef.current = user?.userId ?? null
    // Always clear immediately so no previous user's items ever bleed through
    setItems([])
    setServerTotal(0)
    if (user) fetchCart()
  }, [user, fetchCart])

  const addToCart = async (variantId, quantity = 1) => {
    try {
      await apiService.cart.addItem({ variantId, quantity })
      await fetchCart()
      toast.success('Added to cart')
    } catch (err) {
      const status = err.response?.status
      const message = err.response?.data?.message?.toLowerCase() || ''
      if (status === 401 || status === 403 || message.includes('invalid or expired token') || message.includes('unauthorized')) {
        logout()
        window.location.href = '/login'
        return
      }
      toast.error('Failed to add to cart')
    }
  }

  const removeFromCart = async (itemId) => {
    try {
      await apiService.cart.removeItem(itemId)
      await fetchCart()
      toast('Item removed')
    } catch {
      toast.error('Failed to remove item')
    }
  }

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return removeFromCart(itemId)
    try {
      await apiService.cart.updateQuantity(itemId, quantity)
      await fetchCart()
    } catch {
      toast.error('Failed to update quantity')
    }
  }

  const isInCart = (variantId) => items.some(i => i.variantId === variantId)
  const clearCart = () => {
    setItems([])
    setServerTotal(0)
  }

  return (
    <CartContext.Provider value={{ cart, items, count, total, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart, isInCart }}>
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
