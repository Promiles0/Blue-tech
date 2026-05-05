import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import apiService from '../api/service'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Wishlist() {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState({})

  const fetchWishlist = useCallback(() => {
    if (!user) {
      Promise.resolve().then(() => setLoading(false))
      return
    }
    apiService.wishlist.get()
      .then(({ data }) => setItems(data.data?.items ?? (Array.isArray(data.data) ? data.data : [])))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { fetchWishlist() }, [fetchWishlist])

  // Wishlist uses toggle: POST /wishlist/{productId} to add OR remove
  const removeFromWishlist = async (productId) => {
    setToggling(prev => ({ ...prev, [productId]: true }))
    try {
      await apiService.wishlist.toggle(productId)
      setItems(prev => prev.filter(i => (i.variant?.product?.id ?? i.product?.id ?? i.productId) !== productId))
    } finally {
      setToggling(prev => ({ ...prev, [productId]: false }))
    }
  }

  const moveToCart = async (item) => {
    const variantId = item.variant?.id ?? item.variantId
    const productId = item.variant?.product?.id ?? item.product?.id ?? item.productId
    if (!variantId) return
    await addToCart(variantId, 1)
    if (productId) await removeFromWishlist(productId)
  }

  if (!user) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
      <Heart size={48} style={{ color: '#2a2a2a' }} />
      <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Sign in to view your wishlist</p>
      <Link to="/login" className="noir-btn-primary" style={{ padding: '12px 24px' }}>Sign in</Link>
    </div>
  )

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>Wishlist</h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 40 }}>{items.length} saved item{items.length !== 1 ? 's' : ''}</p>

        {loading ? (
          <div className="grid-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 12 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Heart size={48} style={{ color: '#2a2a2a', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, color: '#888', marginBottom: 20 }}>Your wishlist is empty.</p>
            <Link to="/products" className="noir-btn-primary" style={{ display: 'inline-flex', padding: '12px 24px' }}>Explore products</Link>
          </div>
        ) : (
          <div className="grid-4">
            {items.map(item => {
              const product = item.variant?.product ?? item.product ?? {}
              const productId = product.id ?? item.productId
              const img = product.images?.[0]?.imageUrl ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'
              const price = parseFloat(product.price ?? 0)
              const cat = product.category?.name ?? ''

              return (
                <div key={item.id} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
                  <Link to={`/products/${product.id}`} style={{ display: 'block', height: 200, overflow: 'hidden', background: '#1a1a1a' }}>
                    <img src={img} alt={product.name}
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                    />
                  </Link>
                  <div style={{ padding: '14px 16px 16px' }}>
                    {cat && <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#888', marginBottom: 5, textTransform: 'uppercase' }}>{cat}</p>}
                    <p style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginBottom: 8 }}>{product.name}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 14 }}>${price.toFixed(2)}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => moveToCart(item)} className="noir-btn-primary" style={{ flex: 1, fontSize: 12, padding: '8px 12px' }}>
                        <ShoppingBag size={13} /> Add to cart
                      </button>
                      <button
                        onClick={() => removeFromWishlist(productId)}
                        disabled={toggling[productId]}
                        style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', color: '#888', cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s', display: 'flex' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#2a2a2a' }}
                      >
                        <Heart size={14} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
