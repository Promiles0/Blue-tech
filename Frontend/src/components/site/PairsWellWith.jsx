import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, ImageOff, Loader2, Plus } from 'lucide-react'
import apiService from '../../api/service'
import { useT } from '../../lib/i18n'
import { useCart } from '../../context/CartContext'
import { useUI } from '../../context/UIContext'
import { useCurrency } from '../../context/CurrencyContext'
import { cartSnapshot } from '../../lib/cartSnapshot'

// "Pairs well with" on product pages and "Complete your setup" in the cart (round 2, 2d):
// accessories that go with what the shopper is looking at, bought-together data first.
export default function PairsWellWith({ productIds = [], title, limit = 4 }) {
  const { t } = useT()
  const key = productIds.filter(Boolean).map(String).sort().join(',')
  const { data: items = [] } = useQuery({
    queryKey: ['pairs', key, limit],
    queryFn: () => apiService.products.pairs(key, limit).then((r) => r.data ?? []),
    enabled: Boolean(key),
    staleTime: 5 * 60_000,
  })
  if (!items.length) return null
  return (
    <section style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: '0 0 12px' }}>{title ?? t('Pairs well with')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {items.map((p) => <PairCard key={p.productId} product={p} />)}
      </div>
    </section>
  )
}

function PairCard({ product }) {
  const { t } = useT()
  const { formatPrice } = useCurrency()
  const { addToCart, isInCart } = useCart()
  const { setQuickViewProduct } = useUI()
  const [adding, setAdding] = useState(false)
  const variantId = product.variant?.variantId
  const inCart = variantId != null && isInCart(variantId)

  const add = async () => {
    // Several options (colour, size): let the shopper choose in Quick View.
    if (!variantId) { setQuickViewProduct({ productId: product.productId }); return }
    setAdding(true)
    try { await addToCart(variantId, 1, cartSnapshot({ ...product, primaryImageUrl: product.imageUrl }, product.variant)) } finally { setAdding(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-surface, transparent)' }}>
      <Link to={`/products/${product.productId}`} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
        <div style={{ width: 48, height: 48, borderRadius: 9, background: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageOff size={16} style={{ color: 'var(--muted)' }} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: product.name === product.name?.toLowerCase() ? 'capitalize' : 'none' }}>{product.name}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--price, var(--accent))' }}>{formatPrice(product.price)}</div>
        </div>
      </Link>
      <button type="button" onClick={add} disabled={adding || inCart} aria-label={t('Add {name} to cart', { name: product.name })}
        style={{
          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 999, border: 0, fontSize: 11.5, fontWeight: 700, cursor: inCart ? 'default' : 'pointer',
          background: inCart ? 'var(--accent-dim)' : 'var(--accent)', color: inCart ? 'var(--accent-light, var(--accent))' : '#fff',
        }}>
        {adding ? <Loader2 size={12} className="animate-spin" /> : inCart ? <Check size={12} /> : <Plus size={12} />} {inCart ? t('Added') : t('Add')}
      </button>
    </div>
  )
}
