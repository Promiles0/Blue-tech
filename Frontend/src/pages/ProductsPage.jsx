import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import { motion, LayoutGroup } from 'framer-motion'
import ProductCard from '../components/ProductCard'
import { Reveal } from '../lib/motion'
import api from '../api/axios'

const SORT_OPTIONS = [
  { label: 'Newest',          value: 'productId,desc' },
  { label: 'Price: Low–High', value: 'price,asc' },
  { label: 'Price: High–Low', value: 'price,desc' },
  { label: 'Name A–Z',        value: 'name,asc' },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([]) // [{id, name}]
  const [loading, setLoading]   = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOpen, setSortOpen] = useState(false)

  const searchQ  = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? 'All'
  const sort     = searchParams.get('sort') ?? 'productId,desc'
  const page     = parseInt(searchParams.get('page') ?? '0', 10)

  // Fetch category list once to get IDs for filtering
  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val); else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  useEffect(() => {
    let cancelled = false

    const hasFilter = searchQ || (category && category !== 'All')
    const [sortField, sortDir] = sort.split(',')

    let request
    if (hasFilter) {
      // Use search endpoint: GET /api/products/search?name=...&categoryId=...
      const params = new URLSearchParams()
      if (searchQ) params.set('name', searchQ)
      if (category && category !== 'All') {
        const cat = categories.find(c => c.name === category)
        if (cat) params.set('categoryId', cat.categoryId)
      }
      params.set('sort', `${sortField},${sortDir}`)
      params.set('page', page)
      params.set('size', '12')
      request = api.get(`/products/search?${params}`)
    } else {
      // Use paginated list endpoint: GET /api/products?page=0&size=12&sort=...
      const params = new URLSearchParams()
      params.set('sort', `${sortField},${sortDir}`)
      params.set('page', page)
      params.set('size', '12')
      request = api.get(`/products?${params}`)
    }

    request
      .then(({ data }) => {
        if (!cancelled) {
          const content = data?.content ?? (Array.isArray(data) ? data : [])
          setProducts(content)
          setTotalPages(data?.totalPages ?? 1)
        }
      })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [searchQ, category, sort, page, categories])

  const displayProducts = products
  const currentSort     = SORT_OPTIONS.find(o => o.value === sort) ?? SORT_OPTIONS[0]

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
            {searchQ ? `Results for "${searchQ}"` : category !== 'All' ? category : 'All Products'}
          </h1>
          <p style={{ color: '#888', fontSize: 14 }}>{displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 300 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }} />
            <input
              value={searchQ}
              onChange={e => setParam('search', e.target.value)}
              placeholder="Search products…"
              className="noir-input"
              style={{ paddingLeft: 36, paddingRight: searchQ ? 36 : 14 }}
            />
            {searchQ && (
              <button onClick={() => setParam('search', '')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', display: 'flex', padding: 2, cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category pills — sliding active indicator via layoutId */}
          <LayoutGroup id="cat-pills">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All', ...categories.map(c => c.name)].map(cat => {
                const active = category === cat || (cat === 'All' && (!category || category === 'All'))
                return (
                  <button
                    key={cat}
                    onClick={() => setParam('category', cat === 'All' ? '' : cat)}
                    style={{
                      position: 'relative',
                      padding: '7px 14px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                      background: 'transparent',
                      color: active ? '#fff' : '#888',
                      border: `1px solid ${active ? 'transparent' : '#2a2a2a'}`,
                      cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s',
                    }}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-pill"
                        style={{
                          position: 'absolute', inset: 0,
                          background: '#7c5cf0', borderRadius: 100,
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>{cat}</span>
                  </button>
                )
              })}
            </div>
          </LayoutGroup>

          {/* Sort dropdown */}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button onClick={() => setSortOpen(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#141414', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <SlidersHorizontal size={14} style={{ color: '#888' }} />
              {currentSort.label}
              <ChevronDown size={14} style={{ color: '#888' }} />
            </button>
            {sortOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden', minWidth: 180, zIndex: 20 }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setParam('sort', opt.value); setSortOpen(false) }}
                    style={{ width: '100%', padding: '10px 16px', fontSize: 13, background: opt.value === sort ? 'rgba(124,92,240,0.12)' : 'none', color: opt.value === sort ? '#7c5cf0' : '#ccc', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'block' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid-4">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 12 }} />)}
          </div>
        ) : displayProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 16, color: '#888' }}>No products found.</p>
          </div>
        ) : (
          <div className="grid-4">
            {displayProducts.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 0.04, 0.28)}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            {[...Array(Math.min(totalPages, 10))].map((_, i) => (
              <button key={i}
                onClick={() => { const n = new URLSearchParams(searchParams); n.set('page', i); setSearchParams(n) }}
                style={{ width: 36, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 500, background: i === page ? '#7c5cf0' : '#141414', color: i === page ? '#fff' : '#888', border: `1px solid ${i === page ? '#7c5cf0' : '#2a2a2a'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
