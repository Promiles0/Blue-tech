import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const WORDMARK = 'Blue-Tech'
const TYPE_INTERVAL_MS = 100
const CARET_BLINKS_AFTER_DONE = 2
const CARET_BLINK_MS = 530
const REDUCED_MOTION_HOLD_MS = 300

// Full-screen typing-effect preloader. Theme-correct with zero extra logic — `data-theme` is
// already set on <html> (Frontend/index.html) before React mounts, so `var(--bg-page)` /
// `var(--text)` just resolve correctly on first paint.
//
// The fade-out is driven explicitly (animate opacity + onAnimationComplete) rather than via
// AnimatePresence's unmount-detection, so it can't silently skip the transition — the parent
// (App.jsx's SplashGate) only stops rendering this component once onExited actually fires.
export default function SplashScreen({ exiting, onTypingDone, onExited }) {
  const reduce = useReducedMotion()
  const [charCount, setCharCount] = useState(reduce ? WORDMARK.length : 0)

  useEffect(() => {
    if (reduce) {
      const t = setTimeout(() => onTypingDone?.(), REDUCED_MOTION_HOLD_MS)
      return () => clearTimeout(t)
    }

    let count = 0
    const typeId = setInterval(() => {
      count += 1
      setCharCount(count)
      if (count >= WORDMARK.length) {
        clearInterval(typeId)
        const doneDelay = CARET_BLINKS_AFTER_DONE * CARET_BLINK_MS
        setTimeout(() => onTypingDone?.(), doneDelay)
      }
    }, TYPE_INTERVAL_MS)

    return () => clearInterval(typeId)
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
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', display: 'block', flexShrink: 0 }} />
        <span style={{
          fontFamily: '"League Spartan", sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(32px, 6vw, 56px)',
          letterSpacing: '0.12em',
          color: 'var(--text)',
          whiteSpace: 'pre',
        }}>
          {WORDMARK.slice(0, charCount)}
          {!reduce && (
            <span
              aria-hidden
              style={{
                display: 'inline-block', width: 3, marginLeft: 2,
                background: 'var(--accent)',
                animation: `noir-splash-caret ${CARET_BLINK_MS}ms step-end infinite`,
                height: '0.85em', verticalAlign: '-0.1em',
              }}
            />
          )}
        </span>
      </motion.div>
      <style>{`
        @keyframes noir-splash-caret {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </motion.div>
  )
}
