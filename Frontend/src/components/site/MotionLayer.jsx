import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// The site's "alive" layer (motion round, M1–M11). One set of listeners for the whole page
// instead of wrappers on every component, so it stays cheap:
//   M1 blue cursor glow · M2 magnetic buttons · M3/M4 card spotlight + tilt (mouse only)
//   M5 parallax ([data-parallax]) · M6 staggered reveals (.grid-4 children, [data-reveal])
//   M8 header glow once scrolled · M10 fly-to-cart · M11 heart burst
// Everything is skipped for "reduce motion"; mouse effects only run on devices with a mouse.
const MAGNETIC = '.noir-btn-cta, .noir-btn-primary, .home-intro-ctas > *, [data-magnetic]'
const GROW = 'a, button, .product-card, input, select, [role="button"]'

export default function MotionLayer() {
  const glowRef = useRef(null)
  const { pathname } = useLocation()

  // ── Pointer effects (M1–M4) ──
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (reduce || !mouse) return
    const glow = glowRef.current
    let x = -400, y = -400, gx = x, gy = y, scale = 1, target = 1, frame = 0
    let magnet = null, card = null

    const tick = () => {
      gx += (x - gx) * 0.14
      gy += (y - gy) * 0.14
      scale += (target - scale) * 0.12
      if (glow) glow.style.transform = `translate3d(${gx}px, ${gy}px, 0) translate(-50%, -50%) scale(${scale})`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const release = (el) => { if (el) el.style.transform = '' }
    const resetCard = (el) => { if (el) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); el.classList.remove('is-pointed') } }

    const onMove = (e) => {
      x = e.clientX; y = e.clientY
      const t = e.target instanceof Element ? e.target : null
      target = t?.closest(GROW) ? 1.6 : 1

      const m = t?.closest(MAGNETIC)
      if (m !== magnet) { release(magnet); magnet = m }
      if (m && !m.disabled) {
        const r = m.getBoundingClientRect()
        m.style.transform = `translate(${(x - r.left - r.width / 2) * 0.22}px, ${(y - r.top - r.height / 2) * 0.3}px)`
      }

      const c = t?.closest('.product-card')
      if (c !== card) { resetCard(card); card = c }
      if (c) {
        const r = c.getBoundingClientRect()
        const px = (x - r.left) / r.width, py = (y - r.top) / r.height
        c.style.setProperty('--mx', `${px * 100}%`)
        c.style.setProperty('--my', `${py * 100}%`)
        c.style.setProperty('--rx', `${(0.5 - py) * 6}deg`)
        c.style.setProperty('--ry', `${(px - 0.5) * 6}deg`)
        c.classList.add('is-pointed')
      }
    }
    const onLeave = () => { x = -400; y = -400; release(magnet); resetCard(card); magnet = card = null }

    document.documentElement.classList.add('has-cursor-glow')
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('has-cursor-glow')
    }
  }, [])

  // ── Scroll effects (M5, M8) ──
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        document.documentElement.classList.toggle('is-scrolled', window.scrollY > 8)
        if (reduce) return
        const vh = window.innerHeight
        document.querySelectorAll('[data-parallax]').forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.bottom < 0 || r.top > vh) return
          const speed = parseFloat(el.dataset.parallax) || 0.15
          el.style.setProperty('--parallax', `${((r.top + r.height / 2 - vh / 2) * -speed).toFixed(1)}px`)
        })
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])

  // ── Staggered reveals (M6): product grids and [data-reveal], re-scanned as pages change ──
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('is-in')
        io.unobserve(e.target)
      })
    }, { rootMargin: '0px 0px -40px 0px' })
    const scan = () => {
      document.querySelectorAll('.grid-4 > :not(.reveal-ready), [data-reveal]:not(.reveal-ready)').forEach((el) => {
        const siblings = el.parentElement ? [...el.parentElement.children] : []
        el.style.setProperty('--i', String(Math.min(siblings.indexOf(el) % 8, 7)))
        el.classList.add('reveal-ready')
        io.observe(el)
      })
    }
    scan()
    let pending = 0
    const mo = new MutationObserver(() => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; scan() }) })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(pending) }
  }, [pathname])

  // ── Fly-to-cart (M10) and heart burst (M11) ──
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let lastPoint = null
    const onDown = (e) => { lastPoint = { x: e.clientX, y: e.clientY } }

    const onAdded = (e) => {
      const target = [...document.querySelectorAll('[data-cart-target]')].find((el) => el.offsetParent !== null)
      if (!target) return
      const bump = () => { target.classList.remove('cart-bump'); void target.offsetWidth; target.classList.add('cart-bump') }
      if (reduce || !lastPoint || !e.detail?.image) { bump(); return }
      const to = target.getBoundingClientRect()
      const img = document.createElement('img')
      img.src = e.detail.image
      img.alt = ''
      img.className = 'fly-to-cart'
      img.style.left = `${lastPoint.x - 32}px`
      img.style.top = `${lastPoint.y - 32}px`
      document.body.appendChild(img)
      const dx = to.left + to.width / 2 - lastPoint.x
      const dy = to.top + to.height / 2 - lastPoint.y
      const anim = img.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(0.7)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0.4 },
      ], { duration: 700, easing: 'cubic-bezier(.5,0,.3,1)' })
      anim.onfinish = () => { img.remove(); bump() }
    }

    const onClick = (e) => {
      const heart = e.target instanceof Element ? e.target.closest('.pc-heart, [data-heart]') : null
      if (!heart || reduce) return
      heart.classList.remove('heart-burst'); void heart.offsetWidth; heart.classList.add('heart-burst')
      setTimeout(() => heart.classList.remove('heart-burst'), 650)
    }

    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('bt:added-to-cart', onAdded)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('bt:added-to-cart', onAdded)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return <div ref={glowRef} className="cursor-glow" aria-hidden />
}
