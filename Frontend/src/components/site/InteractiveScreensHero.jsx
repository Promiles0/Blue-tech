import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { motion, cubicBezier, useScroll, useTransform, useReducedMotion, useInView } from 'framer-motion'
import { Play, VideoOff } from 'lucide-react'
import { Reveal } from '../../lib/motion'

// TODO: drop the real hero footage in Frontend/public/videos/interactive-screens-hero.mp4
// (see the README in that folder for specs). Until it exists this section falls back to a
// static gradient with a notice instead of a broken video element.
const HERO_VIDEO_SRC = '/videos/interactive-screens-hero.mp4'

// Fixed (not theme-driven) — the title sits on this backdrop before the video frame grows
// up to meet it, and inside the video frame's own scrim once it does, so it needs to stay
// dark regardless of site theme. Matches the gradient already used as this frame's own
// fallback/loading background, and the rest of this page's per-section fixed palettes.
const NAVY_BG = 'linear-gradient(160deg, #0a0d1f 0%, #161c3a 45%, #2a3568 100%)'

// With useScroll's `['start start', 'end end']` offsets, scroll progress 0→1 spans
// (SCROLL_TRACK_VH - 100)vh — NOT the full track height — since that's how much extra
// scroll it takes for the track's bottom edge to reach the (already-pinned) viewport's
// bottom. The first GROWTH_END fraction of that grows the frame; the rest holds it
// pinned full-bleed before the track ends and releases into the next section. Growth (and
// the text fade tied to it) is driven by this real scroll position — see growth below —
// whether that position moves because of the user's own input or the scripted auto-scroll.
const SCROLL_TRACK_VH = 300
const GROWTH_END = 0.65

// One-time auto-scroll on mount: scripts the viewport from the top of the track down to
// the scroll position where growth === GROWTH_END (see targetScrollY in useAutoScrollGrowth
// below), over this duration, eased the same way the growth animation used to be.
const AUTO_SCROLL_DURATION = 5 // seconds
// Symmetric ease-in-out — spreads growth evenly across the full duration instead of the
// old cubic-bezier(0.16, 1, 0.3, 1)'s front-loading (that curve hit ~90%+ progress by the
// first second, which read as an instant snap even at a 3s duration).
const AUTO_SCROLL_EASE = cubicBezier(0.65, 0, 0.35, 1)

// Module-level (not component-level) so it survives a remount — e.g. the user navigates
// away and back via client-side routing — without a full page reload. Resets naturally on
// an actual page reload, matching "once per page load". Only flips to true once the
// auto-scroll has actually started animating a real frame (see useAutoScrollGrowth), so
// React StrictMode's dev-only mount→cleanup→mount double-invoke — whose first effect run
// never survives to a real animation frame — doesn't burn the one allowed run.
let hasAutoScrolled = false

const titleStyle = {
  fontFamily: '"Space Grotesk",sans-serif',
  fontSize: 'clamp(40px, 7vw, 84px)', fontWeight: 900,
  letterSpacing: '-0.03em', lineHeight: 1.05, color: '#fff',
}
const taglineStyle = {
  fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.78)',
  marginTop: 14, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
}

// Shared "pause the video once its section scrolls out of view" behavior, used by both
// the animated and reduced-motion variants below.
function useAutoPauseVideo(sectionRef, videoRef, disabled) {
  const inView = useInView(sectionRef, { margin: '-1px' })
  useEffect(() => {
    const el = videoRef.current
    if (!el || disabled) return
    if (inView) el.play().catch(() => {})
    else el.pause()
  }, [inView, disabled, videoRef, sectionRef])
}

