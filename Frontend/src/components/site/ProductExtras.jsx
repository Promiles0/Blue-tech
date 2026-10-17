import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronRight, Sparkles, Share2, GitCompare, Truck, ShieldCheck, CreditCard, RotateCcw } from 'lucide-react'
import { openLiveChat } from '../../lib/liveChat'
import { toggleCompare, useCompare, COMPARE_MAX } from '../../lib/compare'

// Same rule CategoryPage uses to match a category without its own slug.
const slugify = (name = '') => name.toLowerCase().replace(/\s+/g, '-')

export function Breadcrumb({ product }) {
  const category = product.category?.name ?? product.categoryName
  const crumb = { fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }
  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 32 }}>
      <Link to="/" style={crumb}>Home</Link>
      <ChevronRight size={13} style={{ color: 'var(--muted-dark)' }} />
      {category ? (
        <>
          <Link to={`/category/${encodeURIComponent(product.category?.slug ?? slugify(category))}`} style={crumb}>{category}</Link>
          <ChevronRight size={13} style={{ color: 'var(--muted-dark)' }} />
        </>
      ) : (
        <>
          <Link to="/products" style={crumb}>Store</Link>
          <ChevronRight size={13} style={{ color: 'var(--muted-dark)' }} />
        </>
      )}
      <span aria-current="page" style={{ ...crumb, color: 'var(--text)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {product.name}
      </span>
    </nav>
  )
}

const pill = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, flex: 1,
  padding: '11px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', whiteSpace: 'nowrap',
}

// Ask Blue · Share · Compare — the secondary actions under Add to cart.
export function ProductActions({ product }) {
  const compare = useCompare()
  const id = product.productId ?? product.id
  const comparing = compare.some((p) => p.id === id)

  const share = async () => {
    const url = `${window.location.origin}/products/${id}`
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text: `${product.name} on Blue-Tech`, url }); return } catch { return }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied — paste it anywhere to share')
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${product.name} — ${url}`)}`, '_blank', 'noopener')
    }
  }

  const onCompare = () => {
    const result = toggleCompare(product)
    if (result === 'full') toast.info(`You can compare up to ${COMPARE_MAX} products — remove one first.`)
    else if (result === 'added') toast.success('Added to compare')
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
      <button style={pill} onClick={() => openLiveChat(`About the ${product.name}: `)}>
        <Sparkles size={14} style={{ color: 'var(--accent-light, var(--accent))' }} /> Ask Blue
      </button>
      <button style={pill} onClick={share}><Share2 size={14} /> Share</button>
      <button
        style={{ ...pill, ...(comparing ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)' } : {}) }}
        onClick={onCompare}
        aria-pressed={comparing}
      >
        <GitCompare size={14} /> {comparing ? 'Comparing' : 'Compare'}
      </button>
    </div>
  )
}

// Delivery, warranty, returns and payment in one glance, right under the buy buttons.
export function BuyInfo({ product }) {
  const rows = [
    { Icon: Truck, text: 'Free delivery across Rwanda · express next-day available' },
    { Icon: ShieldCheck, text: product.warranty ? `${product.warranty} warranty` : 'Warranty included' },
    { Icon: RotateCcw, text: '30-day returns' },
    { Icon: CreditCard, text: 'Pay with MTN MoMo, Airtel Money or card' },
  ]
  return (
    <div style={{ marginTop: 20, border: '1px solid var(--border)', borderRadius: 12, padding: '4px 14px' }}>
      {rows.map(({ Icon, text }, i) => (
        <div key={text} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', fontSize: 13, color: 'var(--muted)',
          borderTop: i ? '1px solid var(--border)' : 'none',
        }}>
          <Icon size={15} style={{ color: 'var(--accent-light, var(--accent))', flexShrink: 0 }} /> {text}
        </div>
      ))}
    </div>
  )
}
