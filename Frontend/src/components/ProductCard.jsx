import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Heart } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function ProductCard({ product }) {
  const { addToCart }    = useCart()
  const { user }         = useAuth()
  const [hover, setHover]   = useState(false)
  const [adding, setAdding] = useState(false)

  const primaryImage =
    product.images?.find(i => i.primary)?.imageUrl
    ?? product.images?.[0]?.imageUrl
    ?? product.imageUrl
    ?? `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80`

  const categoryName = product.category?.name ?? product.categoryName ?? ''
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0
  const variantId = product.variants?.[0]?.id

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { window.location.href = '/login'; return }
    if (!variantId) return
    setAdding(true)
    try { await addToCart(variantId, 1) } finally { setAdding(false) }
  }

  return (
    <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: '#141414',
          border: `1px solid ${hover ? '#2e2e2e' : '#1e1e1e'}`,
          borderRadius: 12,
          overflow: 'hidden',
          transition: 'border-color 0.2s, transform 0.25s',
          transform: hover ? 'translateY(-3px)' : 'none',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: 220, background: '#1a1a1a', overflow: 'hidden' }}>
          <img
            src={primaryImage}
            alt={product.name}
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' }}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.4s',
              transform: hover ? 'scale(1.05)' : 'scale(1)',
            }}
          />

          {/* Add to cart button */}
          {variantId && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, opacity: hover ? 1 : 0, transition: 'opacity 0.2s' }}>
              <button
                onClick={handleAddToCart}
                className="noir-btn-primary"
                style={{ width: '100%', fontSize: 13, padding: '9px 16px' }}
              >
                <ShoppingBag size={14} />
                {adding ? 'Adding…' : 'Add to cart'}
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px 16px' }}>
          {categoryName && (
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#888', marginBottom: 5, textTransform: 'uppercase' }}>
              {categoryName}
            </p>
          )}
          <p style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginBottom: 8, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.name}
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>
            ${price.toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  )
}
