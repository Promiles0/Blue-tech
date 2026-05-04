/**
 * NOIR Motion Primitives
 * All animations are gated behind useReducedMotion() per WCAG 2.1.
 * GPU-only: only transform and opacity are animated — never top/left/width.
 */
import { useRef, useEffect, useState } from 'react'
import {
  motion,
  useReducedMotion,
  useInView,
  useSpring,
  useTransform,
  useMotionValue,
  animate,
} from 'framer-motion'

// ── RevealStagger ─────────────────────────────────────────────────────────────
// Wraps an array of children and staggers their fade+lift on scroll-into-view.
// The wrapper element inherits any className/style (e.g. "grid-4").
export function RevealStagger({ children, stagger = 0.06, delay = 0, duration = 0.5, className, style }) {
  const ref    = useRef(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration, ease: [0.25, 0.1, 0.25, 1] } },
  }

  if (reduce) {
    return <div ref={ref} className={className} style={style}>{children}</div>
  }

  const childArray = Array.isArray(children) ? children : (children ? [children] : [])

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {childArray.map((child, i) =>
        child ? (
          <motion.div key={child?.key ?? i} variants={itemVariants}>
            {child}
          </motion.div>
        ) : null
      )}
    </motion.div>
  )
}

// ── Reveal ────────────────────────────────────────────────────────────────────
// Fade + lift on scroll-into-view, fires once.
export function Reveal({ children, delay = 0, duration = 0.5, className, style }) {
  const ref    = useRef(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ── Parallax ──────────────────────────────────────────────────────────────────
// translateY based on scroll progress within the viewport.
export function Parallax({ children, speed = 0.15, className, style }) {
  const ref    = useRef(null)
  const reduce = useReducedMotion()
  const y      = useMotionValue(0)

  useEffect(() => {
    if (reduce) return
    function onScroll() {
      const el   = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh   = window.innerHeight
      const pct  = (vh / 2 - rect.top - rect.height / 2) / vh
      y.set(pct * speed * 120)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduce, speed, y])

  return (
    <motion.div ref={ref} className={className} style={{ ...style, y: reduce ? 0 : y }}>
      {children}
    </motion.div>
  )
}

// ── Magnetic ──────────────────────────────────────────────────────────────────
// Element follows the cursor when hovered within its bounding radius.
export function Magnetic({ children, strength = 0.35, className, style }) {
  const ref    = useRef(null)
  const reduce = useReducedMotion()
  const x      = useSpring(0, { stiffness: 200, damping: 18 })
  const y      = useSpring(0, { stiffness: 200, damping: 18 })

  function onMove(e) {
    if (reduce || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx   = rect.left + rect.width  / 2
    const cy   = rect.top  + rect.height / 2
    x.set((e.clientX - cx) * strength)
    y.set((e.clientY - cy) * strength)
  }

  function onLeave() { x.set(0); y.set(0) }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, x: reduce ? 0 : x, y: reduce ? 0 : y }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  )
}

// ── Tilt ──────────────────────────────────────────────────────────────────────
// 3-D perspective rotation on hover.
export function Tilt({ children, max = 12, className, style }) {
  const ref    = useRef(null)
  const reduce = useReducedMotion()
  const rotX   = useSpring(0, { stiffness: 200, damping: 20 })
  const rotY   = useSpring(0, { stiffness: 200, damping: 20 })

  function onMove(e) {
    if (reduce || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px   = (e.clientX - rect.left) / rect.width  - 0.5
    const py   = (e.clientY - rect.top)  / rect.height - 0.5
    rotY.set(px *  max)
    rotX.set(py * -max)
  }

  function onLeave() { rotX.set(0); rotY.set(0) }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        perspective: 800,
        rotateX: reduce ? 0 : rotX,
        rotateY: reduce ? 0 : rotY,
      }}
    >
      {children}
    </motion.div>
  )
}

// ── CountUp ───────────────────────────────────────────────────────────────────
// Animated number counter that fires when scrolled into view.
export function CountUp({ to, duration = 1.5, prefix = '', suffix = '', className, decimals = 0 }) {
  const ref    = useRef(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const fmt    = v => decimals > 0 ? Number(v).toFixed(decimals) : Math.round(v)
  const [display, setDisplay] = useState(reduce ? fmt(to) : fmt(0))

  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: v => setDisplay(fmt(v)),
    })
    return controls.stop
  }, [inView, reduce, to, duration]) // eslint-disable-line

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}
