import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingBag, Heart, Star, ArrowLeft, Check } from 'lucide-react'
import api from '../api/axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { trackRecentlyViewed } from '../lib/recentlyViewed'

export default function ProductDetail() {
  const { id }             = useParams()
  const { addToCart }      = useCart()
  const { user }           = useAuth()
  const navigate           = useNavigate()
  const [product, setProduct]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [activeImage, setActiveImage]     = useState(0)
  const [adding, setAdding]         = useState(false)
  const [added, setAdded]           = useState(false)
  const [reviews, setReviews]       = useState([])

  useEffect(() => {
    setLoading(true)
    api.get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data)
        setSelectedVariant(data.variants?.[0] ?? null)
        setReviews(data.reviews ?? [])
        trackRecentlyViewed(data)
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleAddToCart = async () => {
    if (!user) { navigate('/login', { state: { from: `/products/${id}` } }); return }
    if (!selectedVariant?.id) return
    setAdding(true)
    try {
      await addToCart(selectedVariant.id, 1)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } finally {
      setAdding(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
        <div className="skeleton" style={{ height: 480, borderRadius: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[80, 32, 48, 120, 56, 56].map((h, i) => (
            <div key={i} className="skeleton" style={{ height: h, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (!product) return null

  const images = product.images?.length
    ? product.images
    : [{ imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80' }]
  const price = (parseFloat(product.price) || 0) + (parseFloat(selectedVariant?.priceAdjustment) || 0)
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">

        {/* Breadcrumb */}
        <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888', marginBottom: 36, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#888'}
        >
          <ArrowLeft size={14} /> Back to products
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>

          {/* Images */}
          <div>
            <div style={{ borderRadius: 16, overflow: 'hidden', background: '#141414', marginBottom: 12, aspectRatio: '4/3' }}>
              <img
                src={images[activeImage]?.imageUrl}
                alt={product.name}
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 10 }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === activeImage ? '#7c5cf0' : '#2a2a2a'}`, background: '#1a1a1a', padding: 0, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                    <img src={img.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="fade-in">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#7c5cf0', marginBottom: 8 }}>
              {product.category?.name ?? ''}
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {product.name}
            </h1>

            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(Number(avgRating)) ? '#f59e0b' : 'none'} color="#f59e0b" />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: '#888' }}>{avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}

            <p style={{ fontSize: 34, fontWeight: 900, color: '#f59e0b', marginBottom: 24, letterSpacing: '-0.01em' }}>
              ${price.toFixed(2)}
            </p>

            {product.description && (
              <p style={{ fontSize: 15, color: '#888', lineHeight: 1.75, marginBottom: 28 }}>
                {product.description}
              </p>
            )}

            {/* Variants */}
            {product.variants?.length > 1 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 10 }}>Options</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.variants.map(v => (
                    <button key={v.id} onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        background: selectedVariant?.id === v.id ? '#7c5cf0' : 'transparent',
                        color:      selectedVariant?.id === v.id ? '#fff' : '#888',
                        border:     `1px solid ${selectedVariant?.id === v.id ? '#7c5cf0' : '#2a2a2a'}`,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {v.sizeOrColor ?? v.skuCode}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            {selectedVariant && (
              <p style={{ fontSize: 13, color: selectedVariant.stockQuantity > 0 ? '#22c55e' : '#ef4444', marginBottom: 24 }}>
                {selectedVariant.stockQuantity > 0
                  ? `${selectedVariant.stockQuantity} in stock`
                  : 'Out of stock'}
              </p>
            )}

            {/* Add to cart */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleAddToCart}
                disabled={adding || !selectedVariant || selectedVariant?.stockQuantity === 0}
                className="noir-btn-primary"
                style={{ flex: 1, padding: '14px', fontSize: 15 }}
              >
                {added ? <><Check size={16} /> Added!</> : adding ? 'Adding…' : <><ShoppingBag size={16} /> Add to cart</>}
              </button>
              <button className="noir-btn-outline" style={{ padding: '14px 16px' }}>
                <Heart size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div style={{ marginTop: 72 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Reviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 12, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.user?.name ?? 'Anonymous'}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < r.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
