import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingBag, Heart, ArrowLeft, Check, BadgeCheck, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import api from '../api/axios'
import apiService from '../api/service'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { trackRecentlyViewed } from '../lib/recentlyViewed'
import { StarDisplay } from '../components/site/StarRating'
import LensZoom from '../components/site/LensZoom'
import StickyCartBar from '../components/site/StickyCartBar'

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { wishlistIds, toggle: toggleWishlist } = useWishlist()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [reviews, setReviews] = useState([])

  const ctaRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    apiService.products.getOne(id)
      .then(({ data }) => {
        if (cancelled) return
        setProduct(data)
        setSelectedVariant(data.variants?.[0] ?? null)
        trackRecentlyViewed(data)
      })
      .catch(() => { if (!cancelled) navigate('/products') })

    // Reviews are a separate endpoint
    api.get(`/products/${id}/reviews`)
      .then(({ data }) => { if (!cancelled) setReviews(Array.isArray(data) ? data : []) })
      .catch(() => {})

    return () => { cancelled = true }
  }, [id, navigate])

  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting), { threshold: 0 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [product])

  const resolvedProductId = String(product?.productId ?? product?.id ?? '')
  const loading = !product || resolvedProductId !== String(id)
  const pid = parseInt(id, 10)
  const wishlisted = wishlistIds.has(pid)

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/products/${id}` } })
      return
    }
    const variantId = selectedVariant?.variantId ?? selectedVariant?.id
    if (!variantId) return
    setAdding(true)
    try {
      await addToCart(variantId, qty)
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
  const stockQty = selectedVariant?.stockQuantity ?? 0
  const avgRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviews.length).toFixed(1)
    : null

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">
        <Link
          to="/products"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 36, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >
          <ArrowLeft size={14} /> Back to products
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div>
            <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 12, aspectRatio: '4/3' }}>
              <LensZoom
                src={images[activeImage]?.imageUrl ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
                alt={product.name}
              />
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 10 }}>
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: `2px solid ${index === activeImage ? 'var(--accent)' : 'var(--border)'}`, background: 'var(--card)', padding: 0, cursor: 'pointer', transition: 'border-color 0.2s' }}
                  >
                    <img src={img.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="fade-in">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent)', marginBottom: 8 }}>
              {product.category?.name ?? product.categoryName ?? ''}
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {product.name}
            </h1>

            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <StarDisplay rating={Number(avgRating)} size={14} />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            <p style={{ fontSize: 34, fontWeight: 900, color: 'var(--price)', marginBottom: 24, letterSpacing: '-0.01em' }}>
              ${price.toFixed(2)}
            </p>

            {product.description && (
              <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 28 }}>
                {product.description}
              </p>
            )}

            {product.variants?.length > 1 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Options</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.variants.map(variant => {
                    const variantId = variant.variantId ?? variant.id
                    const selectedVariantId = selectedVariant?.variantId ?? selectedVariant?.id
                    return (
                      <button
                        key={variantId}
                        onClick={() => { setSelectedVariant(variant); setQty(1) }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          background: selectedVariantId === variantId ? 'var(--accent)' : 'transparent',
                          color: selectedVariantId === variantId ? '#fff' : 'var(--muted)',
                          border: `1px solid ${selectedVariantId === variantId ? 'var(--accent)' : 'var(--border)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {variant.sizeOrColor ?? variant.skuCode}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedVariant && (
              <p style={{ fontSize: 13, color: stockQty > 0 ? 'var(--success)' : 'var(--error)', marginBottom: 16 }}>
                {stockQty === 0 ? 'Out of stock' : stockQty <= 5 ? `Only ${stockQty} left` : `${stockQty} in stock`}
              </p>
            )}

            {selectedVariant && stockQty > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>Qty</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--border)', borderRadius: 10, padding: '8px 16px', width: 'fit-content' }}>
                  <button onClick={() => setQty(value => Math.max(1, value - 1))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ fontSize: 15, color: 'var(--text)', minWidth: 20, textAlign: 'center' }}>{qty}</span>
                  <button
                    onClick={() => setQty(value => Math.min(stockQty, value + 1))}
                    disabled={qty >= stockQty}
                    style={{ background: 'none', border: 'none', color: qty >= stockQty ? 'var(--muted-dark)' : 'var(--muted)', cursor: qty >= stockQty ? 'not-allowed' : 'pointer', display: 'flex' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            <div ref={ctaRef} style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleAddToCart}
                disabled={adding || !selectedVariant || stockQty === 0}
                className="noir-btn-primary"
                style={{ flex: 1, padding: '14px', fontSize: 15 }}
              >
                {added ? <><Check size={16} /> Added!</> : adding ? 'Adding…' : <><ShoppingBag size={16} /> Add to cart</>}
              </button>
              <button
                onClick={() => user ? toggleWishlist(pid, product.name) : navigate('/login', { state: { from: `/products/${id}` } })}
                className="noir-btn-outline"
                style={{ padding: '14px 16px', color: wishlisted ? '#f87171' : undefined, borderColor: wishlisted ? 'rgba(239,68,68,0.4)' : undefined, background: wishlisted ? 'rgba(239,68,68,0.08)' : undefined }}
              >
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              Reviews {reviews.length > 0 && <span style={{ fontSize: 15, color: 'var(--muted-dark)', fontWeight: 400 }}>({reviews.length})</span>}
            </h2>
          </div>



          {reviews.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--muted-dark)' }}>No reviews yet. Be the first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {reviews.map(review => (
                <div key={review.reviewId ?? review.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{review.user?.name ?? review.userName ?? 'Anonymous'}</span>
                      {review.verifiedBuyer && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#34d399' }}>
                          <BadgeCheck size={12} /> Verified
                        </span>
                      )}
                    </div>
                    <StarDisplay rating={review.rating} size={12} />
                  </div>
                  {review.comment && <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>{review.comment}</p>}
                  {review.createdAt && (
                    <p style={{ fontSize: 11, color: 'var(--muted-dark)', marginTop: 8 }}>
                      {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <StickyCartBar
        product={product}
        selectedVariant={selectedVariant}
        onAdd={handleAddToCart}
        adding={adding}
        added={added}
        visible={stickyVisible}
      />
    </div>
  )
}
