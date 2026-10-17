import { ArrowRight, Sparkles, MessageCircle } from 'lucide-react'
import { Reveal } from '../../lib/motion'
import { openQuote } from '../../lib/quote'
import { openLiveChat } from '../../lib/liveChat'
import { WHATSAPP_NUMBER } from '../../lib/helpLinks'

export const CTA_SECTION_ID = 'interactive-screens-cta'

const ghostBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, padding: '12px 22px',
  borderRadius: 999, border: '1px solid rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.06)',
  color: '#fff', cursor: 'pointer', textDecoration: 'none',
}

export default function InteractiveScreensCTA() {
  const waText = encodeURIComponent("Hi Blue-Tech! I'd like to talk about interactive screens for our school/office.")
  return (
    <Reveal>
      <section id={CTA_SECTION_ID} style={{ padding: '0 0 88px' }}>
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
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
                From a single classroom to a whole-school or multi-office rollout — tell us what you need and we'll send pricing.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => openQuote()} className="noir-btn-primary shine"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '13px 26px' }}>
                  Request a quote <ArrowRight size={15} />
                </button>
                <button onClick={() => openLiveChat('Which interactive screen size do I need for ')} style={ghostBtn}>
                  <Sparkles size={15} /> Ask Blue
                </button>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`} target="_blank" rel="noreferrer" style={ghostBtn}>
                  <MessageCircle size={15} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  )
}