// Scripts window.scrollTo, frame by frame, from the current scroll position down to the
// point where growth === GROWTH_END — eased, over AUTO_SCROLL_DURATION. Growth itself stays
// driven by real scrollYProgress the whole time (see GrowingHero), so this is just another
// source of scroll input, not a separate animation of the frame/text. Bails out up front on
// touch devices (auto-scroll can feel disorienting there) and skips entirely once
// `hasAutoScrolled` is already set. The instant the user scrolls, touches, or presses a
// scroll key, the script stops and normal scrolling takes over from wherever it left off.
function useAutoScrollGrowth(trackRef) {
  // Runs synchronously before the browser paints, so the very first frame the user ever
  // sees on this page load is guaranteed scrollY 0 → growth 0 (small framed video, title
  // fully visible) — instead of trusting that scrollY already happens to be 0, which a hard
  // refresh can violate (the browser restores the previous scroll position by default).
  useLayoutEffect(() => {
    if (hasAutoScrolled) return
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return
    if (window.scrollY !== 0) window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (hasAutoScrolled) return
    const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    if (isTouchDevice) return
    const track = trackRef.current
    if (!track) return

    const rect = track.getBoundingClientRect()
    const trackTopDocY = rect.top + window.scrollY
    const trackHeightPx = track.offsetHeight
    const viewportHeight = window.innerHeight
    const targetScrollY = trackTopDocY + GROWTH_END * (trackHeightPx - viewportHeight)
    const startScrollY = window.scrollY

    // Nothing to auto-scroll toward — e.g. the track isn't near the top for some reason,
    // or scroll restoration already put the user past this point.
    if (startScrollY >= targetScrollY) return

    let rafId = null
    let cancelled = false
    let started = false
    let startTime = null

    const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']

    function stopAutoScroll() {
      if (cancelled) return
      cancelled = true
      hasAutoScrolled = true
      if (rafId != null) cancelAnimationFrame(rafId)
      removeListeners()
    }
    function onKeyDown(e) {
      if (SCROLL_KEYS.includes(e.key)) stopAutoScroll()
    }
    function addListeners() {
      window.addEventListener('wheel', stopAutoScroll, { passive: true })
      window.addEventListener('touchmove', stopAutoScroll, { passive: true })
      window.addEventListener('keydown', onKeyDown)
    }
    function removeListeners() {
      window.removeEventListener('wheel', stopAutoScroll)
      window.removeEventListener('touchmove', stopAutoScroll)
      window.removeEventListener('keydown', onKeyDown)
    }

    function step(now) {
      if (cancelled) return
      if (!started) {
        started = true
        startTime = now
        hasAutoScrolled = true
      }
      const t = Math.min((now - startTime) / (AUTO_SCROLL_DURATION * 1000), 1)
      const eased = AUTO_SCROLL_EASE(t)
      window.scrollTo(0, startScrollY + eased * (targetScrollY - startScrollY))
      if (t < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        stopAutoScroll()
      }
    }

    addListeners()
    // Double rAF: the first callback fires once the browser has already painted the
    // current (small/idle) state, so `step`'s own first frame — where it measures its
    // start time and begins actually moving scroll — only runs after that paint has
    // definitely happened, never before it.
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(step)
    })

    // Real unmount before the first frame ever ran (the StrictMode throwaway setup, or a
    // genuinely instant unmount) leaves `hasAutoScrolled` untouched, unlike stopAutoScroll.
    return () => {
      cancelled = true
      if (rafId != null) cancelAnimationFrame(rafId)
      removeListeners()
    }
  }, [trackRef])
}

// `opacity` is either a MotionValue driven by the same growth progress as the video frame
// (so the text finishes fading out at exactly the moment the frame reaches full-bleed), or
// a plain 1 for a static, always-visible title — the heading stays in the DOM either way
// for accessibility/SEO; only the animation is conditional on prefers-reduced-motion.
function TitleBlock({ opacity }) {
  return (
    <motion.div style={{
      position: 'absolute', top: 'clamp(64px, 11vh, 120px)', left: 0, right: 0, zIndex: 2,
      textAlign: 'center', padding: '0 24px', pointerEvents: 'none',
      opacity,
    }}>
      <Reveal>
        <h1 style={titleStyle}>Interactive Screens</h1>
        <p style={taglineStyle}>Built for classrooms and boardrooms alike.</p>
      </Reveal>
    </motion.div>
  )
}

// prefers-reduced-motion: no scroll-driven growth at all — the video is simply full-bleed
// from the start, section is a single normal viewport tall.
function ReducedMotionHero() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  useAutoPauseVideo(sectionRef, videoRef, videoFailed)

  const showVideo = !videoFailed

  return (
    <section ref={sectionRef} style={{ position: 'relative', height: '100svh', minHeight: 480, overflow: 'hidden', background: NAVY_BG }}>
      {showVideo && (
        <video
          ref={videoRef}
          muted loop playsInline preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: videoReady ? 1 : 0, transition: 'opacity 0.7s ease',
          }}
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      )}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(6,8,20,0.82) 0%, rgba(6,8,20,0.35) 32%, transparent 58%)',
      }} />
      {videoFailed && <VideoFallback reduce={false} />}
      <TitleBlock opacity={1} />
    </section>
  )
}

