import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, RotateCcw } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { Reveal } from '../lib/motion'
import api from '../api/axios'

const CATEGORIES = ['Audio', 'Wearables', 'Cameras', 'Computing', 'Gaming', 'Accessories']

const MOCK_PRODUCTS = [
  { id: 1, name: 'Pulse Pro Earbuds',    price: 189,  categoryName: 'Audio',     imageUrl: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=500&q=80', variants: [{ id: 1 }] },
  { id: 2, name: 'Vox Studio Monitor',   price: 459,  categoryName: 'Audio',     imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80', variants: [{ id: 2 }] },
  { id: 3, name: 'Atlas Smartwatch',     price: 599,  categoryName: 'Wearables', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', variants: [{ id: 3 }] },
  { id: 4, name: 'Trail Sport Band',     price: 49,   categoryName: 'Wearables', imageUrl: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd6b0?w=500&q=80', variants: [{ id: 4 }] },
  { id: 5, name: 'Lumen X1 Mirrorless', price: 2199, categoryName: 'Cameras',   imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80', variants: [{ id: 5 }] },
  { id: 6, name: 'Prism Action Cam',    price: 429,  categoryName: 'Cameras',   imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80', variants: [{ id: 6 }] },
  { id: 7, name: 'Stratos Ultrabook 14',price: 1499, categoryName: 'Computing', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80', variants: [{ id: 7 }] },
  { id: 8, name: 'Mecha 75 Keyboard',   price: 179,  categoryName: 'Computing', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80', variants: [{ id: 8 }] },
]

export default function Home() {
  const [products, setProducts]             = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get('/products?page=0&size=8')
      .then(({ data }) => {
        if (!cancelled) {
          const content  = data?.content ?? (Array.isArray(data) ? data : [])
          const filtered = activeCategory
            ? content.filter(p => (p.category?.name ?? p.categoryName) === activeCategory)
            : content
          setProducts(filtered)
        }
      })
      .catch(() => { if (!cancelled) setProducts(MOCK_PRODUCTS) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeCategory])

  const displayProducts = products.length ? products : MOCK_PRODUCTS

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ padding: '72px 0 48px' }}>
        <div className="container-noir" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 64, alignItems: 'center',
        }}>
          {/* Left copy */}
          <Reveal>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '1px solid #2a2a2a', borderRadius: 100,
              padding: '6px 14px', marginBottom: 28,
              fontSize: 13, color: '#888',
            }}>
              <span>🚀</span>
              <span>New season — late autumn 2026</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(38px, 4.5vw, 66px)',
              fontWeight: 900, lineHeight: 1.05,
              color: '#fff', marginBottom: 22,
              letterSpacing: '-0.02em',
            }}>
              Considered<br />
              objects.<br />
              <span style={{ color: '#7c5cf0' }}>Quietly<br />engineered.</span>
            </h1>

            <p style={{ color: '#888', fontSize: 16, lineHeight: 1.75, maxWidth: 420, marginBottom: 36 }}>
              A curated collection of audio, wearables, and computing —
              selected for the people who choose what surrounds them with care.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                to="/products"
                className="noir-btn-primary"
                style={{ fontSize: 15, padding: '13px 24px' }}
              >
                Shop the collection <ArrowRight size={16} />
              </Link>
              <Link
                to="/products?category=Audio"
                className="noir-btn-outline"
                style={{ fontSize: 15, padding: '13px 24px' }}
              >
                Explore audio
              </Link>
            </div>
          </Reveal>

          {/* Right hero image */}
          <Reveal delay={0.15}>
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '4/3', background: '#d4a83c' }}>
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                  alt="Aurora Wireless headphones"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.parentElement.style.background = '#1a1a1a' }}
                />
              </div>
              {/* Featured badge */}
              <div style={{
                position: 'absolute', bottom: -18, left: -18,
                background: '#0f0f0f', border: '1px solid #2a2a2a',
                borderRadius: 12, padding: '14px 20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: '#888', marginBottom: 4 }}>FEATURED</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Aurora Wireless</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>$349</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Category tabs ──────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', overflowX: 'auto' }}>
        <div className="container-noir" style={{ display: 'flex', minWidth: 600 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
              style={{
                flex: 1, padding: '18px 8px',
                fontSize: 14, fontWeight: 500,
                color: activeCategory === cat ? '#fff' : '#888',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeCategory === cat ? '#7c5cf0' : 'transparent'}`,
                cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (activeCategory !== cat) e.currentTarget.style.color = '#bbb' }}
              onMouseLeave={e => { if (activeCategory !== cat) e.currentTarget.style.color = '#888' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Product grid ───────────────────────────────────────── */}
      <Reveal>
        <section style={{ padding: '56px 0 48px' }}>
          <div className="container-noir">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#7c5cf0', marginBottom: 6 }}>
                  LATEST ARRIVALS
                </p>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>New this season</h2>
              </div>
              <Link
                to="/products"
                style={{ fontSize: 14, color: '#888', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#888'}
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="grid-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 300, borderRadius: 12 }} />
                ))}
              </div>
            ) : (
              <div className="grid-4">
                {displayProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </section>
      </Reveal>

      {/* ── Trust badges ───────────────────────────────────────── */}
      <Reveal>
        <section style={{ padding: '0 0 80px' }}>
          <div className="container-noir">
            <div style={{
              background: '#141414', border: '1px solid #1e1e1e',
              borderRadius: 16, padding: '44px 48px',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32,
            }}>
              {[
                { icon: <Truck size={22} />,     title: 'Free shipping',   desc: 'On all orders over $100.' },
                { icon: <Shield size={22} />,    title: '2-year warranty', desc: 'Quietly confident craftsmanship.' },
                { icon: <RotateCcw size={22} />, title: '30-day returns',  desc: "If it isn't right, send it back." },
              ].map(({ icon, title, desc }) => (
                <div key={title}>
                  <div style={{ color: '#7c5cf0', marginBottom: 12 }}>{icon}</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{title}</p>
                  <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  )
}
