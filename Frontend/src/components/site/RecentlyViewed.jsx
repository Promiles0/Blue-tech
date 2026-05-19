import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '../../lib/motion'
import { getRecentlyViewed } from '../../lib/recentlyViewed'

// Already normalized by getRecentlyViewed, but guard at render time too
function safeImageSrc(url) {
  if (!url) return null
  const m = url.match(/^\/uploads\/products\/(https?:\/\/.+)/)
  return m ? m[1] : url
}

export default function RecentlyViewed() {
  const [items, setItems] = useState([])

  useEffect(() => { setItems(getRecentlyViewed()) }, [])

  if (items.length === 0) return null

  return (
    <section style={{ padding: '48px 0 56px' }}>
      <div className="container-noir">
        <Reveal>
          <h2 style={{
            fontFamily: '"Space Grotesk",sans-serif',
            fontSize: 22, fontWeight: 800, marginBottom: 20,
            letterSpacing: '-0.01em',
          }}>
            Recently viewed
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
            {items.map((p, i) => (
              <Link
                key={`${p.id ?? i}-${i}`}
                to={`/products/${p.id}`}
                style={{
                  flexShrink: 0, width: 136,
                  background: 'var(--surface)', border: '1px solid #1e1e1e',
                  borderRadius: 10, overflow: 'hidden',
                  textDecoration: 'none', display: 'block',
                  transition: 'border-color 0.2s, transform 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2e2e2e'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ height: 116, overflow: 'hidden', background: 'var(--card)' }}>
                  {p.imageUrl && (
                    <img
                      src={safeImageSrc(p.imageUrl)}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  )}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#e5e5e5', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--price)' }}>${parseFloat(p.price ?? 0).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
