import { Star } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'

const TESTIMONIALS = [
  { name: 'Alex M.',   rating: 5, text: 'The build quality is unlike anything I\'ve owned. Worth every penny.' },
  { name: 'Jordan L.', rating: 5, text: 'Shipping was fast and the packaging was beautiful. 10/10 experience.' },
  { name: 'Sam K.',    rating: 5, text: 'Been using the Aurora Wireless for three months. Pristine audio.' },
  { name: 'Riley C.',  rating: 4, text: 'Elegant, minimal, and performs exactly as described. No surprises.' },
  { name: 'Morgan T.', rating: 5, text: 'Customer service was outstanding. They helped me pick the perfect gift.' },
  { name: 'Casey R.',  rating: 5, text: 'The design language is cohesive and beautiful. Love the NOIR aesthetic.' },
  { name: 'Drew P.',   rating: 4, text: 'Ordered the smartwatch — far exceeded my expectations.' },
  { name: 'Quinn B.',  rating: 5, text: 'Finally, a tech store that cares about more than specs. Highly recommend.' },
]

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
  return (
    <section style={{ padding: '72px 0', overflow: 'hidden' }}>
      <div className="container-noir" style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#7c5cf0', marginBottom: 8 }}>TESTIMONIALS</p>
        <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          What customers say
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Row items={TESTIMONIALS.slice(0, 4)} duration="42s" />
        <Row items={TESTIMONIALS.slice(4)}   duration="38s" reverse />
      </div>
    </section>
  )
}
