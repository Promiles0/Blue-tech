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
      <Heart size={48} style={{ color: '#2a2a2a' }} />
      <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Sign in to view your wishlist</p>
      <Link to="/login" className="noir-btn-primary" style={{ padding: '12px 24px' }}>Sign in</Link>
    </div>
  )

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">

        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>Wishlist</h1>
          <p style={{ fontSize: 13, color: '#555' }}>
            <Link to="/" style={{ color: '#555', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: '#888' }}>Wishlist</span>
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Heart size={48} style={{ color: '#2a2a2a', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, color: '#888', marginBottom: 20 }}>Your wishlist is empty.</p>
            <Link to="/products" className="noir-btn-primary" style={{ display: 'inline-flex', padding: '12px 24px' }}>Explore products</Link>
          </div>
        ) : (
          <>
            {/* Unified table */}
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden', marginBottom: 0 }}>

              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 40px',
                padding: '11px 20px',
                background: 'rgba(124,92,240,0.08)',
                borderBottom: '1px solid #1a1a1a',
              }}>
                {['Product', 'Price', 'Stock Status', 'Action', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c5cf0', textAlign: i >= 2 ? 'center' : 'left' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {items.map((item, idx) => {
                const pid   = Number(item.productId)
                const img   = item.primaryImageUrl ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80'
                const price = parseFloat(item.price ?? 0)
                const inStock = item.variants?.some(v => v.stockQuantity > 0) ?? true

                return (
                  <div key={pid} style={{
                    display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 40px',
                    alignItems: 'center', padding: '16px 20px',
                    borderBottom: idx < items.length - 1 ? '1px solid #1a1a1a' : 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Product */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                        <img src={img} alt={item.productName}
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80' }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{item.productName}</p>
                        {item.categoryName && <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.categoryName}</p>}
                      </div>
                    </div>

                    {/* Price */}
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>${price.toFixed(2)}</span>

                    {/* Stock */}
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: inStock ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: inStock ? '#22c55e' : '#ef4444',
                        border: `1px solid ${inStock ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      }}>
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    {/* Add to cart */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={addingToCart[pid] || !inStock}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 12, fontWeight: 600, padding: '7px 14px',
                          background: inStock ? '#7c5cf0' : '#1a1a1a',
                          color: inStock ? '#fff' : '#444',
                          border: 'none', borderRadius: 8, cursor: inStock ? 'pointer' : 'not-allowed',
                          transition: 'background 0.2s', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { if (inStock) e.currentTarget.style.background = '#6b4fd8' }}
                        onMouseLeave={e => { if (inStock) e.currentTarget.style.background = '#7c5cf0' }}
                      >
                        <ShoppingBag size={13} />
                        {addingToCart[pid] ? 'Adding…' : 'Add to Cart'}
                      </button>
                      <Link to={`/products/${pid}`}
                        style={{ display: 'flex', alignItems: 'center', padding: '7px 8px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#666', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = '#666'}
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>

                    {/* Remove */}
                    <button onClick={() => removeItem(pid)} disabled={toggling[pid]}
                      style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6, transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#444'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Trust strip — minimal */}
            <div style={{ display: 'flex', gap: 24, marginTop: 24, paddingTop: 20, borderTop: '1px solid #1a1a1a' }}>
              {[
                { icon: <Truck size={14} />, label: 'Free shipping on all orders' },
                { icon: <Shield size={14} />, label: 'Secure & encrypted payment' },
                { icon: <Headphones size={14} />, label: '24/7 customer support' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ color: '#7c5cf0' }}>{icon}</span>
                  <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
