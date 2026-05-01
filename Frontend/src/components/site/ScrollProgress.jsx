import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion'

export default function ScrollProgress() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 20 })

  if (reduce) return null

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 2,
        zIndex: 200,
        transformOrigin: '0%',
        scaleX,
        background: 'var(--gradient-primary)',
        pointerEvents: 'none',
      }}
    />
  )
}
