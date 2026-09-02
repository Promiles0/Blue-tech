import { CountUp } from '../../lib/motion'

// TODO: replace with the real spec sheet once hardware is finalized. Decimals/
// prefixes/suffixes are all wired up already, so swapping numbers is a one-line
// change per spec — no layout or animation code needs to change.
const SPECS = [
  { label: 'Screen size',   value: 86, suffix: '"' },
  { label: 'Resolution',    value: 4,  suffix: 'K UHD' },
  { label: 'Touch points',  value: 20, suffix: '+' },
  { label: 'Connectivity',  value: 6,  suffix: ' ports' },
]

export default function InteractiveScreensSpecs() {
  return (
    <section style={{
      padding: 'clamp(44px,7vw,80px) 0',
      borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
    }}>
      <div className="container-noir">
        <div className="grid-4" style={{ textAlign: 'center' }}>
          {SPECS.map(spec => (
            <div key={spec.label}>
              <p style={{
                fontFamily: '"Space Grotesk",sans-serif',
                fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800,
                color: 'var(--accent-light)', letterSpacing: '-0.02em',
              }}>
                <CountUp to={spec.value} suffix={spec.suffix} duration={1.4} />
              </p>
              <p style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--muted-dark)', marginTop: 8,
              }}>
                {spec.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
