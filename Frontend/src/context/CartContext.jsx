import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const { user }          = useAuth()

  const count = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0)
  const total = items.reduce((sum, i) => sum + parseFloat(i.unitPrice ?? 0) * (i.quantity ?? 1), 0)

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart')
      setItems(data?.items ?? [])
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    if (user) fetchCart()
    else setItems([])
  }, [user, fetchCart])

  const addToCart = async (variantId, quantity = 1) => {
    await api.post('/cart', { variantId, quantity })
    await fetchCart()
    toast.success('Added to cart')
  }

  const removeFromCart = async (cartItemId) => {
    await api.delete(`/cart/${cartItemId}`)
    await fetchCart()
    toast('Item removed from cart')
  }

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity < 1) {
      await api.delete(`/cart/${cartItemId}`)
      await fetchCart()
      toast('Item removed from cart')
      return
    }
    await api.patch(`/cart/${cartItemId}`, { quantity })
    await fetchCart()
    toast.success('Quantity updated')
  }

  const isInCart = (variantId) => items.some(i => i.variantId === variantId)

  return (
    <CartContext.Provider value={{ items, count, total, addToCart, removeFromCart, updateQuantity, fetchCart, isInCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
