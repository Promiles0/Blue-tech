import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Clock, X } from 'lucide-react'
import { Reveal } from '../lib/motion'
import ProductCard from '../components/ProductCard'
import api from '../api/axios'

const STORAGE_KEY = 'noir_recent_searches'
const MAX_RECENT  = 6

function getRecent() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function saveRecent(query) {
  const prev = getRecent().filter(q => q !== query)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENT)))
}
function removeRecent(query) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getRecent().filter(q => q !== query)))
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts]         = useState([])
  const [loading, setLoading]           = useState(false)
  const [recent, setRecent]             = useState(getRecent)
  const query = searchParams.get('q') ?? ''

  const doSearch = useCallback((q) => {
    if (!q.trim()) { setProducts([]); return }
    setLoading(true)
    api.get(`/products/search?name=${encodeURIComponent(q)}&size=24`)
      .then(({ data }) => setProducts(data?.content ?? (Array.isArray(data) ? data : [])))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query)
      if (query.trim()) { saveRecent(query.trim()); setRecent(getRecent()) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const setQuery = (q) => {
    const p = new URLSearchParams(searchParams)
    if (q) p.set('q', q); else p.delete('q')
    setSearchParams(p)
  }

  const clearRecent = (q) => {
    removeRecent(q)
    setRecent(getRecent())
  }

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">
        {/* Search bar */}
        <div style={{ maxWidth: 600, margin: '0 auto 48px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products…"
            className="noir-input"
            style={{ paddingLeft: 48, paddingRight: query ? 42 : 18, height: 52, fontSize: 16, borderRadius: 14 }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#555', display: 'flex', padding: 4, cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Recent searches */}
        {!query && recent.length > 0 && (
          <div style={{ maxWidth: 600, margin: '0 auto 48px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#444', textTransform: 'uppercase', marginBottom: 12 }}>Recent</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recent.map(q => (
                <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#141414', border: '1px solid #2a2a2a', borderRadius: 100, overflow: 'hidden' }}>
                  <button onClick={() => setQuery(q)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px 6px 10px', background: 'none', border: 'none', color: '#ccc', fontSize: 13, cursor: 'pointer' }}>
                    <Clock size={12} color="#555" /> {q}
                  </button>
                  <button onClick={() => clearRecent(q)}
                    style={{ padding: '6px 10px 6px 2px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex' }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {query && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {loading ? 'Searching…' : `Results for "${query}"`}
              </h1>
              {!loading && <p style={{ fontSize: 13, color: '#555' }}>{products.length} product{products.length !== 1 ? 's' : ''}</p>}
            </div>

            {loading ? (
              <div className="grid-4">
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 12 }} />)}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ fontSize: 16, color: '#888', marginBottom: 16 }}>No products found for "{query}".</p>
                <Link to="/products" style={{ color: '#7c5cf0', fontSize: 14 }}>Browse all products →</Link>
              </div>
            ) : (
              <div className="grid-4">
                {products.map((p, i) => (
                  <Reveal key={p.productId ?? p.id} delay={Math.min(i * 0.04, 0.24)}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty state — no query, no recent */}
        {!query && recent.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Search size={40} style={{ margin: '0 auto 16px', color: '#2a2a2a' }} />
            <p style={{ fontSize: 15, color: '#555' }}>Start typing to search products.</p>
          </div>
        )}
      </div>
    </div>
  )
}
