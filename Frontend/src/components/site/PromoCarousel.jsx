import { useLayoutEffect, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { PROMO_SLIDES } from '../../lib/promoSlides'

const PEEK = 32   // px of the next slide visible at the right edge
const GAP  = 10   // px gap between slides
const SLIDE_HEIGHT = 304  // ~2x the old 152px so it reads as a real display screen
const AUTO_ADVANCE_MS = 3000

export default function PromoCarousel() {
  const reduce = useReducedMotion()
  const wrapperRef = useRef(null)
  const draggedRef  = useRef(false)
  const [width, setWidth]     = useState(0)
  const [index, setIndex]     = useState(0)
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)

  // Layout effect (fires before paint) so the track is never briefly
  // rendered at a wrong fallback width — it measures the real container
  // width first, and we don't render the slide track at all until then.
  useLayoutEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const measure = () => setWidth(el.offsetWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const slideWidth = Math.max(width - PEEK - GAP, 0)
  const step = slideWidth + GAP
  const maxIndex = PROMO_SLIDES.length - 1

  // Auto-advance — paused on hover, mid-drag, or reduced motion
  useEffect(() => {
    if (reduce || hovered || dragging || slideWidth === 0) return
    const id = setInterval(() => setIndex(i => (i + 1) % PROMO_SLIDES.length), AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [reduce, hovered, dragging, slideWidth])

  const goTo = (i) => setIndex(Math.min(Math.max(i, 0), maxIndex))

  const handleDragEnd = (_e, info) => {
    setDragging(false)
    const threshold = slideWidth * 0.2
    if (info.offset.x < -threshold || info.velocity.x < -400) goTo(index + 1)
    else if (info.offset.x > threshold || info.velocity.x > 400) goTo(index - 1)

    if (Math.abs(info.offset.x) > 10) {
      draggedRef.current = true
      setTimeout(() => { draggedRef.current = false }, 50)
    }
  }

  return (
    <section style={{ padding: '12px 0 8px' }}>
      <div className="container-noir">
        <div
          ref={wrapperRef}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{ position: 'relative', overflow: 'hidden', borderRadius: 16 }}
        >
          {slideWidth === 0 ? (
            // Not measured yet — hold the slot at the right height so
            // nothing jumps, but never paint the track at a wrong width.
            <div className="skeleton" style={{ height: SLIDE_HEIGHT, borderRadius: 14 }} />
          ) : (
            <motion.div
              drag="x"
              dragConstraints={{ left: -(step * maxIndex), right: 0 }}
              dragElastic={0.12}
              onDragStart={() => setDragging(true)}
              onDragEnd={handleDragEnd}
              animate={{ x: -index * step }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ display: 'flex', cursor: 'grab' }}
            >
              {PROMO_SLIDES.map((slide, i) => (
                <Link
                  key={slide.slug}
                  to={`/promotions/${slide.slug}`}
                  draggable={false}
                  onClick={e => { if (draggedRef.current) e.preventDefault() }}
                  style={{
                    position: 'relative', flexShrink: 0,
                    width: slideWidth, height: SLIDE_HEIGHT,
                    marginRight: i === PROMO_SLIDES.length - 1 ? 0 : GAP,
                    borderRadius: 14, overflow: 'hidden',
                    background: slide.gradient,
                    display: 'block', textDecoration: 'none',
                    userSelect: 'none',
                  }}
                >
                  {slide.image && (
                    <img
                      src={slide.image}
                      alt=""
                      draggable={false}
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%', objectFit: 'cover',
                      }}
                    />
                  )}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)',
                    pointerEvents: 'none',
                  }} />
                  <div style={{ position: 'absolute', left: 22, right: 22, bottom: 18 }}>
                    <p style={{
                      fontFamily: '"Space Grotesk",sans-serif',
                      fontSize: 19, fontWeight: 800, letterSpacing: '-0.01em',
                      color: '#fff', marginBottom: 4, lineHeight: 1.2,
                    }}>
                      {slide.title}
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                      {slide.subtitle}
                    </p>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </div>

        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 6 }}>
          {PROMO_SLIDES.map((slide, i) => (
            <button
              key={slide.slug}
              onClick={() => goTo(i)}
              aria-label={`Go to promotion ${i + 1} of ${PROMO_SLIDES.length}`}
              aria-current={i === index}
              style={{
                width: i === index ? 20 : 6, height: 6, borderRadius: 3,
                background: i === index ? 'var(--accent)' : 'var(--border-strong)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'width 0.3s ease, background 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
