import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingBag, Heart, ArrowLeft, Check, BadgeCheck, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import api from '../api/axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { trackRecentlyViewed } from '../lib/recentlyViewed'
import { StarDisplay, StarInput } from '../components/site/StarRating'
import LensZoom from '../components/site/LensZoom'
import StickyCartBar from '../components/site/StickyCartBar'

export default function ProductDetail() {
  const { id }             = useParams()
  const { addToCart }      = useCart()
  const { user }           = useAuth()
  const navigate           = useNavigate()
  const [product, setProduct]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [activeImage, setActiveImage]     = useState(0)
  const [qty, setQty]               = useState(1)
  const [adding, setAdding]         = useState(false)
  const [added, setAdded]           = useState(false)
  const [stickyVisible, setStickyVisible] = useState(false)
  const ctaRef = useRef(null)
  const [reviews, setReviews]       = useState([])
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  useEffect(() => {
    setLoading(true)  // eslint-disable-line
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

  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting), { threshold: 0 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [product]) // re-attach after product loads

  const handleAddToCart = async () => {
    if (!user) { navigate('/login', { state: { from: `/products/${id}` } }); return }
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
              <LensZoom
                src={images[activeImage]?.imageUrl ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
                alt={product.name}
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
                <StarDisplay rating={Number(avgRating)} size={14} />
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
                  {product.variants.map(v => {
                    const vid  = v.variantId ?? v.id
                    const svid = selectedVariant?.variantId ?? selectedVariant?.id
                    return (
                      <button key={vid} onClick={() => { setSelectedVariant(v); setQty(1) }}
                        style={{
                          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                          background: svid === vid ? '#7c5cf0' : 'transparent',
                          color:      svid === vid ? '#fff' : '#888',
                          border:     `1px solid ${svid === vid ? '#7c5cf0' : '#2a2a2a'}`,
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        {v.sizeOrColor ?? v.skuCode}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Stock */}
            {selectedVariant && (
              <p style={{ fontSize: 13, color: (selectedVariant.stockQuantity ?? 0) > 0 ? '#22c55e' : '#ef4444', marginBottom: 16 }}>
                {(selectedVariant.stockQuantity ?? 0) === 0
                  ? 'Out of stock'
                  : selectedVariant.stockQuantity <= 5
                    ? `Only ${selectedVariant.stockQuantity} left`
                    : `${selectedVariant.stockQuantity} in stock`}
              </p>
            )}

            {/* Qty selector */}
            {selectedVariant && (selectedVariant.stockQuantity ?? 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>Qty</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #2a2a2a', borderRadius: 10, padding: '8px 16px', width: 'fit-content' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex' }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ fontSize: 15, color: '#fff', minWidth: 20, textAlign: 'center' }}>{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(selectedVariant.stockQuantity, q + 1))}
                    disabled={qty >= (selectedVariant.stockQuantity ?? 0)}
                    style={{ background: 'none', border: 'none', color: qty >= (selectedVariant.stockQuantity ?? 0) ? '#333' : '#888', cursor: qty >= (selectedVariant.stockQuantity ?? 0) ? 'not-allowed' : 'pointer', display: 'flex' }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Add to cart */}
            <div ref={ctaRef} style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleAddToCart}
                disabled={adding || !selectedVariant || (selectedVariant?.stockQuantity ?? 0) === 0}
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
        <div style={{ marginTop: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
              Reviews {reviews.length > 0 && <span style={{ fontSize: 15, color: '#555', fontWeight: 400 }}>({reviews.length})</span>}
            </h2>
          </div>

          {/* Submission form */}
          {user ? (
            submitted ? (
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontSize: 14, color: '#34d399' }}>
                Thanks for your review!
              </div>
            ) : (
              <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 14 }}>Leave a review</p>
                <div style={{ marginBottom: 14 }}>
                  <StarInput value={reviewRating} onChange={setReviewRating} />
                </div>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts…"
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                    background: '#0e0e0e', border: '1px solid #262626', color: '#fff',
                    resize: 'vertical', outline: 'none', lineHeight: 1.6,
                    fontFamily: 'inherit', marginBottom: 12,
                  }}
                />
                <button
                  onClick={async () => {
                    if (!reviewRating) { toast.error('Please select a star rating.'); return }
                    setSubmitting(true)
                    try {
                      const { data } = await api.post(`/products/${id}/reviews`, { rating: reviewRating, comment: reviewComment })
                      setReviews(prev => [data.data ?? data, ...prev])
                      setSubmitted(true)
                      toast.success('Review posted!')
                    } catch (err) {
                      toast.error(err.response?.data?.message ?? 'Could not post review.')
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                  disabled={submitting}
                  className="noir-btn-primary"
                  style={{ padding: '10px 22px', fontSize: 14 }}
                >
                  {submitting ? 'Posting…' : 'Post review'}
                </button>
              </div>
            )
          ) : (
            <div style={{ marginBottom: 24, fontSize: 13, color: '#555' }}>
              <Link to="/login" style={{ color: '#7c5cf0' }}>Sign in</Link> to leave a review.
            </div>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <p style={{ fontSize: 14, color: '#555' }}>No reviews yet. Be the first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {reviews.map(r => (
                <div key={r.reviewId ?? r.id} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 12, padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.user?.name ?? r.userName ?? 'Anonymous'}</span>
                      {r.verifiedBuyer && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#34d399' }}>
                          <BadgeCheck size={12} /> Verified
                        </span>
                      )}
                    </div>
                    <StarDisplay rating={r.rating} size={12} />
                  </div>
                  {r.comment && <p style={{ fontSize: 14, color: '#888', lineHeight: 1.65 }}>{r.comment}</p>}
                  {r.createdAt && (
                    <p style={{ fontSize: 11, color: '#444', marginTop: 8 }}>
                      {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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
