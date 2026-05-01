import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Heart } from 'lucide-react'
import { Tilt } from '../lib/motion'
import { useUI } from '../context/UIContext'

function getStatus(product) {
  if (product.isNew) return 'new'
  if (product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)) return 'sale'
  const qty = product.variants?.[0]?.stockQuantity
  if (qty != null && qty > 0 && qty < 5) return 'low'
  return null
}

const STATUS = {
  new:  { label: 'New',       bg: 'rgba(124,92,240,0.16)',  ring: 'rgba(124,92,240,0.4)',  color: '#a78bfa' },
  sale: { label: 'Sale',      bg: 'rgba(245,158,11,0.16)',  ring: 'rgba(245,158,11,0.4)',  color: '#fbbf24' },
  low:  { label: 'Low stock', bg: 'rgba(251,146,60,0.16)',  ring: 'rgba(251,146,60,0.4)',  color: '#fb923c' },
}

export default function ProductCard({ product }) {
  const [hover, setHover] = useState(false)
  const { setQuickViewProduct } = useUI()

  const primaryImage =
    product.images?.find(i => i.primary)?.imageUrl
    ?? product.images?.[0]?.imageUrl
    ?? product.imageUrl
    ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'

  const hoverImage    = product.images?.[1]?.imageUrl ?? null
  const categoryName  = product.category?.name ?? product.categoryName ?? ''
  const price         = parseFloat(product.price) || 0
  const status        = getStatus(product)
  const sc            = status ? STATUS[status] : null

  return (
    <Tilt max={6} style={{ height: '100%', display: 'block' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: '#141414',
          border: `1px solid ${hover ? 'rgba(124,92,240,0.28)' : '#1e1e1e'}`,
          borderRadius: 12, overflow: 'hidden',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          boxShadow: hover ? 'var(--shadow-elegant)' : 'none',
          height: '100%', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── Image area ──────────────────────────────────── */}
        <div style={{ position: 'relative', aspectRatio: '4/5', background: '#1a1a1a', overflow: 'hidden', flexShrink: 0 }}>

          {/* Primary image */}
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

          {/* Hover / second image cross-fade */}
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

          {/* Bottom gradient revealed on hover */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)',
            opacity: hover ? 1 : 0,
            transition: 'opacity 0.3s',
            pointerEvents: 'none',
          }} />

          {/* Status badge — top-left */}
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

          {/* Wishlist button — top-right, visible on hover */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation() }}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50%', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer',
              opacity: hover ? 1 : 0,
              transition: 'opacity 0.25s, background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,240,0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            <Heart size={14} />
          </button>

          {/* Quick view pill — slides up on hover */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(product) }}
            style={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: `translateX(-50%) translateY(${hover ? '0px' : '14px'})`,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 100,
              padding: '7px 16px',
              display: 'flex', alignItems: 'center', gap: 7,
              color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              opacity: hover ? 1 : 0,
              transition: 'opacity 0.25s, transform 0.3s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <Eye size={13} /> Quick view
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────── */}
        <Link
          to={`/products/${product.id}`}
          style={{ padding: '14px 16px 18px', textDecoration: 'none', display: 'block', flex: 1 }}
        >
          {categoryName && (
            <p style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', color: '#444',
              marginBottom: 5, textTransform: 'uppercase',
            }}>
              {categoryName}
            </p>
          )}
          <p style={{
            fontFamily: '"Space Grotesk",sans-serif',
            fontSize: 15, fontWeight: 600,
            color: hover ? '#a78bfa' : '#fff',
            marginBottom: 8, lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            transition: 'color 0.25s',
          }}>
            {product.name}
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>
            ${price.toFixed(2)}
          </p>
        </Link>
      </div>
    </Tilt>
  )
}
