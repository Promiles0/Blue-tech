import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { GraduationCap, Building2 } from 'lucide-react'

// TODO: swap these gradient/icon placeholders for real photography —
// classroom (teacher presenting, students engaging) and office (team
// collaborating, video call on screen) shots respectively.
const USE_CASES = {
  education: {
    label: 'Education',
    icon: GraduationCap,
    gradient: 'linear-gradient(150deg, #12142a 0%, #22284a 55%, #354380 100%)',
    copy: "Turn a lesson plan into something students actually touch — annotate slides live, pull up a diagram the whole class can point at, and mirror any student's tablet to the front of the room in one tap.",
  },
  business: {
    label: 'Business',
    icon: Building2,
    gradient: 'linear-gradient(150deg, #161c3a 0%, #2a3568 55%, #5a73b0 100%)',
    copy: "Run the meeting from the screen, not around it — sketch on a shared whiteboard, drop a video call straight onto the display, and pick up exactly where the last session left off.",
  },
}

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }
const heading = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }

export default function InteractiveScreensUseCases() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState('education')
  const current = USE_CASES[active]
  const Icon = current.icon

  return (
    <section style={{ padding: 'clamp(56px,8vw,100px) 0' }}>
      <div className="container-noir">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={eyebrow}>Where it fits</p>
          <h2 style={heading}>Built for however you use it.</h2>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 100 }}>
            {Object.entries(USE_CASES).map(([key, uc]) => {
              const isActive = active === key
              return (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  aria-pressed={isActive}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 22px', borderRadius: 100, border: 'none',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--muted)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.25s, color 0.25s',
                  }}
                >
                  <uc.icon size={14} /> {uc.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="iscreens-split">
          {/* Image panel */}
          <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? {} : { opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ position: 'absolute', inset: 0, background: current.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon size={88} strokeWidth={1.05} color="rgba(255,255,255,0.8)" />
              </motion.div>
            </AnimatePresence>
            <div style={{
              position: 'absolute', top: 14, left: 14, zIndex: 1,
              background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 100, padding: '4px 11px', fontSize: 10.5, fontWeight: 500,
              color: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)',
            }}>
              Placeholder — swap in real photography
            </div>
          </div>

          {/* Copy */}
          <div style={{ position: 'relative', minHeight: 140 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? {} : { opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <h3 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(22px,2.6vw,28px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 14 }}>
                  {current.label} mode
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', maxWidth: 440 }}>
                  {current.copy}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
