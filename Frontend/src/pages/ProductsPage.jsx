import { useState, useEffect } from 'react'
import { useT } from '../lib/i18n'
import { useSearchParams } from 'react-router-dom'
import NoResultsHelp from '../components/site/NoResultsHelp'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import FilterRail from '../components/site/FilterRail'
import { FILTER_FACETS } from '../lib/specTemplates'
import apiService from '../api/service'
import { usePageMeta } from '../hooks/usePageMeta'

const PRODUCTS_PER_PAGE = 12
const SORT_OPTIONS = [
  { label: 'Newest',          value: 'updatedAt,desc' },
  { label: 'Price: Low–High', value: 'price,asc' },
  { label: 'Price: High–Low', value: 'price,desc' },
  { label: 'Name A–Z',        value: 'name,asc' },
]
// One-tap price bands (RWF); they fill the price filter.
const BUDGETS = [
  { label: 'Under 500k',  min: '',        max: '500000' },
  { label: '500k – 1M',   min: '500000',  max: '1000000' },
  { label: '1M – 2M',     min: '1000000', max: '2000000' },
  { label: '2M+',         min: '2000000', max: '' },
]
const FACET_KEYS = FILTER_FACETS.map(f => f.key)
// "brand=HP|Lenovo" in the address bar ("|" since spec values can hold commas).
const splitList = (v) => (v ? v.split('|').map(s => s.trim()).filter(Boolean) : [])

