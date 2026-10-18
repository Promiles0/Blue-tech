import { useReducedMotion } from 'framer-motion'
import { useT } from '../../lib/i18n'

const ITEMS = [
  'Free delivery across Rwanda',
  'Warranty on every product',
  'Free returns within 30 days',
  'Pay with MoMo or card',
  'Questions? Ask Blue, our AI assistant',
]

export default function MarqueeStrip() {
  const { t } = useT()
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
            {t(msg)}
          </span>
        ))}
      </div>
    </div>
  )
}
