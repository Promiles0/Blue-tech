import { useReducedMotion } from 'framer-motion'

const ITEMS = [
  'Free shipping over $200',
  'New drop: Nocturne collection',
  'Members get 15% off',
  'Free returns within 30 days',
  'Secure checkout · SSL encrypted',
]

export default function MarqueeStrip() {
  const reduce  = useReducedMotion()
  const tripled = [...ITEMS, ...ITEMS, ...ITEMS]

  return (
    <div
      className="marquee"
      style={{
        background: 'rgba(20,20,20,0.6)',
        color: 'var(--muted)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        padding: '12px 0',
        flexShrink: 0,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
              color: 'var(--muted)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'var(--accent)',
              }}
            />
            {msg}
          </span>
        ))}
      </div>
    </div>
  )
}
