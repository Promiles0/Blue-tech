import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Logo from './Logo'

const REVEAL_HOLD_MS = 900
const REDUCED_MOTION_HOLD_MS = 300
const PROGRESS_CAP = 94
const PROGRESS_TICK_MS = 100
const PROGRESS_EASE = 0.12

// Full-screen preloader. Theme-correct with zero extra logic — `data-theme` is
// already set on <html> (Frontend/index.html) before React mounts, so `var(--bg-page)` /
// `var(--text)` just resolve correctly on first paint.
//
// The fade-out is driven explicitly (animate opacity + onAnimationComplete) rather than via
// AnimatePresence's unmount-detection, so it can't silently skip the transition — the parent
// (App.jsx's SplashGate) only stops rendering this component once onExited actually fires.
export default function SplashScreen({ exiting, onTypingDone, onExited }) {
  const reduce = useReducedMotion()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => onTypingDone?.(), reduce ? REDUCED_MOTION_HOLD_MS : REVEAL_HOLD_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce])

  // There's no real multi-step loading signal to report (SplashGate only has one boolean),
  // so this eases toward PROGRESS_CAP while waiting and snaps to 100 the instant `exiting`
  // (the real completion signal) fires, rather than reaching 100 on a fake timer.
  useEffect(() => {
    if (reduce) return
    if (exiting) { setProgress(100); return }
    const id = setInterval(() => {
      setProgress(p => p + (PROGRESS_CAP - p) * PROGRESS_EASE)
    }, PROGRESS_TICK_MS)
    return () => clearInterval(id)
  }, [reduce, exiting])

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
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
      >
        <Logo height="clamp(32px, 6vw, 56px)" />

        {!reduce && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 140, height: 2, borderRadius: 1, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`, height: '100%', borderRadius: 1,
                background: 'var(--accent)',
                transition: 'width 120ms linear',
              }} />
            </div>
            <span style={{
              fontSize: 11, color: 'var(--muted)', letterSpacing: '0.05em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
