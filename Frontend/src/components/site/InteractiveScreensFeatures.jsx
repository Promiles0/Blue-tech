import { useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { Hand, PenTool, Camera, Cast, Users } from 'lucide-react'

const FEATURES = [
  {
    icon: Hand,
    title: 'Touch input',
    desc: 'Responsive multi-touch built for fingers, not just a stylus — swipe, pinch, and draw exactly like you would on a phone, just bigger.',
  },
  {
    icon: PenTool,
    title: 'Stylus support',
    desc: 'Pressure-sensitive pen input for precise annotation, sketching, and handwritten notes that actually look handwritten.',
  },
  {
    icon: Camera,
    title: 'Built-in camera & mic',
    desc: 'An integrated camera and far-field microphone array make every meeting or lesson video-call ready — no extra hardware to wheel in.',
  },
  {
    icon: Cast,
    title: 'Screen mirroring',
    desc: 'Cast from a laptop, tablet, or phone in seconds. No cables, no adapters, no "can everyone see my screen?"',
  },
  {
    icon: Users,
    title: 'Collaboration tools',
    desc: 'Shared whiteboards, cloud sync, and multi-user annotation keep everyone — in the room or remote — on the same page.',
  },
]

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }
const heading = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }

export default function InteractiveScreensFeatures() {
  const reduce = useReducedMotion()

  // Reduced motion: skip the scroll-jacked pin entirely and render a plain
  // stacked list, so nothing here depends on scroll-position math.
  if (reduce) {
    return (
      <section style={{ padding: 'clamp(56px,8vw,96px) 0' }}>
        <div className="container-noir">
          <p style={eyebrow}>How it works</p>
          <h2 style={{ ...heading, marginBottom: 32 }}>Everything a room needs, built in.</h2>
          <div style={{ display: 'grid', gap: 28 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)' }}>
                  <f.icon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', maxWidth: 480 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return <StickyWalkthrough />
}

function StickyWalkthrough() {
  const containerRef = useRef(null)
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(FEATURES.length - 1, Math.max(0, Math.floor(v * FEATURES.length)))
    setActive(idx)
  })

  const current   = FEATURES[active]
  const ActiveIcon = current.icon

  return (
    <section ref={containerRef} style={{ position: 'relative', height: `${FEATURES.length * 90}vh` }}>
      <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div className="container-noir iscreens-split">
          {/* Pinned visual */}
          <div style={{
            position: 'relative', aspectRatio: '4/3', borderRadius: 24, overflow: 'hidden',
            background: 'linear-gradient(150deg, #12142a 0%, #22284a 55%, #354380 100%)',
            border: '1px solid var(--border)',
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ActiveIcon size={96} strokeWidth={1.1} color="rgba(255,255,255,0.85)" />
              </motion.div>
            </AnimatePresence>

            <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
              {FEATURES.map((_, i) => (
                <span key={i} style={{
                  width: i === active ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === active ? '#fff' : 'rgba(255,255,255,0.3)',
                  transition: 'width 0.3s ease, background 0.3s ease',
                }} />
              ))}
            </div>
          </div>

          {/* Text callouts */}
          <div style={{ position: 'relative', minHeight: 180 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <p style={{ ...eyebrow, color: 'var(--accent-light)' }}>
                  {String(active + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
                </p>
                <h3 style={{ ...heading, fontSize: 'clamp(26px,3vw,38px)', marginBottom: 14 }}>
                  {current.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', maxWidth: 420 }}>
                  {current.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
