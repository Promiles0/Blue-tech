import { useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useT } from '../../lib/i18n'
import { useCart } from '../../context/CartContext'
import { useUI } from '../../context/UIContext'
import { cartSnapshot } from '../../lib/cartSnapshot'

// "Buy again" (5d): puts an earlier order's items back in the cart at today's price, skipping
// anything no longer sold or out of stock (and saying so), then opens the cart.
export default function BuyAgainButton({ order, compact = false }) {
  const { t } = useT()
  const { addToCart } = useCart()
  const { setCartOpen } = useUI()
  const [busy, setBusy] = useState(false)
  const items = (order?.items ?? []).filter((i) => i.productId)
  if (!items.length) return null

  const run = async () => {
    setBusy(true)
    const skipped = []
    let added = 0
    for (const item of items) {
      try {
        const { data: product } = await apiService.products.getOne(item.productId)
        const variants = product?.variants ?? []
        const variant = variants.find((v) => (v.variantId ?? v.id) === item.variantId) ?? (variants.length === 1 ? variants[0] : null)
        const stock = Number(variant?.stockQuantity ?? 0)
        if (!product || product.isActive === false || !variant || stock < 1) { skipped.push(item.productName); continue }
        await addToCart(variant.variantId ?? variant.id, Math.min(item.quantity ?? 1, stock), cartSnapshot(product, variant))
        added++
      } catch {
        skipped.push(item.productName)
      }
    }
    setBusy(false)
    if (skipped.length) toast.warning(t('Not available right now: {names}', { names: skipped.join(', ') }))
    if (added) setCartOpen(true)
  }

  return (
    <button type="button" onClick={run} disabled={busy} className={compact ? undefined : 'noir-btn-outline'}
      style={compact
        ? { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary, var(--text))', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }
        : { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', fontSize: 13 }}>
      {busy ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} {t('Buy again')}
    </button>
  )
}
