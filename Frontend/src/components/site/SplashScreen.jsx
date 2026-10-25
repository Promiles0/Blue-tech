import { useEffect, useState } from 'react'
import { m as motion, useReducedMotion } from 'framer-motion'
import { LogoSymbol } from './Logo'
import {
  SYMBOL_VIEWBOX, SYMBOL_ASPECT, SYMBOL_STROKE, BLUE_DEEP, BLUE_SKY, MIDDLE_BAR,
} from './logoSymbol'

const WORDMARK_HOLD_MS = 500
const FALLBACK_HOLD_MS = 4000
const REDUCED_MOTION_HOLD_MS = 300
const DRAW_S = 0.7
const BAR_S = 0.3

// The two loops traced from the middle diagonal outward (the reverse of
// LOOP_LEFT / LOOP_RIGHT), so the draw-in starts at the centre of the symbol.
const DRAW_LEFT = 'M 383 255.8 L 289.9 348.9 A 55 55 0 1 1 286.4 267.9'
const DRAW_RIGHT = 'M 366 364.2 L 459.1 271.1 A 55 55 0 1 1 462.6 352.1'

function Wordmark() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
      <span style={{
        fontFamily: '"Montserrat", var(--font-sans)', fontWeight: 600,
        fontSize: 'clamp(22px, 4vw, 34px)', letterSpacing: '0.08em', lineHeight: 1,
      }}>BLUETECH</span>
      <span style={{
        fontFamily: '"Montserrat", var(--font-sans)', fontWeight: 500,
        fontSize: 'clamp(10px, 1.4vw, 13px)', letterSpacing: '0.45em', paddingLeft: '0.45em', lineHeight: 1,
      }}>LTD</span>
    </div>
  )
}

// Full-screen preloader. Theme-correct with zero extra logic — `data-theme` is
// already set on <html> (Frontend/index.html) before React mounts, so `var(--bg-page)` /
// `var(--text)` just resolve correctly on first paint.
//
// The fade-out is driven explicitly (animate opacity + onAnimationComplete) rather than via
// AnimatePresence's unmount-detection, so it can't silently skip the transition — the parent
// (App.jsx's SplashGate) only stops rendering this component once onExited actually fires.
export default function SplashScreen({ exiting, onTypingDone, onExited }) {
  const reduce = useReducedMotion()
  // Once the intro has played, the symbol "breathes" until the app is ready.
  // The intro is timed from the middle bar's animation actually finishing (the
  // motion features load lazily, so a mount-time timer could cut the draw short),
  // with a fallback in case the animation never reports back.
  const [done, setDone] = useState(false)
  const finish = () => {
    if (done) return
    setDone(true)
    onTypingDone?.()
  }

  useEffect(() => {
    const t = setTimeout(finish, reduce ? REDUCED_MOTION_HOLD_MS : FALLBACK_HOLD_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: reduce ? 0 : 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      onAnimationComplete={() => { if (exiting) onExited?.() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-page)',
        pointerEvents: exiting ? 'none' : 'auto',
      }}
    >
      {reduce ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <LogoSymbol height="clamp(56px, 11vw, 96px)" />
          <Wordmark />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <motion.svg
            viewBox={SYMBOL_VIEWBOX}
            fill="none"
            strokeWidth={SYMBOL_STROKE}
            strokeLinecap="round"
            aria-label="Blue-Tech"
            role="img"
            style={{ height: 'clamp(56px, 11vw, 96px)', aspectRatio: SYMBOL_ASPECT, overflow: 'visible' }}
            initial={{ filter: 'drop-shadow(0 0 0px rgba(68,142,205,0))' }}
            animate={{
              filter: [
                'drop-shadow(0 0 0px rgba(68,142,205,0))',
                'drop-shadow(0 0 18px rgba(68,142,205,0.7))',
                'drop-shadow(0 0 6px rgba(68,142,205,0.25))',
              ],
            }}
            transition={{ delay: DRAW_S + BAR_S, duration: 0.6, ease: 'easeOut' }}
          >
            <defs>
              <linearGradient id="splash-grad" gradientUnits="userSpaceOnUse" x1="185" y1="0" x2="564" y2="0">
                <stop offset="0" stopColor={BLUE_DEEP} />
                <stop offset="1" stopColor={BLUE_SKY} />
              </linearGradient>
            </defs>
            <motion.g
              stroke="url(#splash-grad)"
              animate={done ? { opacity: [1, 0.72, 1] } : undefined}
              transition={done ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
              {[DRAW_LEFT, DRAW_RIGHT].map(d => (
                <motion.path
                  key={d}
                  d={d}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: DRAW_S, ease: [0.65, 0, 0.35, 1] }}
                />
              ))}
              <motion.path
                d={MIDDLE_BAR}
                initial={{ opacity: 0, x: 40, y: -40 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: DRAW_S * 0.85, type: 'spring', stiffness: 380, damping: 18 }}
                onAnimationComplete={() => setTimeout(finish, WORDMARK_HOLD_MS)}
              />
            </motion.g>
          </motion.svg>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: DRAW_S + BAR_S, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Wordmark />
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
