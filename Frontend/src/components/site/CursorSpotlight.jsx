import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

const SIZE = 640

export default function CursorSpotlight() {
  const reduce = useReducedMotion()
  const rawX   = useMotionValue(-SIZE)
  const rawY   = useMotionValue(-SIZE)
  const x      = useSpring(rawX, { stiffness: 120, damping: 22, mass: 0.4 })
  const y      = useSpring(rawY, { stiffness: 120, damping: 22, mass: 0.4 })

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

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(124,92,240,0.28) 0%, rgba(124,92,240,0.14) 30%, rgba(124,92,240,0.05) 55%, transparent 75%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        zIndex: 0,
        x,
        y,
      }}
    />
  )
}
