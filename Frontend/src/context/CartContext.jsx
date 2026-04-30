import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const { user }          = useAuth()

  const count = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0)
  const total = items.reduce((sum, i) => sum + (parseFloat(i.unitPrice ?? i.price ?? 0)) * (i.quantity ?? 1), 0)

  const fetchCart = useCallback(async () => {
    try {
      // GET /api/cart → CartResponse (already unwrapped by interceptor)
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
    // POST /api/cart  body: { variantId, quantity }
    await api.post('/cart', { variantId, quantity })
    await fetchCart()
  }

  const removeFromCart = async (itemId) => {
    // DELETE /api/cart/{id}
    await api.delete(`/cart/${itemId}`)
    await fetchCart()
  }

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return removeFromCart(itemId)
    // Backend has no PATCH/PUT for quantity — remove and re-add
    const item = items.find(i => i.id === itemId)
    if (!item) return
    await removeFromCart(itemId)
    const variantId = item.variant?.id ?? item.variantId
    if (variantId) await api.post('/cart', { variantId, quantity })
    await fetchCart()
  }

  return (
    <CartContext.Provider value={{ items, count, total, addToCart, removeFromCart, updateQuantity, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
