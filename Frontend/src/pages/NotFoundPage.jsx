import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Home } from 'lucide-react'

export default function NotFoundPage() {
  const reduce = useReducedMotion()

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Ambient orbs */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div className="orb-1" style={{ position: 'absolute', top: '10%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(124,92,240,0.07)', filter: 'blur(90px)' }} />
        <div className="orb-2" style={{ position: 'absolute', bottom: '10%', right: '10%', width: 360, height: 360, borderRadius: '50%', background: 'rgba(124,92,240,0.05)', filter: 'blur(80px)' }} />
      </div>

      {/* Glowing 404 */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ position: 'relative', marginBottom: 28 }}
      >
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle, rgba(124,92,240,0.22) 0%, transparent 70%)',
          filter: 'blur(40px)', transform: 'scale(2.2)',
        }} />
        <p style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: 'clamp(88px, 18vw, 152px)',
          fontWeight: 900, lineHeight: 1,
          letterSpacing: '-0.04em',
          position: 'relative',
          background: 'linear-gradient(135deg, #7c5cf0 0%, #a78bfa 50%, #7c5cf0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          404
        </p>
      </motion.div>

      {/* Label */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid #1e1e1e', borderRadius: 100,
          padding: '5px 14px', marginBottom: 20,
          fontSize: 12, color: '#555',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'block' }} />
        Page not found
      </motion.div>

      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.4 }}
        style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 800, marginBottom: 12,
          letterSpacing: '-0.02em',
        }}
      >
        Looks like you've gone off-grid
      </motion.h1>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34, duration: 0.4 }}
        style={{ color: '#666', fontSize: 15, lineHeight: 1.7, maxWidth: 360, marginBottom: 44 }}
      >
        The page you're looking for doesn't exist or has been moved.
        Let's get you back somewhere familiar.
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.4 }}
        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <Link
          to="/"
          className="noir-btn-primary shine"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Home size={15} /> Go home
        </Link>
        <Link
          to="/products"
          className="noir-btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <ArrowLeft size={15} /> Browse products
        </Link>
      </motion.div>
    </div>
  )
}
