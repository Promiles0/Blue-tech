import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Logo from './Logo'

const REVEAL_HOLD_MS = 900
const REDUCED_MOTION_HOLD_MS = 300

// Full-screen preloader. Theme-correct with zero extra logic — `data-theme` is
// already set on <html> (Frontend/index.html) before React mounts, so `var(--bg-page)` /
// `var(--text)` just resolve correctly on first paint.
//
// The fade-out is driven explicitly (animate opacity + onAnimationComplete) rather than via
// AnimatePresence's unmount-detection, so it can't silently skip the transition — the parent
// (App.jsx's SplashGate) only stops rendering this component once onExited actually fires.
export default function SplashScreen({ exiting, onTypingDone, onExited }) {
  const reduce = useReducedMotion()

  useEffect(() => {
    const t = setTimeout(() => onTypingDone?.(), reduce ? REDUCED_MOTION_HOLD_MS : REVEAL_HOLD_MS)
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
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Logo height="clamp(32px, 6vw, 56px)" />
      </motion.div>
    </motion.div>
  )
}
