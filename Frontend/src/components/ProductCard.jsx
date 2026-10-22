import { Link, useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { Heart, GitCompare, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { toggleCompare, useCompare, COMPARE_MAX } from '../lib/compare'
import { useUI } from '../context/UIContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import { getProductThumb, handleProductImageError, productImageList } from '../lib/productImage'
import { keySpecLine } from '../lib/specTemplates'
import { useCurrency } from '../context/CurrencyContext'

function getStatus(product) {
  const variants = product.variants ?? []
  if (variants.length && variants.every(v => (v.stockQuantity ?? 1) <= 0)) return 'out'
  if (product.isNew) return 'new'
  const qty = variants[0]?.stockQuantity
  if (qty != null && qty > 0 && qty < 5) return 'low'
  return null
}

const STATUS = {
  new:  { label: 'New',          bg: 'var(--accent-dim2)',  ring: 'var(--accent-focus)',  color: 'var(--accent-light)' },
  low:  { label: 'Low stock',    bg: 'var(--warning-soft)', ring: 'var(--warning-border)', color: 'var(--warning)' },
  out:  { label: 'Out of stock', bg: 'var(--overlay-shade-soft)', ring: 'transparent', color: '#fff' },
}

// The whole card opens the product page (one real link, so it can be opened in a new tab or
// shared). Quick view, wishlist and compare are separate buttons on top (UX audit A1/B2/B3).
export default function ProductCard({ product }) {
  const { t } = useT()
  const navigate = useNavigate()
  const { formatPrice } = useCurrency()
  const { setQuickViewProduct } = useUI()
  const { wishlistIds, toggle } = useWishlist()
  const { user } = useAuth()
  const compareList = useCompare()

  const pid        = product.productId ?? product.id
  const href       = `/products/${pid}`
  const wishlisted = wishlistIds.has(pid)
  const comparing  = compareList.some(p => p.id === pid)
  const price      = parseFloat(product.startingPrice ?? product.price) || 0
  // During a sale the API sends the sale price as price and the old one as regularPrice.
  const regular    = parseFloat(product.regularPrice) || 0
  const onSale     = Boolean(product.campaign) && regular > price

  const primaryImage = getProductThumb(product)
  const hoverImage   = productImageList(product)[1] ?? null
  const categoryName = product.category?.name ?? product.categoryName ?? ''
  const specLine     = keySpecLine(product)
  const status       = getStatus(product)
  const sc           = status ? STATUS[status] : null

  const onWishlist = () => {
    if (user) { toggle(pid, product.name); return }
    toast(t('Sign in to save products to your wishlist'), {
      action: { label: t('Sign in'), onClick: () => navigate('/login', { state: { from: href } }) },
    })
  }

  return (
    <article className={`product-card${status === 'out' ? ' is-out' : ''}`}>
      <div className="pc-media">
        {primaryImage && (
          <img className="pc-img" src={primaryImage} alt="" loading="lazy" onError={handleProductImageError} />
        )}
        {hoverImage && (
          <img className="pc-img pc-img-alt" src={hoverImage} alt="" loading="lazy" onError={handleProductImageError} />
        )}

        {onSale ? (
          <span className="pc-badge" style={{ background: 'var(--danger, #ef4444)', color: '#fff', fontWeight: 800 }}>
            {product.campaign.label}
          </span>
        ) : sc && (
          <span className="pc-badge" style={{ background: sc.bg, border: `1px solid ${sc.ring}`, color: sc.color }}>
            {t(sc.label)}
          </span>
        )}

        <button
          type="button"
          className={`pc-icon-btn pc-heart${wishlisted ? ' on' : ''}`}
          onClick={onWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? t('Remove from wishlist') : t('Add to wishlist')}
        >
          <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          className="pc-icon-btn pc-quick"
          onClick={() => setQuickViewProduct(product)}
          aria-label={t('Quick view: {name}', { name: product.name })}
        >
          <Eye size={15} />
        </button>
      </div>

      <div className="pc-body">
        {categoryName && <p className="pc-cat">{categoryName}</p>}
        <h3 className="pc-name">
          <Link to={href} className="pc-link">{product.name}</Link>
        </h3>
        {specLine && <p className="pc-specs">{specLine}</p>}
        <div className="pc-foot">
          <p className="pc-price">
            {formatPrice(price)}
            {onSale && <s className="pc-was">{formatPrice(regular)}</s>}
          </p>
          <button
            type="button"
            className={`pc-compare${comparing ? ' on' : ''}`}
            onClick={() => {
              const result = toggleCompare(product)
              if (result === 'full') toast.info(t('You can compare up to {n} products — remove one first.', { n: COMPARE_MAX }))
            }}
            aria-pressed={comparing}
            aria-label={comparing ? t('Remove from compare') : t('Add to compare')}
          >
            <GitCompare size={12} /> {comparing ? t('Added') : t('Compare')}
          </button>
        </div>
      </div>
    </article>
  )
}
