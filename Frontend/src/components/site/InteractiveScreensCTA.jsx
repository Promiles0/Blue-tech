import { ArrowRight } from 'lucide-react'
import { Reveal } from '../../lib/motion'
import { MODELS_SECTION_ID } from './InteractiveScreensModels'

export default function InteractiveScreensCTA() {
  const scrollToModels = (e) => {
    e.preventDefault()
    document.getElementById(MODELS_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Reveal>
      <section style={{ padding: '0 0 88px' }}>
        <div className="container-noir">
          <div style={{
            position: 'relative', overflow: 'hidden', textAlign: 'center',
            borderRadius: 24, border: '1px solid var(--border)',
            background: 'linear-gradient(150deg, #12142a 0%, #22284a 55%, #354380 100%)',
            padding: 'clamp(48px,7vw,72px) 24px',
          }}>
            <div aria-hidden style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(60% 100% at 50% 0%, rgba(255,255,255,0.08), transparent 70%)',
            }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{
                fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(26px,3.4vw,38px)',
                fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', marginBottom: 14,
              }}>
                Ready to bring one into your room?
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', maxWidth: 460, margin: '0 auto 28px', lineHeight: 1.6 }}>
                From single-classroom setups to multi-room office rollouts — see what's available now.
              </p>
              <a
                href={`#${MODELS_SECTION_ID}`}
                onClick={scrollToModels}
                className="noir-btn-primary shine"
                style={{ display: 'inline-flex', fontSize: 14, padding: '13px 26px' }}
              >
                Shop interactive screens <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  )
}
