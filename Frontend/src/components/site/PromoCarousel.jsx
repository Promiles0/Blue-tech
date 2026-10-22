import { useLayoutEffect, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { m as motion, useReducedMotion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { PROMO_SLIDES } from '../../lib/promoSlides'
import apiService from '../../api/service'

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #12142a 0%, #22284a 55%, #354380 100%)'

// Slides come from Admin → Home banners; until any are added there, the built-in set shows.
function useHomeSlides() {
  const { data } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: () => apiService.heroSlides.getActive().then(r => (Array.isArray(r.data) ? r.data : [])),
    staleTime: 5 * 60 * 1000,
  })
  if (!data?.length) return PROMO_SLIDES
  return data.map(s => ({
    slug: `slide-${s.slideId}`, to: s.link || '/products', title: s.label, subtitle: s.subtitle,
    image: s.imageUrl, alt: s.altText, gradient: DEFAULT_GRADIENT,
  }))
}

const PEEK = 32   // px of the next slide visible at the right edge
const GAP  = 10   // px gap between slides
// Short, wide banner so the department tiles below still show on the first screen.
const slideHeightFor = (w) => Math.round(Math.min(Math.max(w * 0.24, 168), 236))
// Slow enough to read a slide; paused on hover, focus, drag and reduced motion.
const AUTO_ADVANCE_MS = 5500

export default function PromoCarousel() {
  const slides = useHomeSlides()
  const reduce = useReducedMotion()
  const wrapperRef = useRef(null)
  const draggedRef  = useRef(false)
  const [width, setWidth]     = useState(0)
  const [index, setIndex]     = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
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
  const SLIDE_HEIGHT = slideHeightFor(slideWidth || 900)
  const maxIndex = slides.length - 1

  // Auto-advance — paused on hover, mid-drag, or reduced motion
  useEffect(() => {
    if (reduce || hovered || focused || dragging || slideWidth === 0) return
    const id = setInterval(() => setIndex(i => (i + 1) % slides.length), AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [reduce, hovered, focused, dragging, slideWidth, slides.length])

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
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-roledescription="carousel"
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
              {slides.map((slide, i) => (
                <Link
                  key={slide.slug}
                  to={slide.to ?? `/promotions/${slide.slug}`}
                  draggable={false}
                  onClick={e => { if (draggedRef.current) e.preventDefault() }}
                  style={{
                    position: 'relative', flexShrink: 0,
                    width: slideWidth, height: SLIDE_HEIGHT,
                    marginRight: i === slides.length - 1 ? 0 : GAP,
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
                    // Strong enough that white text stays readable over any photo (UX audit B10).
                    background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 42%, transparent 72%)',
                    pointerEvents: 'none',
                  }} />
                  <div style={{ position: 'absolute', left: 'clamp(14px, 3vw, 22px)', right: 'clamp(14px, 3vw, 22px)', bottom: 'clamp(12px, 2.4vw, 18px)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
                    <p style={{
                      fontFamily: '"Space Grotesk",sans-serif',
                      fontSize: 'clamp(16px, 2.4vw, 20px)', fontWeight: 800, letterSpacing: '-0.01em',
                      color: '#fff', marginBottom: 3, lineHeight: 1.2, maxWidth: 560,
                    }}>
                      {slide.title}
                    </p>
                    <p style={{ fontSize: 'clamp(12px, 1.6vw, 13.5px)', color: 'rgba(255,255,255,0.88)', maxWidth: 560 }}>
                      {slide.subtitle}
                    </p>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </div>

        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, marginTop: 0 }}>
          {slides.map((slide, i) => (
            <button
              key={slide.slug}
              onClick={() => goTo(i)}
              aria-label={`Go to promotion ${i + 1} of ${slides.length}`}
              aria-current={i === index}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '9px 3px', display: 'flex' }}
            >
              <span style={{
                display: 'block', width: i === index ? 20 : 6, height: 6, borderRadius: 3,
                background: i === index ? 'var(--accent-light)' : 'var(--border-strong)',
                transition: 'width 0.3s ease, background 0.2s ease',
              }} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
