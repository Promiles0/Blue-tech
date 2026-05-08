import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import apiService from '../api/service'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user, logout } = useAuth()
  const [wishlistIds, setWishlistIds] = useState(new Set())

  const load = useCallback(() => {
    if (!user) { setWishlistIds(new Set()); return }
    apiService.wishlist.get()
      .then(({ data }) => {
        // interceptor already unwraps ApiResponse → data is WishlistResponse
        const items = data?.items ?? []
        setWishlistIds(new Set(items.map(i => Number(i.productId))))
      })
      .catch(() => setWishlistIds(new Set()))
  }, [user])

  useEffect(() => { load() }, [load])

  const toggle = async (productId, productName) => {
    if (!user) return
    const numId = Number(productId)
    const wasWishlisted = wishlistIds.has(numId)
    setWishlistIds(prev => {
      const next = new Set(prev)
      if (next.has(numId)) next.delete(numId)
      else next.add(numId)
      return next
    })
    try {
      await apiService.wishlist.toggle(numId)
      if (wasWishlisted) {
        toast(productName ? `${productName} removed from wishlist` : 'Removed from wishlist')
      } else {
        toast.success(productName ? `${productName} saved to your wishlist` : 'Saved to wishlist')
      }
    } catch (err) {
      const status = err.response?.status
      const message = err.response?.data?.message?.toLowerCase() || ''
      if (status === 401 || status === 403 || message.includes('invalid or expired token') || message.includes('unauthorized')) {
        logout()
        window.location.href = '/login'
        return
      }
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
