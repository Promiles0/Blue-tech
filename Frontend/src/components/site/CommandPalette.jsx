import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useUI } from '../../context/UIContext'
import api from '../../api/axios'

export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useUI()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef              = useRef(null)
  const navigate              = useNavigate()

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
    }
  }, [paletteOpen])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/products/search?name=${encodeURIComponent(query)}&size=6`)
        const list = data?.content ?? (Array.isArray(data) ? data : [])
        setResults(list)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => clearTimeout(timer)
  }, [query])

  const go = (id) => { navigate(`/products/${id}`); setPaletteOpen(false) }

  return (
    <AnimatePresence>
      {paletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPaletteOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(6px)',
              zIndex: 300,
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: 'fixed',
              top: 72, left: '50%', transform: 'translateX(-50%)',
              width: 'min(560px, calc(100vw - 32px))',
              background: '#141414', border: '1px solid #2a2a2a',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
              zIndex: 301,
            }}
          >
            {/* Search row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 20px', borderBottom: '1px solid #1e1e1e',
            }}>
              <Search size={17} style={{ color: '#888', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 15 }}
              />
              <kbd style={{
                fontSize: 11, color: '#555',
                border: '1px solid #2a2a2a', borderRadius: 5,
                padding: '3px 7px', fontFamily: 'inherit',
              }}>
                Esc
              </kbd>
            </div>

            {/* Results */}
            {loading && (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: '#555', fontSize: 13 }}>
                Searching…
              </div>
            )}

            {!loading && results.length > 0 && (
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {results.map(p => {
                  const img = p.images?.find(i => i.primary)?.imageUrl ?? p.images?.[0]?.imageUrl ?? p.imageUrl
                  return (
                    <button
                      key={p.id}
                      onClick={() => go(p.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 20px', background: 'none', border: 'none',
                        cursor: 'pointer', transition: 'background 0.12s', textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1c1c1c'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: 46, height: 46, borderRadius: 8, overflow: 'hidden', background: '#1c1c1c', flexShrink: 0 }}>
                        {img && <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 2 }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: '#555' }}>
                          {p.category?.name ?? ''}{p.category?.name ? ' · ' : ''}${parseFloat(p.price ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {!loading && query.trim() && results.length === 0 && (
              <div style={{ padding: '28px 20px', textAlign: 'center', color: '#444', fontSize: 14 }}>
                No results for "{query}"
              </div>
            )}

            {!query && (
              <div style={{ padding: '16px 20px', display: 'flex', gap: 24 }}>
                {[
                  { label: 'Shop all', to: '/products' },
                  { label: 'Audio', to: '/products?category=Audio' },
                  { label: 'Wearables', to: '/products?category=Wearables' },
                ].map(({ label, to }) => (
                  <button
                    key={label}
                    onClick={() => { navigate(to); setPaletteOpen(false) }}
                    style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', transition: 'color 0.15s', padding: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#555'}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 20 }}>
              <span style={{ fontSize: 11, color: '#333' }}>↵ select</span>
              <span style={{ fontSize: 11, color: '#333' }}>esc close</span>
              <span style={{ fontSize: 11, color: '#333' }}>⌘K toggle</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
