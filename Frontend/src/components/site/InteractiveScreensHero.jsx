import { useRef, useState, useEffect } from 'react'
import { useReducedMotion, useInView } from 'framer-motion'
import { Play, VideoOff } from 'lucide-react'
import { Reveal } from '../../lib/motion'

// TODO: drop the real hero footage in Frontend/public/videos/interactive-screens-hero.mp4
// (see the README in that folder for specs). Until it exists this section falls back to a
// static gradient with a notice instead of a broken video element.
const HERO_VIDEO_SRC = '/videos/interactive-screens-hero.mp4'

export default function InteractiveScreensHero() {
  const reduce = useReducedMotion()
  const sectionRef = useRef(null)
  const videoRef    = useRef(null)
  const [videoReady, setVideoReady]   = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  // Pause the hero video once it's scrolled out of view, so it isn't burning cycles
  // alongside the demo video further down the page.
  const inView = useInView(sectionRef, { margin: '-1px' })

  useEffect(() => {
    const el = videoRef.current
    if (!el || reduce || videoFailed) return
    if (inView) el.play().catch(() => {})
    else el.pause()
  }, [inView, reduce, videoFailed])

  const showVideo = !reduce && !videoFailed

  return (
    <section ref={sectionRef} style={{ padding: 'clamp(56px,8vw,100px) 0' }}>
      <div className="container-noir">
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{
              fontFamily: '"Space Grotesk",sans-serif',
              fontSize: 'clamp(40px, 7vw, 84px)', fontWeight: 900,
              letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--text)',
            }}>
              Interactive Screens
            </h1>
            <p style={{
              fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--muted)',
              marginTop: 14, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
            }}>
              Built for classrooms and boardrooms alike.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{
            position: 'relative', borderRadius: 24, overflow: 'hidden', aspectRatio: '16/9',
            background: 'linear-gradient(150deg, #0a0d1f 0%, #161c3a 45%, #2a3568 100%)',
            border: '1px solid var(--border)',
          }}>
            {showVideo && (
              <video
                ref={videoRef}
                muted
                loop
                playsInline
                preload="auto"
                onCanPlay={() => setVideoReady(true)}
                onError={() => setVideoFailed(true)}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', objectFit: 'cover',
                  opacity: videoReady ? 1 : 0,
                  transition: 'opacity 0.7s ease',
                }}
              >
                <source src={HERO_VIDEO_SRC} type="video/mp4" />
              </video>
            )}

            {(reduce || videoFailed) && (
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
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
