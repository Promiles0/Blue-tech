import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ImageOff, Loader2, PackagePlus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useT } from '../../lib/i18n'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import { cartSnapshot } from '../../lib/cartSnapshot'
import { getProductThumb } from '../../lib/productImage'

// "Buy together and save" on product pages (6c). The saving is applied at checkout when the
// whole set is in the cart, so adding the bundle just adds each product.
export default function BundleOffers({ productId }) {
  const { t } = useT()
  const { data: bundles = [] } = useQuery({
    queryKey: ['bundles', productId],
    queryFn: () => apiService.products.bundles(productId).then((r) => r.data ?? []),
    enabled: Boolean(productId),
    staleTime: 5 * 60_000,
  })
  if (!bundles.length) return null
  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <PackagePlus size={20} style={{ color: 'var(--accent)' }} /> {t('Buy together and save')}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {bundles.map((b) => <Bundle key={b.id} bundle={b} />)}
      </div>
    </section>
  )
}

function Bundle({ bundle }) {
  const { t } = useT()
  const { formatPrice } = useCurrency()
  const { addToCart, isInCart } = useCart()
  const [adding, setAdding] = useState(false)
  // First option in stock for each product (or the first option if none is).
  const picks = bundle.products.map((p) => ({ product: p, variant: (p.variants ?? []).find((v) => Number(v.stockQuantity) > 0) ?? p.variants?.[0] }))
  const unavailable = picks.some((x) => !x.variant || Number(x.variant.stockQuantity) <= 0)

  const addAll = async () => {
    setAdding(true)
    try {
      for (const { product, variant } of picks) {
        if (!isInCart(variant.variantId)) await addToCart(variant.variantId, 1, cartSnapshot(product, variant))
      }
      toast.success(t('Bundle added — you save {amount} at checkout', { amount: formatPrice(bundle.saving) }))
    } catch {
      toast.error(t('Could not add the bundle'))
    } finally { setAdding(false) }
  }

  return (
    <div style={{ padding: 16, borderRadius: 14, border: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: '1 1 320px' }}>
        {picks.map(({ product }, i) => (
          <div key={product.productId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <Plus size={14} style={{ color: 'var(--muted)' }} />}
            <Link to={`/products/${product.productId}`} title={product.name} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit', maxWidth: 200 }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {getProductThumb(product) ? <img src={getProductThumb(product)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageOff size={16} style={{ color: 'var(--muted)' }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatPrice(product.price)}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', textDecoration: 'line-through' }}>{formatPrice(bundle.total)}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--price)' }}>{formatPrice(bundle.bundlePrice)}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success, #22c55e)', marginBottom: 8 }}>{t('You save {amount}', { amount: formatPrice(bundle.saving) })}</div>
        <button type="button" onClick={addAll} disabled={adding || unavailable} className="noir-btn-primary" style={{ padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {adding ? <Loader2 size={14} className="animate-spin" /> : <PackagePlus size={14} />}
          {unavailable ? t('Part of this set is out of stock') : t('Add bundle to cart')}
        </button>
      </div>
    </div>
  )
}
