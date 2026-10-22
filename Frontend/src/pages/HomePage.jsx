import { useState, useEffect } from 'react'
import { useT } from '../lib/i18n'
import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import Testimonials from '../components/site/Testimonials'
import RecentlyViewed from '../components/site/RecentlyViewed'
import PromoCarousel from '../components/site/PromoCarousel'
import DepartmentShelves from '../components/site/DepartmentShelves'
import { Reveal } from '../lib/motion'
import apiService from '../api/service'
import { openLiveChat } from '../lib/liveChat'
import { usePageMeta, storeJsonLd, SITE_URL } from '../hooks/usePageMeta'

// One-tap price bands (RWF); each opens the Store with that price filter.
const BUDGETS = [
  { label: 'Under 500k',  min: '',        max: '500000' },
  { label: '500k – 1M',   min: '500000',  max: '1000000' },
  { label: '1M – 2M',     min: '1000000', max: '2000000' },
  { label: '2M+',         min: '2000000', max: '' },
]

const BLUE_EXAMPLES = [
  'Which laptop is best for a university student?',
  'I need a printer for a small office',
  'What can I get for under 1,000,000 RWF?',
]
const NEW_ARRIVALS = 8

export default function Home() {
  const { t } = useT()
  const [business, setBusiness] = useState(null)
  useEffect(() => {
    apiService.settings.get().then(({ data }) => setBusiness(data?.businessInfo ?? null)).catch(() => {})
  }, [])
  usePageMeta({
    title: 'Blue-Tech — Laptops, Computers & Interactive Screens in Rwanda',
    description: 'Laptops, desktops, printers, monitors and interactive screens in Kigali, delivered across Rwanda. Warranty on every product; pay with MTN MoMo, Airtel Money or card.',
    ogImage: `${SITE_URL}/icon-512.png`,
    path: '/',
    jsonLd: [
      storeJsonLd(business ?? {}),
      {
        '@context': 'https://schema.org', '@type': 'WebSite', name: 'Blue-Tech', url: SITE_URL,
        potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
      },
    ],
  })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Home is a short, curated page; the Store (/products) has every filter (UX audit A5/B4).
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    apiService.products.getAllPaginated(`page=0&size=${NEW_ARRIVALS}`)
      .then(({ data }) => { if (!cancelled) setProducts(data?.content ?? (Array.isArray(data) ? data : [])) })
      .catch(() => { if (!cancelled) { setProducts([]); setLoadError(true) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [reloadKey])

  return (
    <div>
      {/* ── What the shop is, in one line (UX audit B9) ── */}
      <section className="container-noir home-intro">
        <div>
          <h1>{t('Genuine laptops & tech, delivered across Rwanda')}</h1>
          <p>{t('Warranty on every product. Pay with MTN MoMo, Airtel Money or card.')}</p>
        </div>
        <div className="home-intro-ctas">
          <Link to="/products" className="noir-btn-cta">{t('Shop all products')} <ArrowRight size={15} /></Link>
          <button type="button" onClick={() => openLiveChat()} className="noir-btn-outline"><MessageCircle size={15} /> {t('Ask Blue')}</button>
        </div>
      </section>

      <PromoCarousel />

      {/* ── Department tiles + one shelf per big department ─── */}
      <DepartmentShelves />

      {/* ── New arrivals + shop by budget ── */}
      <section id="all-products" className="container-noir" style={{ paddingTop: 24, paddingBottom: 56 }}>
        <div className="section-head">
          <div>
            <h2>{t('New arrivals')}</h2>
            <p>{t('The latest additions to the catalogue.')}</p>
          </div>
          <Link to="/products" className="section-link">{t('See all products')} <ArrowRight size={14} /></Link>
        </div>
        <div className="budget-chips" role="group" aria-label={t('Shop by budget')} style={{ marginTop: 0, marginBottom: 16 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginRight: 2 }}>{t('Shop by budget:')}</span>
          {BUDGETS.map(b => (
            <Link key={b.label} className="budget-chip" to={`/products?${new URLSearchParams(Object.entries({ minPrice: b.min, maxPrice: b.max }).filter(([, v]) => v))}`}>
              {t(b.label)}
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="grid-4">
            {[...Array(NEW_ARRIVALS)].map((_, i) => <div key={i} className="skeleton card-skeleton" />)}
          </div>
        ) : loadError ? (
          <div role="alert" style={{ textAlign: 'center', padding: '56px 16px', border: '1px solid var(--border)', borderRadius: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{t("Couldn't load products")}</p>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 18 }}>{t('Check your connection and try again.')}</p>
            <button onClick={() => setReloadKey(k => k + 1)} className="noir-btn-primary" style={{ fontSize: 13 }}>{t('Try again')}</button>
          </div>
        ) : (
          <div className="grid-4">
            {products.map(p => <ProductCard key={p.productId ?? p.id} product={p} />)}
          </div>
        )}

        {!loading && !loadError && products.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
            <Link to="/products" className="noir-btn-outline" style={{ minWidth: 200 }}>{t('Browse the full catalogue')} <ArrowRight size={14} /></Link>
          </div>
        )}
      </section>

      {/* ── Interactive screens — route schools and offices to the quote flow ── */}
      <Reveal>
        <section style={{ padding: '0 0 40px' }}>
          <div className="container-noir">
            <Link to="/interactive-screens" className="screens-banner">
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: 8 }}>
                  {t('For schools & offices')}
                </p>
                <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', marginBottom: 8 }}>
                  {t('Interactive screens, 65" to 110".')}
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxWidth: 520 }}>
                  {t('Touch, stylus, camera and screen mirroring in one display. Find your size and get a quote for one room or the whole building.')}
                </p>
              </div>
              <span className="screens-banner-cta">{t('Explore screens')} <ArrowRight size={15} /></span>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── Ask Blue — pre-purchase help prompt ───────── */}
      <Reveal>
        <section style={{ padding: '0 0 72px' }}>
          <div className="container-noir">
            <div style={{
              position: 'relative', overflow: 'hidden',
              borderRadius: 20, border: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: 'clamp(36px, 5vw, 56px) 24px',
              textAlign: 'center',
            }}>
              <div aria-hidden style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(60% 100% at 50% 0%, var(--accent-dim), transparent 70%)',
              }} />
              <div style={{ position: 'relative' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: 12 }}>
                  {t('Not sure where to start?')}
                </p>
                <h2 style={{
                  fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 12,
                }}>
                  {t('Ask Blue before you buy.')}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65, maxWidth: 460, margin: '0 auto 28px' }}>
                  {t("Blue knows the whole catalogue. Say what you'll use it for and your budget, and get real products with prices in seconds.")}
                </p>
                <button
                  onClick={() => openLiveChat()}
                  className="noir-btn-primary shine"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '12px 24px',
                  }}
                >
                  <MessageCircle size={16} /> {t('Ask Blue')}
                </button>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
                  {BLUE_EXAMPLES.map(q => (
                    <button key={q} className="blue-example" onClick={() => openLiveChat(t(q), { send: true })}>“{t(q)}”</button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted-dark)', marginTop: 14 }}>
                  {t('Instant answers 24/7. A real person is one tap away.')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Testimonials ────────────────────────────────────── */}
      <Testimonials />

      {/* ── Recently viewed ─────────────────────────────────── */}
      <RecentlyViewed />
    </div>
  )
}
