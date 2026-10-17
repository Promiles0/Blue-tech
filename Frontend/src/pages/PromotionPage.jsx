import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react'
import { Reveal } from '../lib/motion'
import { PROMO_SLIDES } from '../lib/promoSlides'
import apiService from '../api/service'
import ProductCard from '../components/ProductCard'
import { WHATSAPP_NUMBER } from '../lib/helpLinks'
import { openLiveChat } from '../lib/liveChat'
import { usePageMeta } from '../hooks/usePageMeta'

// What each promotion page shows. Products come from the live catalogue; anything that
// depends on terms the store sets case by case (trade-in value, care plans, student
// pricing) is a WhatsApp conversation, never a promised discount.
const PROMOS = {
  'gaming-builds': {
    intro: 'Machines with the processor and graphics to keep up with games, editing and 3D. Here are our most powerful laptops and desktops right now.',
    category: /laptop|desktop/i, sort: 'price,desc',
    ask: "Hi Blue-Tech! I'm looking for a laptop/PC for gaming. My budget is ",
    blue: 'Which of your laptops or desktops is best for gaming?',
  },
  'business-laptops': {
    intro: 'Reliable laptops for the office and for working on the move — newest first.',
    category: /laptop/i, sort: 'updatedAt,desc',
    ask: "Hi Blue-Tech! I need laptops for our office. Quantity: ",
    blue: 'Which laptop do you recommend for office work?',
  },
  'student-deals': {
    intro: 'Laptops that handle assignments, research and online classes — most affordable first.',
    category: /laptop/i, sort: 'price,asc',
    ask: "Hi Blue-Tech! I'm a student looking for a laptop. Do you have student pricing? My budget is ",
    blue: 'Which laptop is best for a university student on a budget?',
  },
  'trade-in': {
    intro: 'Have a laptop or phone you no longer use? Tell us what it is and its condition, and we will tell you what credit it can earn toward your next machine.',
    ask: "Hi Blue-Tech! I'd like to trade in my device.\nDevice and model: \nAge: \nCondition: \nWhat I want to buy: ",
    askLabel: 'Get a trade-in offer on WhatsApp',
  },
  'care-plans': {
    intro: 'Every product comes with the warranty shown on its page. Want longer cover for a laptop, a screen or a whole office? Ask us about extended warranty and care options for your order.',
    ask: "Hi Blue-Tech! I'd like to know about extended warranty / care plans for: ",
    askLabel: 'Ask about care plans on WhatsApp',
  },
}

export default function PromotionPage() {
  const { slug } = useParams()
  const promo = PROMO_SLIDES.find(p => p.slug === slug)
  const config = PROMOS[slug]
  const [products, setProducts] = useState(null)
  usePageMeta({ title: `${promo?.title ?? 'Promotion'} | Blue-Tech`, description: config?.intro ?? promo?.subtitle })

  useEffect(() => {
    if (!config?.category) return
    let cancelled = false
    apiService.categories.getAll()
      .then(({ data }) => {
        const cats = (Array.isArray(data) ? data : []).filter(c => config.category.test(c.name ?? ''))
        return Promise.all(cats.map(c => apiService.products.search(new URLSearchParams({ categoryId: String(c.categoryId ?? c.id), size: '8', sort: config.sort }))))
      })
      .then(results => {
        if (cancelled) return
        const all = results.flatMap(r => r.data?.content ?? [])
        const [field, dir] = config.sort.split(',')
        const key = field === 'price' ? (p => Number(p.price) || 0) : (p => new Date(p.updatedAt ?? p.updated_at ?? 0).getTime())
        all.sort((a, b) => (dir === 'asc' ? 1 : -1) * (key(a) - key(b)))
        setProducts(all.slice(0, 8))
      })
      .catch(() => { if (!cancelled) setProducts([]) })
    return () => { cancelled = true }
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const waHref = config ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(config.ask)}` : null

  return (
    <div style={{ padding: '64px 0 80px' }}>
      <div className="container-noir">
        <Reveal>
          <div style={{ maxWidth: 720 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-light, var(--accent))', marginBottom: 12, textTransform: 'uppercase' }}>
              {promo?.subtitle ?? 'Promotion'}
            </p>
            <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 14 }}>
              {promo?.title ?? 'Promotion'}
            </h1>
            <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.65 }}>
              {config?.intro ?? 'Browse the full catalogue, or ask us about this offer.'}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              {waHref && (
                <a href={waHref} target="_blank" rel="noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10,
                  background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                }}>
                  <MessageCircle size={16} /> {config.askLabel ?? 'Ask us on WhatsApp'}
                </a>
              )}
              {config?.blue && (
                <button onClick={() => openLiveChat(config.blue, { send: true })} className="noir-btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '12px 20px' }}>
                  <Sparkles size={15} /> Ask Blue to recommend
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {config?.category && (
          <section style={{ marginTop: 48 }}>
            {products === null ? (
              <div className="grid-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 12 }} />)}</div>
            ) : products.length ? (
              <div className="grid-4">
                {products.map((p, i) => (
                  <Reveal key={p.productId ?? p.id} delay={Math.min(i * 0.04, 0.24)}><ProductCard product={p} /></Reveal>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Nothing listed for this right now — message us and we will find one for you.</p>
            )}
          </section>
        )}

        <div style={{ marginTop: 40 }}>
          <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--accent-light, var(--accent))', fontWeight: 600 }}>
            Browse all products <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  )
}
