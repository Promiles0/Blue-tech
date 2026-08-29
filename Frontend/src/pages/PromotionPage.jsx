import { useParams, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '../lib/motion'
import { PROMO_SLIDES } from '../lib/promoSlides'

export default function PromotionPage() {
  const { slug } = useParams()
  const promo = PROMO_SLIDES.find(p => p.slug === slug)

  return (
    <div style={{ padding: '80px 0' }}>
      <div className="container-noir" style={{ maxWidth: 720 }}>
        <Reveal>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase' }}>
            Promotion
          </p>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 12 }}>
            {promo?.title ?? 'Promotion'}
          </h1>
          {promo?.subtitle && (
            <p style={{ fontSize: 16, color: 'var(--muted)' }}>{promo.subtitle}</p>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ marginTop: 40, padding: 32, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Full details for this promotion are coming soon. In the meantime, browse the full catalog.
            </p>
            <Link to="/products" className="noir-btn-primary shine" style={{ display: 'inline-flex', fontSize: 14, padding: '12px 22px' }}>
              Shop all products <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
