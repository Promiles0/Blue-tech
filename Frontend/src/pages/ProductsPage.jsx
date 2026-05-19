import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import { motion, LayoutGroup } from 'framer-motion'
import ProductCard from '../components/ProductCard'
import { Reveal } from '../lib/motion'
import apiService from '../api/service'

const PRODUCTS_PER_PAGE = 8
const SORT_OPTIONS = [
  { label: 'Newest',          value: 'productId,desc' },
  { label: 'Price: Low–High', value: 'price,asc' },
  { label: 'Price: High–Low', value: 'price,desc' },
  { label: 'Name A–Z',        value: 'name,asc' },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [sortOpen, setSortOpen] = useState(false)

  const searchQ  = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? 'All'
  const sort     = searchParams.get('sort') ?? 'productId,desc'
  const page     = parseInt(searchParams.get('page') ?? '0', 10)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiService.categories.getAll()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 1000 * 60 * 5,
  })

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val); else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const categoryIds = categories.map(c => c.categoryId).join(',')

  useEffect(() => {
    let cancelled = false

    const needsCategoryFilter = category && category !== 'All'
    const hasFilter = !!searchQ || needsCategoryFilter

    const [sortField, sortDir] = sort.split(',')

    let request
    if (hasFilter) {
      const params = new URLSearchParams()
      if (searchQ) params.set('name', searchQ)
      if (needsCategoryFilter) {
        const cat = categories.find(c => c.name === category || c.categoryName === category)
        if (cat) params.set('categoryId', cat.categoryId)
        else params.set('name', searchQ || '')
      }
      params.set('sort', `${sortField},${sortDir}`)
      params.set('page', page)
      params.set('size', String(PRODUCTS_PER_PAGE))
      request = apiService.products.search(params)
    } else {
      const params = new URLSearchParams()
      params.set('sort', `${sortField},${sortDir}`)
      params.set('page', page)
      params.set('size', String(PRODUCTS_PER_PAGE))
      request = apiService.products.getAllPaginated(params)
    }

    request
      .then(({ data }) => {
        if (!cancelled) {
          const resData = data
          const content = resData?.content ?? (Array.isArray(resData) ? resData : [])
          setProducts(content)
          setTotalPages(resData?.totalPages ?? 1)
          setTotalItems(resData?.totalElements ?? content.length)
        }
      })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [searchQ, category, sort, page, categoryIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayProducts = products
  const currentSort     = SORT_OPTIONS.find(o => o.value === sort) ?? SORT_OPTIONS[0]

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>
            {searchQ ? `Results for "${searchQ}"` : category !== 'All' ? category : 'All Products'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {totalItems === 0
              ? 'No products found'
              : `Showing ${totalItems ? page * PRODUCTS_PER_PAGE + 1 : 0}-${Math.min(totalItems, (page + 1) * PRODUCTS_PER_PAGE)} of ${totalItems} products`}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 300 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: searchQ ? 'var(--accent)' : 'var(--muted-dark)', pointerEvents: 'none', transition: 'color 0.2s' }} />
            <input
              value={searchQ}
              onChange={e => setParam('search', e.target.value)}
              placeholder="Search products…"
              style={{
                width: '100%', height: 40,
                paddingLeft: 36, paddingRight: searchQ ? 36 : 14,
                background: 'var(--glass-bg)',
                border: `1px solid ${searchQ ? 'var(--accent-border)' : 'var(--glass-border)'}`,
                borderRadius: 10, color: 'var(--text)', fontSize: 13,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: searchQ ? '0 0 0 3px var(--accent-dim)' : 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent-focus)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
              onBlur={e => { if (!searchQ) { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none' } }}
            />
            {searchQ && (
              <button onClick={() => setParam('search', '')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', display: 'flex', padding: 2, cursor: 'pointer' }}>
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
                      color: active ? 'var(--brand-text)' : 'var(--muted)',
                      border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
                      cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s',
                    }}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-pill"
                        style={{
                          position: 'absolute', inset: 0,
                          background: 'var(--accent)', borderRadius: 100,
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
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <SlidersHorizontal size={14} style={{ color: 'var(--muted)' }} />
              {currentSort.label}
              <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
            </button>
            {sortOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', minWidth: 180, zIndex: 20 }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setParam('sort', opt.value); setSortOpen(false) }}
                    style={{ width: '100%', padding: '10px 16px', fontSize: 13, background: opt.value === sort ? 'var(--accent-dim)' : 'none', color: opt.value === sort ? 'var(--accent)' : 'var(--text-secondary)', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'block' }}>
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
            <p style={{ fontSize: 16, color: 'var(--muted)' }}>No products found.</p>
          </div>
        ) : (
          <div className="grid-4">
            {displayProducts.map((p, i) => (
              <Reveal key={p.productId ?? p.id} delay={Math.min(i * 0.04, 0.28)}>
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
                style={{ width: 36, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 500, background: i === page ? 'var(--accent)' : 'var(--surface)', color: i === page ? 'var(--brand-text)' : 'var(--muted)', border: `1px solid ${i === page ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
