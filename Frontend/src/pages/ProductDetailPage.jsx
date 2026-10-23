import { useState, useEffect, useRef } from 'react'
import { track } from '../lib/analytics'
import { useT } from '../lib/i18n'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingBag, Heart, Check, BadgeCheck, Plus, Minus, MessageCircle } from 'lucide-react'
import api from '../api/axios'
import apiService from '../api/service'
import { useCart } from '../context/CartContext'
import { cartSnapshot } from '../lib/cartSnapshot'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { trackRecentlyViewed } from '../lib/recentlyViewed'
import { StarDisplay } from '../components/site/StarRating'
import LensZoom from '../components/site/LensZoom'
import StickyCartBar from '../components/site/StickyCartBar'
import { handleProductImageError, productImageList } from '../lib/productImage'
import { buildWhatsAppLink } from '../lib/helpLinks'
import { useCurrency } from '../context/CurrencyContext'
import ProductSpecs from '../components/site/ProductSpecs'
import { specRows } from '../lib/specTemplates'
import { CountUp } from '../lib/motion'
import RelatedProducts from '../components/site/RelatedProducts'
import PairsWellWith from '../components/site/PairsWellWith'
import ProductQuestions from '../components/site/ProductQuestions'
import BundleOffers from '../components/site/BundleOffers'
import { SaleCountdown } from '../components/site/SaleBits'
import { useQuery } from '@tanstack/react-query'
import DeliveryEstimate from '../components/site/DeliveryEstimate'
import BackInStockForm from '../components/site/BackInStockForm'
import InstalmentsButton from '../components/site/InstalmentsButton'
import { Breadcrumb, ProductActions, BuyInfo } from '../components/site/ProductExtras'
import { usePageMeta, productJsonLd, breadcrumbJsonLd } from '../hooks/usePageMeta'

