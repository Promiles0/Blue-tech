import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const SIZE = 640

export default function CursorSpotlight() {
  const reduce      = useReducedMotion()
  const { theme }   = useTheme()
  const rawX        = useMotionValue(-SIZE)
  const rawY        = useMotionValue(-SIZE)
  const x           = useSpring(rawX, { stiffness: 120, damping: 22, mass: 0.4 })
  const y           = useSpring(rawY, { stiffness: 120, damping: 22, mass: 0.4 })

  useEffect(() => {
    if (reduce) return
    if (window.matchMedia('(hover: none)').matches) return
    const onMove = (e) => {
      rawX.set(e.clientX - SIZE / 2)
      rawY.set(e.clientY - SIZE / 2)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduce, rawX, rawY])

  if (reduce) return null

  const isLight = theme === 'light'

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        background: isLight
          ? 'radial-gradient(circle, rgba(0,12,123,0.14) 20%, rgba(0,12,123,0.14) 30%, rgba(109,40,217,0.03) 50%, transparent 75%)'
          : 'radial-gradient(circle, var(--accent-border) 0%, var(--accent-dim2) 30%, var(--accent-dim) 55%, transparent 75%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        mixBlendMode: isLight ? 'multiply' : 'screen',
        zIndex: 0,
        x,
        y,
      }}
    />
  )
}
