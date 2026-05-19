import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Trash2, Truck, Shield, Headphones, ExternalLink } from 'lucide-react'
import apiService from '../api/service'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { toast } from 'sonner'

export default function Wishlist() {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState({})
  const [addingToCart, setAddingToCart] = useState({})

  const fetchWishlist = useCallback(() => {
    if (!user) { setLoading(false); return }
    apiService.wishlist.get()
      .then(({ data }) => setItems(data?.items ?? (Array.isArray(data) ? data : [])))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { fetchWishlist() }, [fetchWishlist])

  const removeItem = async (productId) => {
    setToggling(prev => ({ ...prev, [productId]: true }))
    try {
      await apiService.wishlist.toggle(productId)
      setItems(prev => prev.filter(i => Number(i.productId) !== productId))
      toast('Removed from wishlist')
    } finally {
      setToggling(prev => ({ ...prev, [productId]: false }))
    }
  }

  const handleAddToCart = async (item) => {
    const pid = Number(item.productId)
    if (!item.variants?.length) {
      toast.error('No variant available')
      return
    }
    setAddingToCart(prev => ({ ...prev, [pid]: true }))
    try {
      await addToCart(item.variants[0].variantId, 1)
    } finally {
      setAddingToCart(prev => ({ ...prev, [pid]: false }))
    }
  }

  if (!user) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
      <Heart size={48} style={{ color: 'var(--border)' }} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Sign in to view your wishlist</p>
      <Link to="/login" className="noir-btn-primary" style={{ padding: '12px 24px' }}>Sign in</Link>
    </div>
  )

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">
        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Wishlist</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 40 }}>{items.length} saved item{items.length !== 1 ? 's' : ''}</p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Heart size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 20 }}>Your wishlist is empty.</p>
            <Link to="/products" className="noir-btn-primary" style={{ display: 'inline-flex', padding: '12px 24px' }}>Explore products</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => {
              const pid     = Number(item.productId)
              const img     = item.primaryImageUrl ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'
              const price   = parseFloat(item.price ?? 0)

              return (
                <div key={pid} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 14,
                  padding: 20,
                  display: 'flex',
                  gap: 18,
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  {/* Product Image */}
                  <div style={{ width: 88, height: 88, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-surface-2)', flexShrink: 0 }}>
                    <img src={img} alt={item.productName}
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Product Details */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {item.categoryName && (
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                        {item.categoryName}
                      </p>
                    )}
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {item.productName}
                    </h3>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--price-color)' }}>
                      ${price.toFixed(2)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Link to={`/products/${pid}`} className="noir-btn-outline" style={{ fontSize: 13, padding: '10px 16px', borderRadius: 8, textDecoration: 'none' }}>
                      View Product
                    </Link>
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={addingToCart[pid]}
                      className="noir-btn-cta"
                      style={{ fontSize: 13, padding: '10px 18px', borderRadius: 8, minWidth: 120 }}
                    >
                      <ShoppingBag size={14} />
                      {addingToCart[pid] ? 'Adding…' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => removeItem(pid)}
                      disabled={toggling[pid]}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        padding: 10, cursor: 'pointer', borderRadius: 8, display: 'flex',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'var(--danger-soft)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
                    >
                      <Trash2 size={16} />
                    </button>
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
