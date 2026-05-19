import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Tilt } from '../lib/motion'
import { useUI } from '../context/UIContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'

function getStatus(product) {
  if (product.isNew) return 'new'
  const qty = product.variants?.[0]?.stockQuantity
  if (qty != null && qty > 0 && qty < 5) return 'low'
  return null
}

const STATUS = {
  new:  { label: 'New',       bg: 'var(--accent-dim2)',  ring: 'var(--accent-focus)',  color: 'var(--accent-light)' },
  low:  { label: 'Low stock', bg: 'var(--warning-soft)', ring: 'var(--warning-border)', color: 'var(--warning)' },
}

export default function ProductCard({ product }) {
  const [hover, setHover] = useState(false)
  const { setQuickViewProduct } = useUI()
  const { wishlistIds, toggle } = useWishlist()
  const { user } = useAuth()

  const pid        = product.productId ?? product.id
  const wishlisted = wishlistIds.has(pid)
  const price      = parseFloat(product.startingPrice ?? product.price) || 0

  const primaryImage =
    product.images?.find(i => i.isPrimary)?.imageUrl
    ?? product.images?.[0]?.imageUrl
    ?? product.primaryImageUrl
    ?? product.imageUrl
    ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'

  const hoverImage   = product.images?.[1]?.imageUrl ?? null
  const categoryName = product.category?.name ?? product.categoryName ?? ''
  const status       = getStatus(product)
  const sc           = status ? STATUS[status] : null

  return (
    <Tilt max={6} style={{ height: '100%', display: 'block' }}>
      <div
        style={{
          background: 'var(--surface)',
          border: `1px solid ${hover ? 'var(--accent-border)' : 'var(--card)'}`,
          borderRadius: 12, overflow: 'hidden',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          boxShadow: hover ? 'var(--shadow-elegant)' : 'none',
          height: '100%', display: 'flex', flexDirection: 'column',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* ── Image area ──────────────────────────────────── */}
        <div 
          style={{ position: 'relative', aspectRatio: '4/5', background: 'var(--card)', overflow: 'hidden', flexShrink: 0 }}
          onClick={() => setQuickViewProduct(product)}
        >

          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' }}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              position: 'absolute', inset: 0,
              transform: hover ? 'scale(1.10)' : 'scale(1)',
              transition: 'transform 0.7s ease, opacity 0.7s ease',
              opacity: hover && hoverImage ? 0 : 1,
            }}
          />

          {hoverImage && (
            <img
              src={hoverImage}
              alt={product.name}
              loading="lazy"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                position: 'absolute', inset: 0,
                opacity: hover ? 1 : 0,
                transition: 'opacity 0.7s ease',
              }}
            />
          )}

          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)',
            opacity: hover ? 1 : 0,
            transition: 'opacity 0.3s',
            pointerEvents: 'none',
          }} />

          {sc && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: sc.bg, border: `1px solid ${sc.ring}`,
              color: sc.color, borderRadius: 100,
              padding: '3px 10px', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em',
            }}>
              {sc.label}
            </div>
          )}

          {/* Wishlist button */}
          <div
            onClick={e => { 
              e.preventDefault(); 
              e.stopPropagation();
              if (user) {
                toggle(pid, product.name);
              }
            }}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: wishlisted ? 'var(--danger-soft)' : 'var(--glass-bg2)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${wishlisted ? 'var(--danger-border)' : 'var(--glass-border)'}`,
              borderRadius: '50%', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: wishlisted ? 'var(--brand)' : 'var(--icon-color)', cursor: 'pointer',
              opacity: 1,
              transition: 'opacity 0.25s, background 0.2s, color 0.2s',
              zIndex: 100,
            }}
            title={user ? (wishlisted ? 'Remove from wishlist' : 'Add to wishlist') : 'Sign in to save'}
            onMouseEnter={e => { if (!wishlisted) e.currentTarget.style.background = 'var(--overlay-hover)' }}
            onMouseLeave={e => { if (!wishlisted) e.currentTarget.style.background = 'var(--glass-bg2)' }}
          >
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────── */}
        <div style={{ padding: '14px 16px 18px', flex: 1 }}>
          {categoryName && (
            <p style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', color: 'var(--muted-dark)',
              marginBottom: 5, textTransform: 'uppercase',
            }}>
              {categoryName}
            </p>
          )}
          <p style={{
            fontFamily: '"Space Grotesk",sans-serif',
            fontSize: 15, fontWeight: 600,
            color: hover ? 'var(--accent-light)' : 'var(--text)',
            marginBottom: 8, lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            transition: 'color 0.25s',
          }}>
            {product.name}
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--price)' }}>
            ${price.toFixed(2)}
          </p>
        </div>
      </div>
    </Tilt>
  )
}
