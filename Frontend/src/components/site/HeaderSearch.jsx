import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, X, ArrowRight, Loader2 } from 'lucide-react'
import apiService from '../../api/service'
import { useT } from '../../lib/i18n'
import { useCurrency } from '../../context/CurrencyContext'
import { getProductThumb, handleProductImageError } from '../../lib/productImage'

// Always-visible search with live suggestions (UX audit B1). Enter (or "See all results")
// opens the full search page; arrow keys move through the suggestions.
export default function HeaderSearch({ className = '' }) {
  const { t } = useT()
  const { formatPrice } = useCurrency()
  const navigate = useNavigate()
  const location = useLocation()
  const listId = useId()
  const boxRef = useRef(null)
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  // Close when the page changes.
  const [seenKey, setSeenKey] = useState(location.key)
  if (seenKey !== location.key) { setSeenKey(location.key); setOpen(false); setActive(-1) }

  const q = query.trim()
  useEffect(() => {
    if (q.length < 2) return
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams({ name: q, size: '6' })
      apiService.products.search(params)
        .then(({ data }) => { if (!cancelled) setResults(data?.content ?? (Array.isArray(data) ? data : [])) })
        .catch(() => { if (!cancelled) setResults([]) })
        .finally(() => { if (!cancelled) { setLoading(false); setActive(-1) } })
    }, 220)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [q])
  const shown = q.length >= 2 ? results : []

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const showAll = () => {
    const q = query.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    setOpen(false)
    inputRef.current?.blur()
  }
  const goTo = (p) => {
    navigate(`/products/${p.productId ?? p.id}`)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, shown.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Escape') { setOpen(false); setActive(-1) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0 && shown[active]) goTo(shown[active])
      else showAll()
    }
  }

  const showPanel = open && query.trim().length >= 2

  return (
    <div ref={boxRef} className={`hdr-search ${className}`} role="search">
      <Search size={16} className="hdr-search-icon" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t('Search laptops, printers, screens…')}
        aria-label={t('Search products')}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
      />
      {query && (
        <button type="button" className="hdr-search-clear" onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label={t('Clear search')}>
          <X size={14} />
        </button>
      )}

      {showPanel && (
        <div className="hdr-search-panel">
          <ul id={listId} role="listbox" aria-label={t('Suggestions')}>
            {shown.map((p, i) => (
              <li
                key={p.productId ?? p.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={`hdr-sugg${i === active ? ' active' : ''}`}
                onMouseDown={e => e.preventDefault()}
                onClick={() => goTo(p)}
                onMouseEnter={() => setActive(i)}
              >
                <span className="hdr-sugg-img">
                  <img src={getProductThumb(p)} alt="" onError={handleProductImageError} />
                </span>
                <span className="hdr-sugg-name">{p.name}</span>
                <span className="hdr-sugg-price">{formatPrice(parseFloat(p.startingPrice ?? p.price) || 0)}</span>
              </li>
            ))}
          </ul>
          {loading && !shown.length && (
            <p className="hdr-sugg-note"><Loader2 size={14} className="animate-spin" /> {t('Searching…')}</p>
          )}
          {!loading && !shown.length && (
            <p className="hdr-sugg-note">{t('No quick matches. Press Enter to search everything.')}</p>
          )}
          <button type="button" className="hdr-sugg-all" onMouseDown={e => e.preventDefault()} onClick={showAll}>
            {t('See all results for “{q}”', { q: query.trim() })} <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
