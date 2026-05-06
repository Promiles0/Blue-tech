import { motion } from 'framer-motion'

const ORB_VARIANTS = [
  { size: 380, x: '60%', y: '10%',  color: 'radial-gradient(circle, rgba(124,92,240,0.35) 0%, transparent 70%)', dur: 18 },
  { size: 260, x: '10%', y: '55%',  color: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)',  dur: 24 },
  { size: 200, x: '75%', y: '70%',  color: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', dur: 20 },
]

const SILHOUETTES = [
  { top: '18%', left: '22%', w: 64, h: 110, delay: 0 },
  { top: '52%', left: '60%', w: 48, h: 84,  delay: 0.4 },
  { top: '30%', left: '65%', w: 36, h: 60,  delay: 0.8 },
]

export default function AuthArtwork() {
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #080808 0%, #0e0814 50%, #080808 100%)',
      overflow: 'hidden',
    }}>
      {/* Animated mesh orbs */}
      {ORB_VARIANTS.map((orb, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: orb.size, height: orb.size,
            left: orb.x, top: orb.y,
            background: orb.color,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(2px)',
          }}
          animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0] }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Floating silhouette shapes */}
      {SILHOUETTES.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute', top: s.top, left: s.left,
            width: s.w, height: s.h,
            background: 'rgba(124,92,240,0.07)',
            border: '1px solid rgba(124,92,240,0.12)',
            borderRadius: 8,
            backdropFilter: 'blur(2px)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -10, 0] }}
          transition={{ delay: s.delay, duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Brand mark */}
      <div style={{
        position: 'absolute', bottom: 40, left: 40,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c5cf0', display: 'block' }} />
          <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.14em', color: '#fff' }}>NOIR</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', maxWidth: 160, lineHeight: 1.6 }}>
          Dark-luxury shopping, redefined.
        </p>
      </div>
    </div>
  )
}
