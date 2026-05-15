import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import apiService from '../../api/service'

const FALLBACK_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
    name: 'Premium Headphones',
    price: 299,
  },
  {
    url: 'https://images.unsplash.com/photo-1523275335684-37628165f2bd?q=80&w=1000&auto=format&fit=crop',
    name: 'Smart Watch',
    price: 449,
  },
  {
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1000&auto=format&fit=crop',
    name: 'Instant Camera',
    price: 89,
  },
  {
    url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1000&auto=format&fit=crop',
    name: 'Laptop',
    price: 1299,
  },
  {
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1000&auto=format&fit=crop',
    name: 'Wireless Earbuds',
    price: 199,
  },
]

const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? '100%' : '-100%',
    scale: 1.08,
    opacity: 0,
  }),
  center: {
    x: 0,
    scale: 1,
    opacity: 1,
  },
  exit: (dir) => ({
    x: dir > 0 ? '-60%' : '60%',
    scale: 0.92,
    opacity: 0,
  }),
}

const LIQUID_GLASS = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '50%',
  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
}

export default function HeroCarousel() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const [arrowsVisible, setArrowsVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const resumeTimer = useRef(null)
  const touchStartX = useRef(null)

  useEffect(() => {
    apiService.products.getNewest(5)
      .then(({ data }) => {
        const products = data?.content ?? (Array.isArray(data) ? data : [])
        if (products.length > 0) {
          setSlides(products.map(p => ({
            url: p.primaryImageUrl ?? null,
            name: p.name,
            price: p.startingPrice ?? p.price ?? 0,
          })))
        } else {
          setSlides(FALLBACK_SLIDES)
        }
      })
      .catch(() => setSlides(FALLBACK_SLIDES))
      .finally(() => setLoading(false))
  }, [])

  const goTo = useCallback((index) => {
    if (index === current || slides.length === 0) return
    setDirection(index > current ? 1 : -1)
    setCurrent(index)
  }, [current, slides.length])

  const next = useCallback(() => {
    if (slides.length === 0) return
    setDirection(1)
    setCurrent(c => (c + 1) % slides.length)
  }, [slides.length])

  const prev = useCallback(() => {
    if (slides.length === 0) return
    setDirection(-1)
    setCurrent(c => (c - 1 + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (paused || slides.length === 0) return
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [paused, next, slides.length])

  // Progress bar — state-driven so it always animates correctly
  useEffect(() => {
    setProgress(0)
    if (paused || slides.length === 0) return
    const start = Date.now()
    const id = setInterval(() => {
      const pct = Math.min((Date.now() - start) / 4000, 1)
      setProgress(pct)
      if (pct >= 1) clearInterval(id)
    }, 50)
    return () => clearInterval(id)
  }, [current, paused, slides.length])

  const handleMouseEnter = () => {
    setArrowsVisible(true)
    setPaused(true)
  }

  const handleMouseLeave = () => {
    setArrowsVisible(false)
    setPaused(false)
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    clearTimeout(resumeTimer.current)
    setPaused(true)
    setArrowsVisible(true)
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) >= 50) {
      delta > 0 ? next() : prev()
    }
    touchStartX.current = null
    resumeTimer.current = setTimeout(() => {
      setArrowsVisible(false)
      setPaused(false)
    }, 2000)
  }

  if (loading) {
    return (
      <div style={{
        aspectRatio: '4/5', borderRadius: 16,
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
      }} />
    )
  }

  const slide = slides[current]

  return (
    <div
      style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '4/5', background: '#111' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {slide.url ? (
            <motion.img
              src={slide.url}
              alt={slide.name}
              initial={{ scale: 1.06 }}
              animate={{ scale: 1.14 }}
              transition={{ duration: 9, ease: 'linear' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', background: '#1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#333', fontSize: 13 }}>No image available</span>
            </div>
          )}

          {/* Bottom gradient for text legibility */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 38%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          {/* Product name + price */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            style={{ position: 'absolute', bottom: 52, left: 20, right: 20 }}
          >
            <p style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: 18, fontWeight: 700, color: '#fff',
              marginBottom: 4, lineHeight: 1.3,
              textShadow: '0 1px 8px rgba(0,0,0,0.6)',
            }}>
              {slide.name}
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#f59e0b' }}>
              ${parseFloat(slide.price).toFixed(0)}
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Left arrow — liquid glass, visible on hover/touch */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        style={{
          ...LIQUID_GLASS,
          position: 'absolute', left: 12, top: '50%',
          transform: 'translateY(-50%)',
          color: '#fff', width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10, padding: 0,
          opacity: arrowsVisible ? 1 : 0,
          transition: 'opacity 0.3s ease, background 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
      >
        <ChevronLeft size={18} />
      </button>

      {/* Right arrow — liquid glass, visible on hover/touch */}
      <button
        onClick={next}
        aria-label="Next slide"
        style={{
          ...LIQUID_GLASS,
          position: 'absolute', right: 12, top: '50%',
          transform: 'translateY(-50%)',
          color: '#fff', width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10, padding: 0,
          opacity: arrowsVisible ? 1 : 0,
          transition: 'opacity 0.3s ease, background 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators — liquid glass container */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 6, zIndex: 10,
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 999,
        padding: '6px 12px',
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === current ? 22 : 6,
              height: 6,
              borderRadius: 3,
              background: i === current ? '#7c5cf0' : 'rgba(255,255,255,0.28)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.35s ease, background 0.25s ease',
            }}
          />
        ))}
      </div>

      {/* Progress bar — width driven by state so it always moves */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 2, zIndex: 10,
        background: 'rgba(255,255,255,0.08)',
      }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: '#7c5cf0',
          transition: 'width 50ms linear',
        }} />
      </div>
    </div>
  )
}
