import { useState, useEffect } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import apiService from '../../api/service'

function Card({ name, rating, text }) {
  return (
    <div
      className="glass"
      style={{
        flexShrink: 0,
        width: 272,
        padding: '20px 22px',
        borderRadius: 14,
        margin: '0 8px',
      }}
    >
      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={13} fill={i < rating ? '#f59e0b' : 'none'} color="#f59e0b" />
        ))}
      </div>
      <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.65, marginBottom: 14 }}>"{text}"</p>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{name}</p>
    </div>
  )
}

function Row({ items, reverse = false, duration = '38s' }) {
  const reduce  = useReducedMotion()
  const doubled = [...items, ...items]

  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <div
        className={reduce ? undefined : 'marquee-track'}
        style={{ display: 'flex', animationDuration: duration, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {doubled.map((t, i) => <Card key={i} {...t} />)}
      </div>
    </div>
  )
}

export default function Testimonials() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiService.reviews.getRecent(12)
      .then(({ data }) => {
        const reviews = Array.isArray(data) ? data : []
        setItems(reviews.map(r => ({
          name: r.userName || 'Anonymous',
          rating: r.rating ?? 5,
          text: r.comment || 'Loved it.',
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Need at least 2 reviews so each row has content
  if (!loading && items.length < 2) {
    return null
  }

  if (loading) return null

  const mid   = Math.ceil(items.length / 2)
  const rowA  = items.slice(0, mid)
  const rowB  = items.slice(mid)

  return (
    <section style={{ padding: '72px 0', overflow: 'hidden' }}>
      <div className="container-noir" style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#7c5cf0', marginBottom: 8 }}>TESTIMONIALS</p>
        <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          What customers say
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Row items={rowA} duration="42s" />
        {rowB.length > 0 && <Row items={rowB} duration="38s" reverse />}
      </div>
    </section>
  )
}
