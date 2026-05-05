import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, RotateCcw } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import ProductCard    from '../components/ProductCard'
import Testimonials   from '../components/site/Testimonials'
import RecentlyViewed from '../components/site/RecentlyViewed'
import { Reveal, Parallax, Magnetic } from '../lib/motion'
import api from '../api/axios'


// ── Word-by-word stagger ────────────────────────────────────────────────────
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.25 } },
}
const wordVariants = {
  hidden:  { y: 20, opacity: 0 },
  visible: { y: 0,  opacity: 1, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
}

function StaggeredHeadline({ lines }) {
  const reduce = useReducedMotion()
  const words  = lines.flatMap((line, li) => [
    ...line.split(' ').map((word, wi) => ({ word, line: li, wi })),
    { word: null, line: li, wi: -1 }, // line break marke
  ])

  if (reduce) {
    return (
      <>
        {lines.map((line, i) => (
          <span key={i} style={{ display: 'block' }}>{line}</span>
        ))}
      </>
    )
  }

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'inline' }}
    >
      {words.map((item, i) =>
        item.word === null ? (
          <br key={`br-${item.line}`} />
        ) : (
          <motion.span key={i} variants={wordVariants} style={{ display: 'inline-block', marginRight: '0.28em' }}>
            {item.word}
          </motion.span>
        )
      )}
    </motion.span>
  )
}

