import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Heart, Truck, Plus, Minus, ArrowRight } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'
import { useWishlist } from '../../context/WishlistContext'
import api from '../../api/axios'

export default function ProductQuickView() {
  const { quickViewProduct, setQuickViewProduct } = useUI()
  const { addToCart }  = useCart()
  const { user }       = useAuth()
  const { wishlistIds, toggle } = useWishlist()

  const [product,         setProduct]         = useState(null)
  const [loading,         setLoading]         = useState(false)
  const [activeImage,     setActiveImage]     = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty,             setQty]             = useState(1)
  const [adding,          setAdding]          = useState(false)

  const isOpen = !!quickViewProduct
  const pid    = quickViewProduct?.productId ?? quickViewProduct?.id

  useEffect(() => {
    if (!quickViewProduct) { setProduct(null); setActiveImage(0); setQty(1); return }
    setLoading(true)
    api.get(`/products/${pid}`)
      .then(({ data }) => {
        setProduct(data)
        setSelectedVariant(data.variants?.[0] ?? null)
      })
      .catch(() => {
        setProduct(quickViewProduct)
        setSelectedVariant(quickViewProduct.variants?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [quickViewProduct])

  const handleAddToCart = async () => {
    if (!user) { window.location.href = '/login'; return }
    const variantId = selectedVariant?.variantId ?? selectedVariant?.id
    if (!variantId) return
    setAdding(true)
    try { await addToCart(variantId, qty) } finally { setAdding(false) }
  }

  const close = () => setQuickViewProduct(null)

  const images = product?.images?.length
    ? product.images
    : [{ imageUrl: product?.primaryImageUrl ?? quickViewProduct?.primaryImageUrl ?? quickViewProduct?.imageUrl ?? '' }]

  const basePrice  = parseFloat(product?.price ?? quickViewProduct?.startingPrice ?? quickViewProduct?.price ?? 0)
  const adj        = parseFloat(selectedVariant?.priceAdjustment ?? 0)
  const price      = basePrice + adj
  const wishlisted = wishlistIds.has(pid)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="qv-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.78)',
              backdropFilter: 'blur(8px)',
              zIndex: 400,
            }}
          />

          <motion.div
            key="qv-modal-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16, zIndex: 401, pointerEvents: 'none',
            }}
          >
            <motion.div
              key="qv-modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                position: 'relative',
                width: 'min(920px, 100%)',
                maxHeight: 'calc(100vh - 32px)',
                overflowY: 'auto',
                background: '#0f0f0f',
                border: '1px solid #2a2a2a',
                borderRadius: 20,
                boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                pointerEvents: 'auto',
              }}
            >
              <button
                onClick={close}
                aria-label="Close"
                style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(28,28,28,0.85)', backdropFilter: 'blur(8px)',
                  border: '1px solid #2a2a2a', borderRadius: '50%', width: 34, height: 34,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#aaa', cursor: 'pointer', zIndex: 2, transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#222' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.background = 'rgba(28,28,28,0.85)' }}
              >
                <X size={16} />
              </button>

              {loading ? (
                <div className="qv-grid">
                  <div className="skeleton" style={{ minHeight: 480, borderRadius: '20px 0 0 20px' }} />
                  <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[60, 24, 80, 120, 48].map((h, i) => (
                      <div key={i} className="skeleton" style={{ height: h, borderRadius: 8 }} />
                    ))}
                  </div>
                </div>
              ) : product ? (
                <div className="qv-grid">
                  {/* Left — images */}
                  <div>
                    <div style={{ aspectRatio: '4/5', background: '#141414', borderRadius: '20px 0 0 20px', overflow: 'hidden' }}>
                      <img
                        src={images[activeImage]?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'}
                        alt={product.name}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80' }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    {images.length > 1 && (
                      <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
                        {images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImage(i)}
                            style={{
                              width: 52, height: 52, borderRadius: 8, overflow: 'hidden',
                              border: `2px solid ${i === activeImage ? '#7c5cf0' : '#2a2a2a'}`,
                              padding: 0, cursor: 'pointer', transition: 'border-color 0.2s',
                            }}
                          >
                            <img src={img.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right — info */}
                  <div style={{ padding: '40px 32px 32px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#7c5cf0', marginBottom: 8 }}>
                      {product.categoryName ?? product.category?.name ?? ''}
                    </p>
                    <h2 style={{
                      fontFamily: '"Space Grotesk",sans-serif',
                      fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em',
                      marginBottom: 10, lineHeight: 1.2,
                    }}>
                      {product.name}
                    </h2>
                    <p style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', marginBottom: 18 }}>
                      ${price.toFixed(2)}
                    </p>

                    {product.description && (
                      <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, marginBottom: 22 }}>
                        {product.description.length > 200 ? product.description.slice(0, 200) + '…' : product.description}
                      </p>
                    )}

                    {/* Variants */}
                    {product.variants?.length > 0 && (
                      <div style={{ marginBottom: 18 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#aaa', marginBottom: 8 }}>Options</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {product.variants.map(v => {
                            const vid = v.variantId ?? v.id
                            const svid = selectedVariant?.variantId ?? selectedVariant?.id
                            return (
                              <button
                                key={vid}
                                onClick={() => setSelectedVariant(v)}
                                style={{
                                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                                  background: svid === vid ? '#7c5cf0' : 'transparent',
                                  color:      svid === vid ? '#fff' : '#888',
                                  border:     `1px solid ${svid === vid ? '#7c5cf0' : '#2a2a2a'}`,
                                  cursor: 'pointer', transition: 'all 0.18s',
                                }}
                              >
                                {v.sizeOrColor ?? v.skuCode}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Qty */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#aaa' }}>Qty</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #2a2a2a', borderRadius: 10, padding: '8px 16px' }}>
                        <button onClick={() => setQty(q => Math.max(1, q - 1))}
                          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex' }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: 15, color: '#fff', minWidth: 20, textAlign: 'center' }}>{qty}</span>
                        <button onClick={() => setQty(q => q + 1)}
                          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {selectedVariant && (
                      <p style={{ fontSize: 12, color: (selectedVariant.stockQuantity ?? 0) > 0 ? '#22c55e' : '#ef4444', marginBottom: 18 }}>
                        {(selectedVariant.stockQuantity ?? 0) > 0 ? `${selectedVariant.stockQuantity} in stock` : 'Out of stock'}
                      </p>
                    )}

                    {/* CTAs */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <button
                        onClick={handleAddToCart}
                        disabled={adding || !selectedVariant}
                        className="noir-btn-primary shine"
                        style={{ flex: 1, padding: '13px', fontSize: 14 }}
                      >
                        <ShoppingBag size={15} />
                        {adding ? 'Adding…' : 'Add to cart'}
                      </button>
                      <button
                        onClick={() => { if (user) toggle(pid) }}
                        className="noir-btn-outline"
                        style={{ padding: '13px 14px', color: wishlisted ? '#f87171' : undefined, borderColor: wishlisted ? 'rgba(239,68,68,0.4)' : undefined }}
                        title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart size={17} fill={wishlisted ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#444', fontSize: 12 }}>
                        <Truck size={13} />
                        Free shipping on orders over $200
                      </div>
                      <Link
                        to={`/products/${pid}`}
                        onClick={close}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7c5cf0', textDecoration: 'none' }}
                      >
                        View full details <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