// The Store: every filter, the sort and the page live in the URL, so Back, refresh and shared
// links all keep them (UX audit B4).
export default function Products() {
  const { t } = useT()
  usePageMeta({
    title: 'Shop laptops, printers, monitors and more in Rwanda | Blue-Tech',
    description: 'Browse every product at Blue-Tech Kigali: laptops, desktops, printers, monitors, networking and accessories, with prices in RWF and delivery across Rwanda.',
    path: '/products',
  })
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [failed, setFailed]     = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const searchQ  = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? 'All'
  const sort     = searchParams.get('sort') ?? 'updatedAt,desc'
  const page     = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0)
  const minPrice = searchParams.get('minPrice') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''
  const selected = Object.fromEntries(FACET_KEYS.map(k => [k, splitList(searchParams.get(k))]))
  const facetKey = FACET_KEYS.map(k => searchParams.get(k) ?? '').join('~')

  // Price boxes update the URL after a short pause, not on every keystroke.
  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice })
  const [urlPrice, setUrlPrice] = useState(`${minPrice}~${maxPrice}`)
  if (urlPrice !== `${minPrice}~${maxPrice}`) { setUrlPrice(`${minPrice}~${maxPrice}`); setPriceDraft({ min: minPrice, max: maxPrice }) }

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiService.categories.getAll()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 1000 * 60 * 5,
  })
  const activeCategory = category !== 'All' ? categories.find(c => c.name === category || c.categoryName === category) : null
  const categoryId = activeCategory?.categoryId ?? ''

  const { data: facets = {} } = useQuery({
    queryKey: ['facets', categoryId],
    queryFn: () => apiService.products.facets(categoryId || undefined).then(r => (r.data && typeof r.data === 'object' ? r.data : {})),
    staleTime: 1000 * 60 * 5,
  })

  const update = (changes, { keepPage = false } = {}) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, val] of Object.entries(changes)) {
      if (val) next.set(key, val); else next.delete(key)
    }
    if (!keepPage) next.delete('page')
    setSearchParams(next)
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (priceDraft.min !== minPrice || priceDraft.max !== maxPrice) update({ minPrice: priceDraft.min, maxPrice: priceDraft.max })
    }, 500)
    return () => clearTimeout(id)
  }, [priceDraft]) // eslint-disable-line react-hooks/exhaustive-deps

  const categoriesReady = category === 'All' || categories.length > 0
  useEffect(() => {
    if (!categoriesReady) return
    let cancelled = false
    setLoading(true)
    setFailed(false)
    const params = new URLSearchParams()
    if (searchQ) params.set('name', searchQ)
    if (categoryId) params.set('categoryId', categoryId)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    for (const key of FACET_KEYS) if (selected[key].length) params.set(key, selected[key].join('|'))
    params.set('sort', sort)
    params.set('page', String(page))
    params.set('size', String(PRODUCTS_PER_PAGE))

    apiService.products.search(params)
      .then(({ data }) => {
        if (cancelled) return
        const content = data?.content ?? (Array.isArray(data) ? data : [])
        setProducts(content)
        setTotalPages(data?.totalPages ?? 1)
        setTotalItems(data?.totalElements ?? content.length)
      })
      .catch(() => { if (!cancelled) { setProducts([]); setFailed(true) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [searchQ, categoryId, categoriesReady, minPrice, maxPrice, facetKey, sort, page, reloadKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFacet = (key, value) => {
    const current = selected[key]
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    update({ [key]: next.join('|') })
  }
  const clearAll = () => {
    const next = new URLSearchParams()
    if (category !== 'All') next.set('category', category)
    if (sort !== 'updatedAt,desc') next.set('sort', sort)
    setSearchParams(next)
  }
  const goToPage = (n) => {
    update({ page: n > 0 ? String(n) : '' }, { keepPage: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtersForRail = { selected, minPrice: priceDraft.min, maxPrice: priceDraft.max }
  const activeCount = FACET_KEYS.reduce((n, k) => n + selected[k].length, 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)
  const facetLabel = (key) => t(FILTER_FACETS.find(f => f.key === key)?.label ?? key)
  const chips = [
    ...(searchQ ? [{ id: 'search', label: `“${searchQ}”`, clear: () => update({ search: '' }) }] : []),
    ...FACET_KEYS.flatMap(k => selected[k].map(v => ({ id: `${k}:${v}`, label: `${facetLabel(k)}: ${v}`, clear: () => toggleFacet(k, v) }))),
    ...(minPrice || maxPrice ? [{ id: 'price', label: `${t('Price')}: ${Number(minPrice || 0).toLocaleString('en')} – ${maxPrice ? Number(maxPrice).toLocaleString('en') : '∞'} RWF`, clear: () => update({ minPrice: '', maxPrice: '' }) }] : []),
  ]
  const title = searchQ
    ? t('Results for "{q}"', { q: searchQ })
    : category !== 'All' ? t(category) : t('All products')

  return (
    <div style={{ paddingTop: 32, paddingBottom: 80 }}>
      <div className="container-noir">
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 'clamp(26px, 3.4vw, 32px)', fontWeight: 900, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>{title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }} aria-live="polite">
            {loading ? t('Loading…') : totalItems === 0 ? t('No products found') : t('{n} products', { n: totalItems })}
          </p>
        </div>

        {/* Categories: one swipeable row on phones */}
        <div className="cat-pills" role="group" aria-label={t('Categories')}>
          {['All', ...categories.map(c => c.name)].map(cat => {
            const on = category === cat || (cat === 'All' && category === 'All')
            return (
              <button key={cat} type="button" aria-pressed={on} className={`cat-pill${on ? ' on' : ''}`}
                onClick={() => update({ category: cat === 'All' ? '' : cat, ...Object.fromEntries(FACET_KEYS.filter(k => k !== 'brand').map(k => [k, ''])) })}>
                {t(cat)}
              </button>
            )
          })}
        </div>

        <div className="shop-layout" style={{ marginTop: 20 }}>
          <FilterRail
            filters={filtersForRail}
            setters={{
              toggleFacet,
              setMinPrice: (v) => setPriceDraft(d => ({ ...d, min: v })),
              setMaxPrice: (v) => setPriceDraft(d => ({ ...d, max: v })),
            }}
            facets={facets}
            activeCount={activeCount}
            onClearAll={clearAll}
            mobileOpen={mobileFiltersOpen}
            onMobileClose={() => setMobileFiltersOpen(false)}
          />

          <div style={{ minWidth: 0 }}>
            {/* Toolbar: budget, filters (phones), sort */}
            <div className="shop-toolbar">
              <div className="budget-chips" role="group" aria-label={t('Shop by budget')} style={{ marginTop: 0 }}>
                {BUDGETS.map(b => {
                  const on = minPrice === b.min && maxPrice === b.max
                  return (
                    <button key={b.label} type="button" aria-pressed={on} className={`budget-chip ${on ? 'on' : ''}`}
                      onClick={() => update(on ? { minPrice: '', maxPrice: '' } : { minPrice: b.min, maxPrice: b.max })}>
                      {t(b.label)}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button type="button" className="filter-mobile-btn noir-btn-outline" onClick={() => setMobileFiltersOpen(true)} style={{ fontSize: 13, padding: '9px 14px' }}>
                  <SlidersHorizontal size={14} /> {t('Filters')}{activeCount > 0 ? ` (${activeCount})` : ''}
                </button>
                <label className="sort-select">
                  <span className="sr-only">{t('Sort by')}</span>
                  <select value={sort} onChange={e => update({ sort: e.target.value === 'updatedAt,desc' ? '' : e.target.value })}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="active-chips">
                {chips.map(c => (
                  <button key={c.id} type="button" className="active-chip" onClick={c.clear} aria-label={t('Remove filter {f}', { f: c.label })}>
                    {c.label} <X size={13} />
                  </button>
                ))}
                <button type="button" className="link-btn" onClick={clearAll}>{t('Clear all')}</button>
              </div>
            )}

            {loading ? (
              <div className="grid-4">
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton card-skeleton" />)}
              </div>
            ) : failed ? (
              <div role="alert" style={{ textAlign: 'center', padding: '56px 16px', border: '1px solid var(--border)', borderRadius: 12 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{t("Couldn't load products")}</p>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 18 }}>{t('Check your connection and try again.')}</p>
                <button type="button" onClick={() => setReloadKey(k => k + 1)} className="noir-btn-primary" style={{ fontSize: 13 }}>{t('Try again')}</button>
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 0' }}>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 14 }}>{t('No products match these filters.')}</p>
                {activeCount > 0 && <button type="button" onClick={clearAll} className="noir-btn-outline" style={{ fontSize: 13 }}>{t('Clear filters')}</button>}
                {searchQ && <NoResultsHelp query={searchQ} />}
              </div>
            ) : (
              <div className="grid-4">
                {products.map(p => <ProductCard key={p.productId ?? p.id} product={p} />)}
              </div>
            )}

            {totalPages > 1 && !loading && (
              <Pagination page={page} totalPages={totalPages} onPage={goToPage} t={t} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Previous / numbers (with gaps) / Next.
function Pagination({ page, totalPages, onPage, t }) {
  const pages = [...new Set([0, page - 1, page, page + 1, totalPages - 1])].filter(n => n >= 0 && n < totalPages).sort((a, b) => a - b)
  const items = []
  pages.forEach((n, i) => {
    if (i > 0 && n - pages[i - 1] > 1) items.push(`gap-${n}`)
    items.push(n)
  })
  return (
    <nav aria-label={t('Pages')} className="pager">
      <button type="button" className="pager-btn" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label={t('Previous page')}>
        <ChevronLeft size={16} />
      </button>
      {items.map(n => typeof n === 'string'
        ? <span key={n} className="pager-gap" aria-hidden>…</span>
        : (
          <button key={n} type="button" className={`pager-btn${n === page ? ' on' : ''}`} aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}>
            {n + 1}
          </button>
        ))}
      <button type="button" className="pager-btn" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} aria-label={t('Next page')}>
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
