import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [wishlistIds, setWishlistIds] = useState(new Set())

  const load = useCallback(() => {
    if (!user) { setWishlistIds(new Set()); return }
    api.get('/wishlist')
      .then(({ data }) => {
        const items = data?.data?.items ?? data?.items ?? []
        setWishlistIds(new Set(items.map(i => i.productId)))
      })
      .catch(() => setWishlistIds(new Set()))
  }, [user])

  useEffect(() => { load() }, [load])

  const toggle = async (productId, productName) => {
    if (!user) return
    const wasWishlisted = wishlistIds.has(productId)
    setWishlistIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
    try {
      await api.post(`/wishlist/${productId}`)
      if (wasWishlisted) {
        toast(productName ? `${productName} removed from wishlist` : 'Removed from wishlist')
      } else {
        toast.success(productName ? `${productName} saved to your wishlist` : 'Saved to wishlist')
      }
    } catch {
      load()
    }
  }

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggle }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be inside WishlistProvider')
  return ctx
}