function VideoFallback({ reduce }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 10,
      color: 'rgba(255,255,255,0.6)', padding: 24,
    }}>
      {reduce ? <VideoOff size={36} /> : <Play size={36} />}
      <p style={{ fontSize: 12, textAlign: 'center', maxWidth: 340 }}>
        {reduce
          ? 'Reduced motion is enabled, so the background video is disabled.'
          : <>TODO: placeholder video — drop the real footage into<br />public/videos/interactive-screens-hero.mp4</>}
      </p>
    </div>
  )
}

// The full grow-from-frame-to-full-bleed hero. Growth is always driven by real scroll
// position (useScroll below) so the frame/text respond to the user's own scrolling exactly
// as before; a one-time scripted auto-scroll (useAutoScrollGrowth) additionally drives that
// same scroll position on mount, handing back control the instant the user scrolls
// themselves.
function GrowingHero() {
  const trackRef = useRef(null)
  const videoRef = useRef(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  useAutoPauseVideo(trackRef, videoRef, videoFailed)
  useAutoScrollGrowth(trackRef)

  // Viewport size drives the frame's rest/full geometry below — re-measured on resize so
  // the effect stays correct across breakpoints without any separate mobile-only logic.
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  // Growth covers the first GROWTH_END of the track's scroll range, then clamps at 1 —
  // that clamp *is* the "hold": the frame simply stops changing for the remaining scroll
  // distance while position: sticky keeps it pinned full-bleed, until the track ends and
  // releases into the next section.
  const growth = useTransform(scrollYProgress, [0, GROWTH_END], [0, 1])
  const titleOpacity = useTransform(growth, [0, 1], [1, 0])

  const restWidth  = Math.min(viewport.width * 0.86, 1100)
  const restHeight = Math.min(restWidth * 9 / 16, viewport.height * 0.46)
  const restTop    = Math.max(viewport.height * 0.34, 220)
  const restLeft   = (viewport.width - restWidth) / 2

  const width  = useTransform(growth, [0, 1], [restWidth, viewport.width])
  const height = useTransform(growth, [0, 1], [restHeight, viewport.height])
  const top    = useTransform(growth, [0, 1], [restTop, 0])
  const left   = useTransform(growth, [0, 1], [restLeft, 0])
  const radius = useTransform(growth, [0, 1], [24, 0])
  const shadowOpacity = useTransform(growth, [0, 1], [0.35, 0])

  const showVideo = !videoFailed

  return (
    <section ref={trackRef} style={{ position: 'relative', height: `${SCROLL_TRACK_VH}vh` }}>
      <div style={{ position: 'sticky', top: 0, height: '100svh', minHeight: 480, overflow: 'hidden', background: NAVY_BG }}>
        <TitleBlock opacity={titleOpacity} />

        <motion.div
          style={{
            position: 'absolute', zIndex: 1, overflow: 'hidden',
            width, height, top, left, borderRadius: radius,
            background: NAVY_BG,
            boxShadow: useTransform(shadowOpacity, (v) => `0 30px 80px rgba(0,0,0,${v})`),
          }}
        >
          {showVideo && (
            <video
              ref={videoRef}
              muted loop playsInline preload="auto"
              onCanPlay={() => setVideoReady(true)}
              onError={() => setVideoFailed(true)}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: videoReady ? 1 : 0, transition: 'opacity 0.7s ease',
              }}
            >
              <source src={HERO_VIDEO_SRC} type="video/mp4" />
            </video>
          )}

          {/* Lives inside the frame so it scales/clips with its animated bounds and
              radius for free — no separate geometry to keep in sync. */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(6,8,20,0.82) 0%, rgba(6,8,20,0.35) 32%, transparent 58%)',
          }} />

          {videoFailed && <VideoFallback reduce={false} />}
        </motion.div>
      </div>
    </section>
  )
}

export default function InteractiveScreensHero() {
  const reduce = useReducedMotion()
  return reduce ? <ReducedMotionHero /> : <GrowingHero />
}
