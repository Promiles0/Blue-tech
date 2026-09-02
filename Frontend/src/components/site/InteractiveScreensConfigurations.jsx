import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '../../lib/motion'
import QuoteRequestModal from './QuoteRequestModal'

const CONFIGS = [
  { size: '65"',  ratio: 0.55, room: 'Small meeting rooms, clinics, offices', dims: '1.44 × 0.83 m', seats: 'Up to 10 people' },
  { size: '75"',  ratio: 0.64, room: 'Classrooms, mid-size boardrooms',       dims: '1.65 × 0.95 m', seats: 'Up to 20 people' },
  { size: '86"',  ratio: 0.73, room: 'Lecture rooms, executive suites',       dims: '1.90 × 1.09 m', seats: 'Up to 40 people' },
  { size: '98"',  ratio: 0.83, room: 'Large classrooms, training halls',      dims: '2.17 × 1.24 m', seats: 'Up to 70 people' },
  { size: '110"', ratio: 1,    room: 'Auditoriums, halls, command centres',   dims: '2.42 × 1.38 m', seats: 'Up to 120 people' },
]

// This section is a deliberate light "interlude" on an otherwise dark page — every color
// below is fixed rather than theme-driven (var(--text)/var(--bg) resolve to white-on-dark
// and would be invisible here), matching how the rest of the Interactive Screens page
// already uses fixed literal colors per-section rather than the site-wide theme tokens.
// Every value below is pulled from the site's existing brand palette (Frontend/src/index.css)
// rather than invented, so it still reads as "the same site": navy = --brand, orange =
// --price-color / light-mode --cta-bg, ink/mist = the light-theme --text/--border pair.
const MIST            = '#f5f4f1'
const HAIRLINE         = '#e2e2ea'
const HAIRLINE_STRONG  = '#d3d3e0'
const INK               = '#0f0f0f'
const INK_MUTED         = '#54545e'
const NAVY              = '#354380'
const NAVY_FOREGROUND   = '#ffffff'
const ORANGE             = '#f59e0b'
const ORANGE_FOREGROUND  = '#241a06'

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: NAVY, marginBottom: 10 }
const heading = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(26px,3.2vw,38px)', fontWeight: 900, letterSpacing: '-0.02em', color: INK }