export default function Home() {
  const [products,        setProducts]        = useState([])
  const [categories,      setCategories]      = useState([])
  const [activeCategory,  setActiveCategory]  = useState(null)
  const [loading,         setLoading]         = useState(true)

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    api.get('/products?page=0&size=8')
      .then(({ data }) => {
        if (!cancelled) {
          const content = data?.content ?? (Array.isArray(data) ? data : [])
          setProducts(content)
        }
      })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = activeCategory
    ? products.filter(p => (p.category?.name ?? p.categoryName) === activeCategory)
    : products

  const displayProducts = filtered

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ padding: '72px 0 56px' }}>
        <div className="container-noir hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64, alignItems: 'center',
        }}>

          {/* Left copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '1px solid #1e1e1e', borderRadius: 100,
                padding: '6px 14px', marginBottom: 28,
                fontSize: 13, color: '#555',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'block' }} />
              New season — Autumn 2026
            </motion.div>

            <h1 style={{
              fontFamily: '"Space Grotesk",sans-serif',
              fontSize: 'clamp(36px, 4.5vw, 64px)',
              fontWeight: 900, lineHeight: 1.05,
              letterSpacing: '-0.03em',
              marginBottom: 22,
            }}>
              <StaggeredHeadline lines={['Considered', 'objects.']} />
              <br />
              <span style={{ color: '#7c5cf0' }}>
                <StaggeredHeadline lines={['Quietly', 'engineered.']} />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.65 }}
              style={{ color: '#888', fontSize: 16, lineHeight: 1.75, maxWidth: 420, marginBottom: 36 }}
            >
              A curated collection of audio, wearables, and computing —
              selected for people who choose what surrounds them with care.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
            >
              <Magnetic strength={0.2}>
                <Link
                  to="/products"
                  className="noir-btn-primary shine"
                  style={{ fontSize: 15, padding: '13px 24px' }}
                >
                  Shop the collection <ArrowRight size={16} />
                </Link>
              </Magnetic>
              <Link
                to="/products?category=Audio"
                className="noir-btn-outline"
                style={{ fontSize: 15, padding: '13px 24px' }}
              >
                Explore audio
              </Link>
            </motion.div>
          </div>

          {/* Right — hero image with Ken Burns */}
          <Reveal delay={0.15}>
            <Parallax speed={0.08}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  borderRadius: 16, overflow: 'hidden',
                  aspectRatio: '4/5', background: '#1a1a1a',
                }}>
                  <img
                    // src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80"
                    src="https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Aurora Wireless headphones"
                    className="ken-burns"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.parentElement.style.background = '#1a1a1a' }}
                  />
                </div>

                {/* Featured badge */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.4 }}
                  style={{
                    position: 'absolute', bottom: -18, left: -18,
                    background: '#0f0f0f', border: '1px solid #1e1e1e',
                    borderRadius: 12, padding: '14px 20px',
                    boxShadow: 'var(--shadow-elegant)',
                  }}
                >
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: '#444', marginBottom: 4 }}>FEATURED</p>
                  <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Aurora Wireless</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>$349</p>
                </motion.div>
              </div>
            </Parallax>
          </Reveal>
        </div>
      </section>

      {/* ── Category tabs ──────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #141414', borderBottom: '1px solid #141414', overflowX: 'auto' }}>
        <div className="container-noir" style={{ display: 'flex', minWidth: 560 }}>
          {categories.map(cat => (
            <button
              key={cat.categoryId}
              onClick={() => setActiveCategory(prev => prev === cat.name ? null : cat.name)}
              style={{
                flex: 1, padding: '18px 8px',
                fontSize: 14, fontWeight: 500,
                color: activeCategory === cat.name ? '#fff' : '#555',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeCategory === cat.name ? '#7c5cf0' : 'transparent'}`,
                cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (activeCategory !== cat.name) e.currentTarget.style.color = '#bbb' }}
              onMouseLeave={e => { if (activeCategory !== cat.name) e.currentTarget.style.color = '#555' }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── Featured product grid ───────────────────────────── */}
      <section style={{ padding: '56px 0 48px' }}>
        <div className="container-noir">
          <Reveal>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#7c5cf0', marginBottom: 6 }}>LATEST ARRIVALS</p>
                <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>New this season</h2>
              </div>
              <Link
                to="/products"
                style={{ fontSize: 14, color: '#555', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#555'}
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>

          {loading ? (
            <div className="grid-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 340, borderRadius: 12 }} />
              ))}
            </div>
          ) : (
            <div className="grid-4">
              {displayProducts.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.05}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Brand story bento ───────────────────────────────── */}
      <Reveal>
        <section style={{ padding: '0 0 72px' }}>
          <div className="container-noir">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 16,
              minHeight: 400,
            }}>
              <Parallax speed={0.06}>
                <div style={{ borderRadius: 16, overflow: 'hidden', height: '100%', minHeight: 360, background: '#141414', position: 'relative' }}>
                  <img
                    src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80"
                    alt="Craft"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: 28,
                  }}>
                    <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
                      Craft before convenience
                    </p>
                    <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.65 }}>
                      Every product is chosen for how it feels to live with, not just how it performs on a spec sheet.
                    </p>
                  </div>
                </div>
              </Parallax>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { img: 'https://images.unsplash.com/photo-1655560378428-7605bda51749?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', label: 'Precision audio' },
                  { img: 'https://images.unsplash.com/photo-1523275335684-378s98b6baf30?w=500&q=80', label: 'Wearable craft' },
                ].map(({ img, label }) => (
                  <div key={label} style={{ flex: 1, borderRadius: 16, overflow: 'hidden', background: '#141414', position: 'relative', minHeight: 180 }}>
                    <img src={img} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)', display: 'flex', alignItems: 'flex-end', padding: 18 }}>
                      <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 700 }}>{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Trust badges ────────────────────────────────────── */}
      <Reveal>
        <section style={{ padding: '0 0 72px' }}>
          <div className="container-noir">
            <div style={{
              background: '#0f0f0f', border: '1px solid #141414',
              borderRadius: 16, padding: '44px 48px',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32,
            }}>
              {[
                { icon: <Truck size={22} />,     title: 'Free shipping',   desc: 'On all orders over $200.' },
                { icon: <Shield size={22} />,    title: '2-year warranty', desc: 'Quietly confident craftsmanship.' },
                { icon: <RotateCcw size={22} />, title: '30-day returns',  desc: "If it isn't right, send it back." },
              ].map(({ icon, title, desc }) => (
                <div key={title}>
                  <div style={{ color: '#7c5cf0', marginBottom: 12 }}>{icon}</div>
                  <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{title}</p>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.55 }}>{desc}</p>
                </div>
              ))}
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
