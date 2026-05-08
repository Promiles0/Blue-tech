import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowRight, TrendingUp } from 'lucide-react'
import { useUI } from '../../context/UIContext'
import { useQuery } from '@tanstack/react-query'
import apiService from '../../api/service'

export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useUI()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef  = useRef(null)
  const navigate  = useNavigate()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiService.categories.getAll()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 1000 * 60 * 5,
  })

  // Global keyboard shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(o => !o) }
      if (e.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPaletteOpen])

  // Focus + reset on open
  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 80)
      setQuery('')
      setResults([])
      setActiveIdx(-1)
    }
  }, [paletteOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!paletteOpen) return
    const onKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
      if (e.key === 'Enter' && activeIdx >= 0 && results[activeIdx]) {
        go(results[activeIdx].productId ?? results[activeIdx].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paletteOpen, results, activeIdx])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setActiveIdx(-1); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('name', query)
        params.set('size', '6')
        const { data } = await apiService.products.search(params)
        const list = data?.content ?? (Array.isArray(data) ? data : [])
        setResults(list)
        setActiveIdx(-1)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 260)
    return () => clearTimeout(timer)
  }, [query])

  const go = (id) => { navigate(`/products/${id}`); setPaletteOpen(false) }
  const goSearch = () => {
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setPaletteOpen(false) }
  }

  return (
    <AnimatePresence>
      {paletteOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPaletteOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 300,
            }}
          />

          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -12 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: 'fixed',
              top: 80, left: '50%', transform: 'translateX(-50%)',
              width: 'min(580px, calc(100vw - 32px))',
              background: 'rgba(14,14,16,0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 32px 96px rgba(0,0,0,0.85), 0 0 0 1px rgba(124,92,240,0.08)',
              zIndex: 301,
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Search input row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Search size={17} style={{ color: '#7c5cf0', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !activeIdx) goSearch() }}
                placeholder="Search products, categories…"
                style={{
                  flex: 1, background: 'none', border: 'none',
                  outline: 'none', color: '#fff', fontSize: 15,
                  fontFamily: 'inherit',
                }}
              />
              {query ? (
                <button
                  onClick={goSearch}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12, color: '#7c5cf0',
                    background: 'rgba(124,92,240,0.1)',
                    border: '1px solid rgba(124,92,240,0.2)',
                    borderRadius: 8, padding: '4px 10px',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,240,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,92,240,0.1)'}
                >
                  See all <ArrowRight size={11} />
                </button>
              ) : (
                <kbd style={{
                  fontSize: 11, color: '#444',
                  border: '1px solid #2a2a2a', borderRadius: 6,
                  padding: '3px 8px', fontFamily: 'inherit',
                }}>
                  Esc
                </kbd>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 46, height: 46, borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skeleton" style={{ height: 13, width: '60%', borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 11, width: '35%', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                <div style={{ padding: '8px 20px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#444', textTransform: 'uppercase' }}>
                  Products
                </div>
                {results.map((p, i) => {
                  const pid = p.productId ?? p.id
                  const img = p.primaryImageUrl ?? p.images?.find(img => img.isPrimary)?.imageUrl ?? p.images?.[0]?.imageUrl
                  const price = parseFloat(p.startingPrice ?? p.price ?? 0)
                  const isActive = i === activeIdx
                  return (
                    <button
                      key={pid}
                      onClick={() => go(pid)}
                      onMouseEnter={() => setActiveIdx(i)}
                      onMouseLeave={() => setActiveIdx(-1)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '10px 20px', background: isActive ? 'rgba(124,92,240,0.08)' : 'none',
                        border: 'none', cursor: 'pointer', transition: 'background 0.1s', textAlign: 'left',
                        borderLeft: `2px solid ${isActive ? '#7c5cf0' : 'transparent'}`,
                      }}
                    >
                      <div style={{ width: 46, height: 46, borderRadius: 8, overflow: 'hidden', background: '#1c1c1c', flexShrink: 0 }}>
                        {img
                          ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', background: '#2a2a2a' }} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: isActive ? '#fff' : '#ddd', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: '#555' }}>
                          {p.categoryName ?? ''}{p.categoryName ? ' · ' : ''}
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>${price.toFixed(2)}</span>
                        </p>
                      </div>
                      <ArrowRight size={13} style={{ color: isActive ? '#7c5cf0' : '#333', flexShrink: 0, transition: 'color 0.1s' }} />
                    </button>
                  )
                })}
              </div>
            )}

            {/* No results */}
            {!loading && query.trim() && results.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>No results for <span style={{ color: '#fff' }}>"{query}"</span></p>
                <p style={{ fontSize: 12, color: '#333' }}>Try a different keyword or browse all products</p>
              </div>
            )}

            {/* Empty state — quick links */}
            {!query && (
              <div style={{ padding: '12px 20px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#444', textTransform: 'uppercase', marginBottom: 10 }}>
                  Browse
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <QuickLink label="All products" to="/products" navigate={navigate} close={() => setPaletteOpen(false)} />
                  {categories.slice(0, 5).map(cat => (
                    <QuickLink
                      key={cat.categoryId}
                      label={cat.name}
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      navigate={navigate}
                      close={() => setPaletteOpen(false)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Footer hints */}
            <div style={{
              padding: '8px 20px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', gap: 16, alignItems: 'center',
            }}>
              <Hint keys={['↑', '↓']} label="navigate" />
              <Hint keys={['↵']} label="open" />
              <Hint keys={['Esc']} label="close" />
              <Hint keys={['⌘', 'K']} label="toggle" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function QuickLink({ label, to, navigate, close }) {
  return (
    <button
      onClick={() => { navigate(to); close() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 100,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        color: '#888', fontSize: 13, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,92,240,0.12)'; e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(124,92,240,0.25)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
    >
      <TrendingUp size={11} /> {label}
    </button>
  )
}

function Hint({ keys, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {keys.map(k => (
        <kbd key={k} style={{ fontSize: 10, color: '#444', border: '1px solid #2a2a2a', borderRadius: 4, padding: '2px 5px', fontFamily: 'inherit' }}>{k}</kbd>
      ))}
      <span style={{ fontSize: 10, color: '#333', marginLeft: 2 }}>{label}</span>
    </div>
  )
}
