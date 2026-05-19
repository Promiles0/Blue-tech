import { useReducedMotion } from 'framer-motion'

const ITEMS = [
  'Free shipping over $200',
  'Members get 15% off',
  'Free returns within 30 days',
  'Secure checkout · SSL encrypted',
  'New arrivals added weekly',
]

export default function MarqueeStrip() {
  const reduce  = useReducedMotion()
  const tripled = [...ITEMS, ...ITEMS, ...ITEMS]

  return (
    <div
      className="marquee"
      style={{
        background: 'var(--accent)',
        color: 'rgba(255,255,255,0.9)',
        overflow: 'hidden',
        padding: '11px 0',
        flexShrink: 0,
      }}
    >
      <div
        className={reduce ? undefined : 'marquee-track'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          whiteSpace: 'nowrap',
          minWidth: 'max-content',
        }}
      >
        {tripled.map((msg, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: '"Space Grotesk",sans-serif',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.5)',
              }}
            />
            {msg}
          </span>
        ))}
      </div>
    </div>
  )
}