export default function InteractiveScreensConfigurations() {
  const [activeIndex, setActiveIndex] = useState(2)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const active = CONFIGS[activeIndex]

  const specRows = [
    ['Screen size', `${active.size} diagonal`],
    ['Active area', active.dims],
    ['Resolution', '4K Ultra HD (3840×2160)'],
    ['Touch', '20-point multi-touch, finger and stylus'],
    ['Operating system', 'Android platform + optional Windows OPS'],
    ['Connectivity', 'HDMI, USB-C, USB 3.0, RJ45, Wi-Fi 6, Bluetooth'],
    ['Recommended for', active.room],
    ['Audience', active.seats],
  ]

  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: MIST, padding: 'clamp(64px,9vw,120px) 0' }}>
      {/* Two soft corner gradients — depth without noise */}
      <div aria-hidden style={{
        position: 'absolute', top: -160, right: -160, width: 480, height: 480, borderRadius: '50%',
        background: `radial-gradient(circle, ${ORANGE} 0%, transparent 70%)`, opacity: 0.55,
        filter: 'blur(70px)', pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: -180, left: -180, width: 520, height: 520, borderRadius: '50%',
        background: `radial-gradient(circle, ${NAVY} 0%, transparent 70%)`, opacity: 0.55,
        filter: 'blur(70px)', pointerEvents: 'none',
      }} />

      <div className="container-noir" style={{ position: 'relative' }}>
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <p style={eyebrow}>07 — Configurations</p>
            <h2 style={heading}>Choose the Right Display for Every Customer.</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: INK_MUTED, marginTop: 16 }}>
              From compact meeting rooms to large lecture and presentation environments, our range gives
              resellers the flexibility to match the right display to every project — one platform, one
              accessory set, one support programme.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0 56px' }}>
            <div
              role="tablist"
              aria-label="Screen size"
              style={{
                position: 'relative', display: 'inline-grid',
                gridTemplateColumns: `repeat(${CONFIGS.length}, 1fr)`,
                padding: 4, borderRadius: 999,
                border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 8px 24px rgba(15,15,20,0.06)',
              }}
            >
              {/* Sliding active indicator */}
              <div aria-hidden style={{
                gridColumn: 1, gridRow: 1, borderRadius: 999, background: NAVY,
                transform: `translateX(${activeIndex * 100}%)`,
                transition: 'transform 500ms cubic-bezier(0.16,1,0.3,1)',
              }} />
              {CONFIGS.map((c, i) => (
                <button
                  key={c.size}
                  role="tab"
                  aria-selected={i === activeIndex}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    gridColumn: i + 1, gridRow: 1, position: 'relative', zIndex: 1,
                    padding: '10px 20px', minWidth: 60, border: 'none', background: 'transparent',
                    cursor: 'pointer', fontSize: 14, fontWeight: 700,
                    color: i === activeIndex ? NAVY_FOREGROUND : INK_MUTED,
                    transition: 'color 0.3s',
                  }}
                >
                  {c.size}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="iscreens-config-grid">
          {/* Left — glassmorphic display mockup */}
          <Reveal delay={0.15}>
            <div style={{
              position: 'relative', overflow: 'hidden', borderRadius: 28,
              background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: `1px solid ${HAIRLINE}`, boxShadow: '0 24px 64px rgba(15,15,20,0.10)',
              padding: 'clamp(32px,5vw,56px) clamp(20px,4vw,40px) 40px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 420,
            }}>
              {/* Subtle grid background, faded at the edges */}
              <div aria-hidden style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(${HAIRLINE} 1px, transparent 1px), linear-gradient(90deg, ${HAIRLINE} 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
                maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 78%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 78%)',
              }} />

              {/* Width guide */}
              <div style={{ position: 'relative', width: '100%', maxWidth: 480, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span aria-hidden style={{ width: 1, height: 14, background: HAIRLINE_STRONG }} />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: INK_MUTED, letterSpacing: '0.06em' }}>
                    {active.dims.split(' × ')[0]} wide
                  </span>
                  <span aria-hidden style={{ width: 1, height: 14, background: HAIRLINE_STRONG }} />
                </div>
                <div aria-hidden style={{ height: 1, background: HAIRLINE_STRONG, marginTop: 4 }} />
              </div>

              {/* Display + stand */}
              <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  position: 'relative', width: `${active.ratio * 100}%`, maxWidth: 480,
                  transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
                  aspectRatio: '16/10', borderRadius: 16, background: NAVY, padding: 9,
                  boxShadow: '0 20px 44px rgba(53,67,128,0.28)',
                }}>
                  <div className="config-display-frame" style={{
                    width: '100%', height: '100%', borderRadius: 9,
                    background: 'linear-gradient(150deg, #4a5a9e 0%, #22284a 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 4,
                  }}>
                    <div aria-hidden style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }} />
                    <span style={{ position: 'relative', fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(20px,2.6vw,34px)', fontWeight: 800, color: '#fff' }}>
                      {active.size}
                    </span>
                    <span style={{ position: 'relative', fontSize: 12, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.03em' }}>
                      4K Ultra HD · 20-point touch
                    </span>
                    <div aria-hidden className="config-sheen" />
                  </div>
                </div>

                {/* Stand */}
                <div aria-hidden style={{ width: 10, height: 32, background: HAIRLINE_STRONG, marginTop: -1 }} />
                <div aria-hidden style={{ width: 150, height: 8, borderRadius: 4, background: HAIRLINE_STRONG }} />
              </div>
            </div>
          </Reveal>

          {/* Right — stat cards, spec table, CTA */}
          <Reveal delay={0.25}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <StatCard label="Diagonal" value={active.size} />
                <StatCard label="Audience" value={active.seats} />
              </div>

              <div style={{ borderRadius: 20, border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.65)', overflow: 'hidden' }}>
                <dl style={{ margin: 0 }}>
                  {specRows.map(([label, value], i) => (
                    <SpecRow key={label} label={label} value={value} first={i === 0} odd={i % 2 === 1} />
                  ))}
                </dl>
              </div>

              <button
                onClick={() => setQuoteOpen(true)}
                className="config-cta"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '15px 26px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: ORANGE, color: ORANGE_FOREGROUND, fontSize: 14, fontWeight: 700,
                  boxShadow: '0 14px 30px rgba(245,158,11,0.35)',
                  alignSelf: 'flex-start',
                }}
              >
                Discuss the {active.size} Model
                <ArrowRight size={16} className="config-cta-arrow" />
              </button>
            </div>
          </Reveal>
        </div>
      </div>

      <QuoteRequestModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        initialSize={active.size}
        sizes={CONFIGS.map(c => c.size)}
      />
    </section>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{
      borderRadius: 16, border: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: '16px 18px',
    }}>
      <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_MUTED, marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 20, fontWeight: 800, color: INK }}>
        {value}
      </p>
    </div>
  )
}

function SpecRow({ label, value, first, odd }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', gap: 16, padding: '13px 18px',
        borderTop: first ? 'none' : `1px solid ${HAIRLINE}`,
        background: hover ? 'rgba(15,15,20,0.05)' : odd ? 'rgba(15,15,20,0.02)' : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      <dt style={{ fontSize: 12.5, color: INK_MUTED, fontWeight: 600, flexShrink: 0 }}>{label}</dt>
      <dd style={{ margin: 0, fontFamily: '"Space Grotesk",sans-serif', fontSize: 13, fontWeight: 700, color: INK, textAlign: 'right' }}>{value}</dd>
    </div>
  )
}
