import { Monitor, ArrowRight } from 'lucide-react'
import { openQuote } from '../../lib/quote'
import ProductCard from '../ProductCard'
import { Reveal } from '../../lib/motion'
import { useInteractiveScreensProducts } from '../../hooks/useInteractiveScreensProducts'

export const MODELS_SECTION_ID = 'interactive-screens-models'

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: 8 }
const heading = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }

export default function InteractiveScreensModels() {
  const { products, isLoading: loading } = useInteractiveScreensProducts()

  return (
    <section id={MODELS_SECTION_ID} style={{ padding: 'clamp(56px,8vw,100px) 0', scrollMarginTop: 96 }}>
      <div className="container-noir">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={eyebrow}>Available models</p>
          <h2 style={heading}>Find the right screen for your space.</h2>
        </div>

        {loading ? (
          <div className="grid-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton card-skeleton" />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--border)', borderRadius: 16 }}>
            <Monitor size={26} style={{ color: 'var(--muted-dark)', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              Every size from 65" to 110" is available to order.
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.6 }}>
              Pricing depends on size, quantity and mounting, so we quote each order directly.
            </p>
            <button onClick={() => openQuote()} className="noir-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '11px 22px' }}>
              Request pricing <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div className="grid-4">
            {products.map((p, i) => (
              <Reveal key={p.productId ?? p.id} delay={Math.min(i * 0.05, 0.3)}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