export default function ProductDetail() {
  const { t, intlLocale } = useT()
  const { id } = useParams()
  // Honest signals (3e): only real numbers, shown only when they mean something.
  const { data: signals } = useQuery({
    queryKey: ['product-signals', id],
    queryFn: () => apiService.products.signals(id).then((r) => r.data),
    staleTime: 5 * 60_000,
  })
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { wishlistIds, toggle: toggleWishlist } = useWishlist()
  const { formatPrice } = useCurrency()
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
        track('view_item', { value: data?.price, items: [{ id: data?.productId ?? data?.id, name: data?.name, price: data?.price }] })
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
    const variantId = selectedVariant?.variantId ?? selectedVariant?.id
    if (!variantId) return
    setAdding(true)
    try {
      await addToCart(variantId, qty, cartSnapshot(product, selectedVariant))
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } finally {
      setAdding(false)
    }
  }

  // Per-product title/description/image for search results and WhatsApp link previews.
  usePageMeta({
    title: product ? `${product.name} — ${formatPrice(product.price)} | Blue-Tech` : undefined,
    description: product ? (product.shortDescription || product.description || '').slice(0, 160) : undefined,
    ogImage: product ? (productImageList(product)[0] ?? undefined) : undefined,
    path: `/products/${id}`,
    ogType: 'product',
    jsonLd: product ? [
      productJsonLd(product, { reviews }),
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        ...(product.categoryName ? [{ name: product.categoryName, path: `/category/${product.categoryName.toLowerCase().replace(/\s+/g, '-')}` }] : []),
        { name: product.name, path: `/products/${id}` },
      ]),
    ] : undefined,
  })

  if (loading) return (
    <div style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="pdp-grid">
        <div className="skeleton" style={{ height: 480, borderRadius: 16, viewTransitionName: 'product-photo' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[80, 32, 48, 120, 56, 56].map((h, i) => (
            <div key={i} className="skeleton" style={{ height: h, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (!product) return null

  const images = productImageList(product).map(imageUrl => ({ imageUrl }))
  const price = (parseFloat(product.price) || 0) + (parseFloat(selectedVariant?.priceAdjustment) || 0)
  const stockQty = selectedVariant?.stockQuantity ?? 0
  const avgRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviews.length).toFixed(1)
    : null
  const requiresVariant = (product.variants?.length > 0) && !selectedVariant
  const variantLabel = selectedVariant?.sizeOrColor ?? selectedVariant?.skuCode ?? ''
  const whatsappHref = buildWhatsAppLink({
    productName: product.name ?? '',
    variantLabel,
    price: formatPrice(price),
    qty,
    productUrl: `${window.location.origin}/products/${id}`,
  })

  const hasSpecs = specRows(product).length > 0
  const showOverview = product.description && product.description !== product.shortDescription
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({ star, n: reviews.filter(r => Math.round(r.rating ?? 0) === star).length }))
  const sections = [
    showOverview && { id: 'overview', label: t('Overview') },
    hasSpecs && { id: 'specs', label: t('Specifications') },
    { id: 'reviews', label: reviews.length ? `${t('Reviews')} (${reviews.length})` : t('Reviews') },
    { id: 'questions', label: t('Questions') },
  ].filter(Boolean)

  return (
    <div style={{ paddingTop: 28, paddingBottom: 80 }}>
      <div className="container-noir">
        <Breadcrumb product={product} />

        <div className="pdp-grid">
          <ProductGallery images={images} name={product.name} active={activeImage} onChange={setActiveImage} t={t} />

          <div className="fade-in">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: 8 }}>
              {product.category?.name ?? product.categoryName ?? ''}
            </p>
            <h1 style={{ fontSize: 'clamp(24px, 3.2vw, 32px)', fontWeight: 900, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px 12px', flexWrap: 'wrap', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
              {[product.brand, product.modelNumber].filter(Boolean).join(' · ')}
              {product.condition && (
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 100, border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  {product.condition}
                </span>
              )}
              {avgRating && (
                <a href="#reviews" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                  <StarDisplay rating={Number(avgRating)} size={14} />
                  {avgRating} ({reviews.length === 1 ? t('1 review') : t('{n} reviews', { n: reviews.length })})
                </a>
              )}
            </div>

            <p style={{ fontSize: 'clamp(28px, 3.6vw, 34px)', fontWeight: 900, color: 'var(--price)', marginBottom: product.campaign ? 6 : 18, letterSpacing: '-0.01em' }}>
              {formatPrice(price)}
              {product.campaign && Number(product.regularPrice) > Number(product.price) && (
                <span style={{ marginLeft: 12, fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                  {formatPrice(Number(product.regularPrice) + (parseFloat(selectedVariant?.priceAdjustment) || 0))}
                </span>
              )}
            </p>
            {product.campaign && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                <Link to={`/sale/${product.campaign.slug}`} style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--danger, #ef4444)', color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                  {product.campaign.label} · {product.campaign.name}
                </Link>
                <SaleCountdown endsAt={product.campaign.endsAt} />
              </div>
            )}

            {/* The specs people compare on, right under the price (UX audit B5) */}
            {hasSpecs && (
              <div style={{ marginBottom: 18 }}>
                <ProductSpecs product={product} limit={6} compact />
                <a href="#specs" className="section-link" style={{ fontSize: 13, minHeight: 32 }}>{t('All specifications')} ↓</a>
              </div>
            )}

            {product.shortDescription && (
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 22 }}>{product.shortDescription}</p>
            )}

            {product.variants?.length > 1 && (
              <div style={{ marginBottom: 20 }} role="radiogroup" aria-label={t('Options')}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>{t('Options')}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.variants.map(variant => {
                    const variantId = variant.variantId ?? variant.id
                    const on = (selectedVariant?.variantId ?? selectedVariant?.id) === variantId
                    return (
                      <button key={variantId} type="button" role="radio" aria-checked={on}
                        onClick={() => { setSelectedVariant(variant); setQty(1) }}
                        style={{
                          padding: '9px 16px', minHeight: 40, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          background: on ? 'var(--accent)' : 'transparent', color: on ? '#fff' : 'var(--text-secondary)',
                          border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                        }}>
                        {variant.sizeOrColor ?? variant.skuCode}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedVariant && (
              <p style={{ fontSize: 13.5, fontWeight: 600, color: stockQty > 0 ? 'var(--success)' : 'var(--error)', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center' }}>
                <span>{stockQty === 0 ? t('Out of stock') : stockQty <= 5 ? t('Only {n} left', { n: stockQty }) : t('In stock')}</span>
                {stockQty > 0 && signals?.backInStock && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: 'var(--success-soft)', color: 'var(--success)' }}>{t('Back in stock')}</span>
                )}
                {signals?.sold30d >= 3 && (
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t('{n} sold in the last 30 days', { n: signals.sold30d })}</span>
                )}
              </p>
            )}

            <div ref={ctaRef} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {selectedVariant && stockQty > 0 && (
                <div className="qty-stepper" role="group" aria-label={t('Quantity')}>
                  <button type="button" onClick={() => setQty(value => Math.max(1, value - 1))} disabled={qty <= 1} aria-label={t('Decrease quantity')}><Minus size={16} /></button>
                  <span aria-live="polite">{qty}</span>
                  <button type="button" onClick={() => setQty(value => Math.min(stockQty, value + 1))} disabled={qty >= stockQty} aria-label={t('Increase quantity')}><Plus size={16} /></button>
                </div>
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding || !selectedVariant || stockQty === 0}
                className="noir-btn-cta"
                style={{ flex: '1 1 120px', padding: 14, minHeight: 50, fontSize: 15 }}
              >
                {added ? <><Check size={16} /> {t('Added!')}</> : adding ? t('Adding…') : <><ShoppingBag size={16} /> {t('Add to cart')}</>}
              </button>
              <button
                type="button"
                onClick={() => user ? toggleWishlist(pid, product.name) : navigate('/login', { state: { from: `/products/${id}` } })}
                className="noir-btn-outline"
                aria-pressed={wishlisted}
                aria-label={wishlisted ? t('Remove from wishlist') : t('Add to wishlist')}
                style={{ padding: '0 16px', minHeight: 50, color: wishlisted ? '#f87171' : undefined, borderColor: wishlisted ? 'rgba(239,68,68,0.4)' : undefined, background: wishlisted ? 'rgba(239,68,68,0.08)' : undefined }}
              >
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {selectedVariant && stockQty === 0 && <BackInStockForm productId={product.productId ?? product.id} />}
            <BuyInfo product={product} />
            <DeliveryEstimate />
            {stockQty > 0 && <InstalmentsButton product={product} />}

            {/* WhatsApp stays one tap away, but no longer competes with Add to cart (B5) */}
            <a
              href={requiresVariant ? undefined : whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={requiresVariant}
              onClick={e => { if (requiresVariant) e.preventDefault() }}
              className="pdp-whatsapp"
            >
              <MessageCircle size={16} /> {t('Questions? Chat with us on WhatsApp')}
            </a>

            <ProductActions product={product} />
            <PairsWellWith productIds={[product.productId ?? product.id]} />

            {product.inTheBox && (
              <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text)' }}>{t('In the box:')}</strong> {product.inTheBox}
              </p>
            )}
          </div>
        </div>

        {/* Jump links to the long sections below */}
        <nav className="pdp-tabs" aria-label={t('On this page')}>
          {sections.map(s => <a key={s.id} href={`#${s.id}`}>{s.label}</a>)}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48, maxWidth: 860 }}>
          {showOverview && (
            <section id="overview" className="pdp-section">
              <h2>{t('Overview')}</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{product.description}</p>
            </section>
          )}
          {hasSpecs && (
            <section id="specs" className="pdp-section">
              <h2>{t('Specifications')}</h2>
              <ProductSpecs product={product} />
            </section>
          )}

          <section id="reviews" className="pdp-section">
            <h2>{t('Reviews')} {reviews.length > 0 && <span style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 400 }}>({reviews.length})</span>}</h2>

            {reviews.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {t('No reviews yet. Bought this?')}{' '}
                <Link to="/orders" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{t('Review it from your orders')}</Link>
                {' '}{t("once it's delivered.")}
              </p>
            ) : (
              <>
                <div className="review-summary">
                  <div style={{ textAlign: 'center', minWidth: 110 }}>
                    <p style={{ fontSize: 40, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}><CountUp to={Number(avgRating)} decimals={1} duration={0.9} /></p>
                    <StarDisplay rating={Number(avgRating)} size={14} />
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>{reviews.length === 1 ? t('1 review') : t('{n} reviews', { n: reviews.length })}</p>
                  </div>
                  <div style={{ flex: 1, display: 'grid', gap: 5 }}>
                    {ratingCounts.map(({ star, n }) => (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        <span style={{ width: 22 }}>{star}★</span>
                        <span style={{ flex: 1, height: 7, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                          <span style={{ display: 'block', height: '100%', width: `${(n / reviews.length) * 100}%`, background: 'var(--price)' }} />
                        </span>
                        <span style={{ width: 22, textAlign: 'right' }}>{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {reviews.map(review => (
                    <div key={review.reviewId ?? review.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{review.user?.name ?? review.userName ?? t('Anonymous')}</span>
                          {review.verifiedBuyer && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: 'var(--success)' }}>
                              <BadgeCheck size={12} /> {t('Verified')}
                            </span>
                          )}
                        </div>
                        <StarDisplay rating={review.rating} size={12} />
                      </div>
                      {review.comment && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{review.comment}</p>}
                      {review.photos?.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                          {review.photos.map(url => (
                            <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={t('Open photo')}
                              style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', display: 'block' }}>
                              <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </a>
                          ))}
                        </div>
                      )}
                      {review.createdAt && (
                        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 8 }}>
                          {new Date(review.createdAt).toLocaleDateString(intlLocale, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <div className="container-noir">
        <BundleOffers productId={product.productId ?? product.id} />
        <div id="questions" className="pdp-section"><ProductQuestions productId={product.productId ?? product.id} /></div>
        <RelatedProducts product={product} />
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

// Photos: big image with a magnifier and a scrolling thumbnail row on desktop; on phones a
// swipeable strip with dots (UX audit B6).
function ProductGallery({ images, name, active, onChange, t }) {
  const stripRef = useRef(null)
  const onScroll = () => {
    const el = stripRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== active) onChange(i)
  }
  const goTo = (i) => {
    onChange(i)
    stripRef.current?.scrollTo({ left: i * stripRef.current.clientWidth, behavior: 'smooth' })
  }
  if (!images.length) return <div className="pdp-photo" />

  return (
    <div className="pdp-gallery">
      <div className="pdp-photo pdp-photo-desktop" style={{ viewTransitionName: 'product-photo' }}>
        {images[active]?.imageUrl && <LensZoom src={images[active].imageUrl} alt={name} />}
      </div>

      <div className="pdp-strip" ref={stripRef} onScroll={onScroll} aria-label={t('Product photos')}>
        {images.map((img, i) => (
          <div key={img.imageUrl} className="pdp-photo">
            <img src={img.imageUrl} alt={i === 0 ? name : ''} loading={i === 0 ? 'eager' : 'lazy'} onError={handleProductImageError} />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <div className="pdp-thumbs" role="group" aria-label={t('Choose a photo')}>
            {images.map((img, index) => (
              <button key={img.imageUrl} type="button" onClick={() => goTo(index)} aria-label={t('Photo {n}', { n: index + 1 })} aria-pressed={index === active}
                className={`pdp-thumb${index === active ? ' on' : ''}`}>
                <img src={img.imageUrl} alt="" onError={handleProductImageError} />
              </button>
            ))}
          </div>
          <div className="pdp-dots" aria-hidden>
            {images.map((img, index) => <span key={img.imageUrl} className={index === active ? 'on' : undefined} />)}
          </div>
        </>
      )}
    </div>
  )
}

