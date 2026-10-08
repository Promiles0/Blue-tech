import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, RotateCcw, SlidersHorizontal, Loader2, MessageCircle } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import Testimonials from '../components/site/Testimonials'
import RecentlyViewed from '../components/site/RecentlyViewed'
import FilterRail from '../components/site/FilterRail'
import PromoCarousel from '../components/site/PromoCarousel'
import DepartmentShelves from '../components/site/DepartmentShelves'
import { Reveal } from '../lib/motion'
import apiService from '../api/service'
import { openLiveChat, useLiveChatReady } from '../lib/liveChat'

const emptyFilters = { selected: {}, minPrice: '', maxPrice: '' }
const PAGE_SIZE = 12

export default function Home() {
  const [pool,    setPool]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(emptyFilters)
  const [facets,  setFacets]  = useState({})
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Load-more pagination — page/hasMore track the server-side cursor,
  // loadingMore only covers the "fetch next batch" request (not the initial load)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Debounce the price inputs so we don't refetch on every keystroke
  const [debouncedMin, setDebouncedMin] = useState('')
  const [debouncedMax, setDebouncedMax] = useState('')
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedMin(filters.minPrice)
      setDebouncedMax(filters.maxPrice)
    }, 400)
    return () => clearTimeout(id)
  }, [filters.minPrice, filters.maxPrice])

  useEffect(() => {
    apiService.products.facets()
      .then(({ data }) => setFacets(data && typeof data === 'object' ? data : {}))
      .catch(() => setFacets({}))
  }, [])

  // Facet selections as API params: brand=HP|Lenovo&ram=8GB ("|" since values can hold commas).
  const facetQuery = Object.entries(filters.selected)
    .filter(([, values]) => values.length)
    .map(([key, values]) => [key, values.join('|')])
  const facetKey = JSON.stringify(facetQuery)

  const fetchProductsPage = (pageNum) => {
    const hasFilter = debouncedMin !== '' || debouncedMax !== '' || facetQuery.length > 0
    if (hasFilter) {
      const params = new URLSearchParams()
      if (debouncedMin !== '') params.set('minPrice', debouncedMin)
      if (debouncedMax !== '') params.set('maxPrice', debouncedMax)
      for (const [key, value] of facetQuery) params.set(key, value)
      params.set('sort', 'updatedAt,desc')
      params.set('page', String(pageNum))
      params.set('size', String(PAGE_SIZE))
      return apiService.products.search(params)
    }
    return apiService.products.getAllPaginated(`page=${pageNum}&size=${PAGE_SIZE}`)
  }

  // Filters changed — reset to page 0 and replace the pool
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setPage(0)

    fetchProductsPage(0)
      .then(({ data }) => {
        if (cancelled) return
        const content = data?.content ?? (Array.isArray(data) ? data : [])
        setPool(content)
        setHasMore(data?.totalPages != null ? data.totalPages > 1 : content.length === PAGE_SIZE)
      })
      .catch(() => { if (!cancelled) { setPool([]); setHasMore(false) } })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [debouncedMin, debouncedMax, facetKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1

    fetchProductsPage(nextPage)
      .then(({ data }) => {
        const content = data?.content ?? (Array.isArray(data) ? data : [])
        setPool(prev => [...prev, ...content])
        setPage(nextPage)
        setHasMore(data?.totalPages != null ? nextPage + 1 < data.totalPages : content.length === PAGE_SIZE)
      })
      .catch(() => setHasMore(false))
      .finally(() => setLoadingMore(false))
  }

  // Auto-load the next batch when the shopper scrolls near the end of the grid.
  // The button stays as a fallback (and for keyboard users).
  const sentinelRef = useRef(null)
  const loadMoreRef = useRef(loadMore)
  useEffect(() => { loadMoreRef.current = loadMore })
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore || loading) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current() },
      { rootMargin: '600px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, page])

  const displayProducts = pool

  const activeCount = Object.values(filters.selected).reduce((n, values) => n + values.length, 0)
    + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0)

  const toggleFacet = (key, value) => setFilters(f => {
    const current = f.selected[key] ?? []
    const next = current.includes(value) ? current.filter(x => x !== value) : [...current, value]
    return { ...f, selected: { ...f.selected, [key]: next } }
  })
  const setMinPrice = (v) => setFilters(f => ({ ...f, minPrice: v }))
  const setMaxPrice = (v) => setFilters(f => ({ ...f, maxPrice: v }))
  const clearAll     = () => setFilters(emptyFilters)

  const chatReady = useLiveChatReady()

  return (
    <div>

      <PromoCarousel />

      {/* ── Department tiles + one shelf per big department ─── */}
      <DepartmentShelves />

      {/* ── Filter rail + full product grid ──────────────────── */}
      <div id="all-products" className="container-noir shop-layout" style={{ padding: '24px 0 64px' }}>
        <FilterRail
          filters={filters}
          setters={{ toggleFacet, setMinPrice, setMaxPrice }}
          facets={facets}
          activeCount={activeCount}
          onClearAll={clearAll}
          mobileOpen={mobileFiltersOpen}
          onMobileClose={() => setMobileFiltersOpen(false)}
        />

        <div>
          <Reveal>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{
                  fontFamily: '"Space Grotesk",sans-serif',
                  fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 900,
                  letterSpacing: '-0.02em', lineHeight: 1.1,
                  color: 'var(--text)', marginBottom: 6,
                }}>
                  All products
                </h1>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>Newest first. Filter by brand, price and specs.</p>
              </div>
              <button
                className="filter-mobile-btn noir-btn-outline"
                onClick={() => setMobileFiltersOpen(true)}
                style={{ fontSize: 13 }}
              >
                <SlidersHorizontal size={14} /> Filters{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
            </div>
          </Reveal>

          {loading ? (
            <div className="grid-4">
              {[...Array(PAGE_SIZE)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 340, borderRadius: 12 }} />
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', border: '1px solid var(--border)', borderRadius: 12 }}>
              <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 16 }}>No products match your filters.</p>
              <button onClick={clearAll} className="noir-btn-outline" style={{ fontSize: 13 }}>Clear filters</button>
            </div>
          ) : (
            <div className="grid-4">
              {displayProducts.map((p, i) => (
                <Reveal key={p.productId ?? p.id} delay={Math.min((i % PAGE_SIZE) * 0.05, 0.3)}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}

          {!loading && displayProducts.length > 0 && (
            <div ref={sentinelRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 40 }}>
              {hasMore ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="noir-btn-outline"
                  style={{ fontSize: 13, minWidth: 168, justifyContent: 'center', opacity: loadingMore ? 0.7 : 1, cursor: loadingMore ? 'default' : 'pointer' }}
                >
                  {loadingMore ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : 'Load more products'}
                </button>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--muted-dark)' }}>You've seen it all.</p>
              )}

              <Link
                to="/products"
                style={{ fontSize: 13, color: 'var(--muted-dark)', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}
              >
                View full catalog <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Talk to someone — pre-purchase help prompt ───────── */}
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
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
                  Not sure where to start?
                </p>
                <h2 style={{
                  fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 12,
                }}>
                  Talk to someone before you buy.
                </h2>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65, maxWidth: 460, margin: '0 auto 28px' }}>
                  Tell us what you'll use it for and your budget — we'll point you to the right machine, no pressure.
                </p>
                <button
                  onClick={openLiveChat}
                  disabled={!chatReady}
                  className="noir-btn-primary shine"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '12px 24px',
                    opacity: chatReady ? 1 : 0.6, cursor: chatReady ? 'pointer' : 'default',
                  }}
                >
                  {chatReady
                    ? <><MessageCircle size={16} /> Chat with us</>
                    : <><Loader2 size={16} className="animate-spin" /> Loading chat…</>}
                </button>
                <p style={{ fontSize: 12, color: 'var(--muted-dark)', marginTop: 14 }}>
                  Usually replies within a few hours.
                </p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Trust signals — quiet Muji/Away-style strip ─────── */}
      <Reveal>
        <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '36px 0' }}>
          <div className="container-noir grid-3" style={{ gap: 40 }}>
            {[
              { icon: <Truck size={17} />, title: 'Free standard delivery', desc: 'Express next-day delivery also available.' },
              { icon: <Shield size={17} />, title: 'Warranty included', desc: 'Every product page shows its warranty.' },
              { icon: <RotateCcw size={17} />, title: '30-day returns', desc: "If it isn't right, send it back." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ color: 'var(--muted-dark)', flexShrink: 0, marginTop: 1 }}>{icon}</div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 13, color: 'var(--muted-dark)', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
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
