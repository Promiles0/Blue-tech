import { useQuery } from '@tanstack/react-query'
import { Monitor } from 'lucide-react'
import ProductCard from '../ProductCard'
import { Reveal } from '../../lib/motion'
import apiService from '../../api/service'

export const MODELS_SECTION_ID = 'interactive-screens-models'

// Matches on category *name* rather than a hardcoded id, since categories are
// seeded per-environment. Once an "Interactive Screens" (or similarly named)
// category and its products exist in the catalog, this grid fills in on its
// own — no code change needed here.
const CATEGORY_MATCH = /interactive.?screens?/i

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }
const heading = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }

export default function InteractiveScreensModels() {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiService.categories.getAll()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 1000 * 60 * 5,
  })

  const category = categories.find(c => CATEGORY_MATCH.test(c.name ?? ''))

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['interactive-screens-models', category?.categoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ categoryId: String(category.categoryId), size: '12', sort: 'createdAt,desc' })
      const res = await apiService.products.search(params)
      return res.data?.content ?? (Array.isArray(res.data) ? res.data : [])
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 2,
  })

  const loading = isLoading && !!category

  return (
    <section id={MODELS_SECTION_ID} style={{ padding: 'clamp(56px,8vw,100px) 0', scrollMarginTop: 96 }}>
      <div className="container-noir">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={eyebrow}>Available models</p>
          <h2 style={heading}>Find the right screen for your space.</h2>
        </div>

        {loading ? (
          <div className="grid-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 340, borderRadius: 12 }} />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--border)', borderRadius: 16 }}>
            <Monitor size={26} style={{ color: 'var(--muted-dark)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>
              Models are being added to the catalog — check back soon.
            </p>
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
