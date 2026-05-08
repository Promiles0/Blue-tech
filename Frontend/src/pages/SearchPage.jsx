import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Clock, X, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [total, setTotal]               = useState(0)
  const [recent, setRecent]             = useState(getRecent)
  const query = searchParams.get('q') ?? ''

  const doSearch = useCallback((q) => {
    if (!q.trim()) { setProducts([]); setTotal(0); return }
    setLoading(true)
    api.get(`/products/search?name=${encodeURIComponent(q)}&size=24`)
      .then(({ data }) => {
        const content = data?.content ?? (Array.isArray(data) ? data : [])
        setProducts(content)
        setTotal(data?.totalElements ?? content.length)
      })
      .catch(() => { setProducts([]); setTotal(0) })
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

  const clearRecent = (q) => { removeRecent(q); setRecent(getRecent()) }

  return (
    <div style={{ padding: '56px 0 96px' }}>
      <div className="container-noir">

        {/* Search bar */}
        <div style={{ maxWidth: 780, margin: '0 auto 52px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute', left: 20, top: '50%',
                transform: 'translateY(-50%)',
                color: query ? '#7c5cf0' : '#444',
                pointerEvents: 'none',
                transition: 'color 0.2s',
              }}
            />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products…"
              style={{
                width: '100%',
                height: 56,
                paddingLeft: 52,
                paddingRight: query ? 48 : 20,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${query ? 'rgba(124,92,240,0.35)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16,
                color: '#fff',
                fontSize: 16,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: query ? '0 0 0 3px rgba(124,92,240,0.08)' : 'none',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(124,92,240,0.4)'
                e.target.style.boxShadow = '0 0 0 3px rgba(124,92,240,0.08)'
              }}
              onBlur={e => {
                if (!query) {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQuery('')}
                  style={{
                    position: 'absolute', right: 16, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none', borderRadius: '50%',
                    width: 26, height: 26,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#888', cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#888' }}
                >
                  <X size={13} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Recent searches */}
        <AnimatePresence>
          {!query && recent.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              style={{ maxWidth: 780, margin: '0 auto 52px' }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#444', textTransform: 'uppercase', marginBottom: 14 }}>
                Recent searches
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {recent.map(q => (
                  <div
                    key={q}
                    style={{
                      display: 'flex', alignItems: 'center',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 100, overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => setQuery(q)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '7px 4px 7px 12px',
                        background: 'none', border: 'none',
                        color: '#aaa', fontSize: 13, cursor: 'pointer',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
                    >
                      <Clock size={11} style={{ color: '#555' }} /> {q}
                    </button>
                    <button
                      onClick={() => clearRecent(q)}
                      style={{
                        padding: '7px 10px 7px 4px',
                        background: 'none', border: 'none',
                        color: '#444', cursor: 'pointer', display: 'flex',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#888'}
                      onMouseLeave={e => e.currentTarget.style.color = '#444'}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {query && (
          <>
            <div style={{ marginBottom: 28, display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                {loading ? 'Searching…' : `"${query}"`}
              </h1>
              {!loading && (
                <span style={{ fontSize: 13, color: '#555' }}>
                  {total} result{total !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 300, borderRadius: 12 }} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Search size={36} style={{ margin: '0 auto 16px', color: '#2a2a2a' }} />
                <p style={{ fontSize: 16, color: '#555', marginBottom: 6 }}>
                  No results for <span style={{ color: '#fff' }}>"{query}"</span>
                </p>
                <p style={{ fontSize: 13, color: '#333', marginBottom: 24 }}>
                  Try a different keyword or browse the full catalogue
                </p>
                <Link
                  to="/products"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 14, color: '#7c5cf0', textDecoration: 'none',
                    border: '1px solid rgba(124,92,240,0.3)',
                    borderRadius: 10, padding: '9px 18px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,240,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Browse all products <ArrowRight size={14} />
                </Link>
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

        {/* Empty state */}
        {!query && recent.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(124,92,240,0.08)',
              border: '1px solid rgba(124,92,240,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Search size={24} style={{ color: '#7c5cf0' }} />
            </div>
            <p style={{ fontSize: 16, color: '#555', marginBottom: 6 }}>What are you looking for?</p>
            <p style={{ fontSize: 13, color: '#333' }}>Start typing to search across all products</p>
          </div>
        )}
      </div>
    </div>
  )
}
