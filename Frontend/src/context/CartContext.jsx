import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import apiService from '../api/service'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const { user }          = useAuth()

  const count = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0)
  const total = items.reduce((sum, i) => sum + (parseFloat(i.unitPrice ?? i.price ?? 0)) * (i.quantity ?? 1), 0)

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await apiService.cart.get()
      setItems(data.data?.items ?? [])
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    if (user) {
      Promise.resolve().then(() => fetchCart())
    } else {
      Promise.resolve().then(() => setItems([]))
    }
  }, [user, fetchCart])

  const addToCart = async (variantId, quantity = 1) => {
    try {
      await apiService.cart.addItem({ variantId, quantity })
      await fetchCart()
      toast.success('Added to cart')
    } catch {
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

  return (
    <CartContext.Provider value={{ items, count, total, addToCart, removeFromCart, updateQuantity, fetchCart }}>
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
