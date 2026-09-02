import { useRef, useState, useEffect } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

// The real footage is too large for git (>100MB), so it's served from Supabase Storage
// instead of a local /public path. Upload it to a public "media" bucket at
// interactive-screens-demo.mp4 (see Frontend/public/videos/README.md), or point
// VITE_INTERACTIVE_DEMO_VIDEO_URL at any other public URL to override. Until either
// exists this section falls back to a static gradient with a notice.
const DEMO_VIDEO_SRC =
  import.meta.env.VITE_INTERACTIVE_DEMO_VIDEO_URL ||
  (import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/interactive-screens-demo.mp4`
    : '/videos/interactive-screens-demo.mp4')

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }
const heading = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }

export default function InteractiveScreensDemo() {
  const reduce = useReducedMotion()
  const sectionRef = useRef(null)
  const videoRef    = useRef(null)
  // Below-the-fold — don't even mount the <video> (let alone fetch it) until it's
  // actually about to be seen.
  const inView = useInView(sectionRef, { once: true, margin: '-120px' })

  const [playing, setPlaying]         = useState(false)
  const [muted, setMuted]             = useState(true)
  const [videoFailed, setVideoFailed] = useState(false)

  // Autoplay once it scrolls into view — never when reduced motion is set,
  // per the prefers-reduced-motion requirement; the play button covers that case.
  useEffect(() => {
    if (!inView || reduce || videoFailed) return
    videoRef.current?.play().catch(() => {})
  }, [inView, reduce, videoFailed])

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    if (playing) el.pause()
    else el.play().catch(() => {})
  }
  const toggleMute = () => {
    const el = videoRef.current
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
  }

  const showVideo = inView && !videoFailed

  return (
    <section ref={sectionRef} style={{ padding: 'clamp(56px,8vw,100px) 0' }}>
      <div className="container-noir">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={eyebrow}>See it in action</p>
          <h2 style={heading}>A closer look.</h2>
        </div>

        <div style={{
          position: 'relative', borderRadius: 24, overflow: 'hidden', aspectRatio: '16/9',
          background: 'linear-gradient(150deg, #0a0d1f 0%, #161c3a 45%, #2a3568 100%)',
          border: '1px solid var(--border)',
        }}>
          {showVideo && (
            <video
              ref={videoRef}
              muted={muted}
              loop
              playsInline
              preload="none"
              onError={() => setVideoFailed(true)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            >
              <source src={DEMO_VIDEO_SRC} type="video/mp4" />
            </video>
          )}

          {videoFailed && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.6)', padding: 24,
            }}>
              <Play size={36} />
              <p style={{ fontSize: 12, textAlign: 'center', maxWidth: 320 }}>
                TODO: placeholder video — drop the real walkthrough into
                <br />public/videos/interactive-screens-demo.mp4
              </p>
            </div>
          )}

          {/* Overlay play button — shown whenever paused, including the reduced-motion case */}
          {!playing && !videoFailed && (
            <button
              onClick={togglePlay}
              aria-label="Play video"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.32)', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <span style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Play size={26} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
              </span>
            </button>
          )}

          {!videoFailed && (
            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: 'flex', gap: 10 }}>
              <ControlBtn onClick={togglePlay} label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </ControlBtn>
              <ControlBtn onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'}>
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </ControlBtn>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ControlBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 38, height: 38, borderRadius: '50%',
        background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', backdropFilter: 'blur(6px)', transition: 'background 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)' }}
    >
      {children}
    </button>
  )
}
