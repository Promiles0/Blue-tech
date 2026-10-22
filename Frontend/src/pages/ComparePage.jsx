import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, GitCompare, Sparkles, ShoppingBag } from 'lucide-react'
import apiService from '../api/service'
import { useCurrency } from '../context/CurrencyContext'
import { useCompare, removeCompare, clearCompare } from '../lib/compare'
import { specRows } from '../lib/specTemplates'
import { productImageList, handleProductImageError } from '../lib/productImage'
import { openLiveChat } from '../lib/liveChat'
import { usePageMeta } from '../hooks/usePageMeta'
import { useT } from '../lib/i18n'

const GENERAL = [
  ['Brand', (p) => p.brand],
  ['Model', (p) => p.modelNumber],
  ['Condition', (p) => p.condition],
  ['Warranty', (p) => p.warranty],
]

export default function ComparePage() {
  const { t } = useT()
  usePageMeta({ title: 'Compare products | Blue-Tech' })
  const { formatPrice } = useCurrency()
  const picked = useCompare()
  const [details, setDetails] = useState({})
  const [onlyDiff, setOnlyDiff] = useState(false)

  useEffect(() => {
    picked.filter((p) => !details[p.id]).forEach((p) => {
      apiService.products.getOne(p.id)
        .then(({ data }) => setDetails((d) => ({ ...d, [p.id]: data })))
        .catch(() => removeCompare(p.id))
    })
  }, [picked]) // eslint-disable-line react-hooks/exhaustive-deps

  const products = picked.map((p) => details[p.id]).filter(Boolean)

  if (picked.length === 0) {
    return (
      <div className="container-noir" style={{ padding: '96px 0', textAlign: 'center' }}>
        <GitCompare size={36} style={{ color: 'var(--muted-dark)', marginBottom: 16 }} />
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>{t('Nothing to compare yet')}</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>{t('Tap "Compare" on up to 3 products to see them side by side.')}</p>
        <Link to="/products" className="noir-btn-primary" style={{ display: 'inline-flex', padding: '11px 22px', fontSize: 14 }}>{t('Browse products')}</Link>
      </div>
    )
  }

  // Spec rows: general facts first, then every spec any of the products has.
  const specLabels = []
  const specByProduct = {}
  products.forEach((p) => {
    specByProduct[p.productId ?? p.id] = {}
    specRows(p).forEach((r) => {
      if (!specLabels.includes(r.label)) specLabels.push(r.label)
      specByProduct[p.productId ?? p.id][r.label] = r.value
    })
  })
  const rows = [
    ['Price', (p) => formatPrice(p.price)],
    ...GENERAL,
    ...specLabels.map((label) => [label, (p) => specByProduct[p.productId ?? p.id]?.[label]]),
  ].map(([label, get]) => {
    const values = products.map((p) => get(p) ?? null)
    const differs = new Set(values.map((v) => String(v ?? '—').toLowerCase())).size > 1
    return { label, values, differs }
  }).filter((r) => r.values.some((v) => v != null && v !== ''))

  const shown = onlyDiff ? rows.filter((r) => r.differs || r.label === 'Price') : rows
  const askBlue = () => openLiveChat(
    `Help me choose between: ${products.map((p) => p.name).join(', ')}. What's the difference and which fits me best?`,
    { send: true },
  )

  return (
    <div className="container-noir" style={{ padding: '48px 0 96px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(26px,3vw,34px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {t('Compare products')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{t('Differences are highlighted.')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            {t('Only show differences')}
          </label>
          {products.length > 1 && (
            <button onClick={askBlue} className="noir-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, padding: '9px 16px' }}>
              <Sparkles size={14} /> {t('Ask Blue which to pick')}
            </button>
          )}
          <button onClick={clearCompare} className="noir-btn-outline" style={{ fontSize: 13, padding: '9px 16px' }}>{t('Clear all')}</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 16 }}>
        <table className="compare-table" style={{ minWidth: 220 + products.length * 200 }}>
          <thead>
            <tr>
              <th />
              {products.map((p) => {
                const id = p.productId ?? p.id
                return (
                  <th key={id}>
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => removeCompare(id)} aria-label={t('Remove {name}', { name: p.name })} className="compare-remove"><X size={14} /></button>
                      <Link to={`/products/${id}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
                        <div className="compare-img">
                          <img src={productImageList(p)[0]} alt="" onError={handleProductImageError} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 10, lineHeight: 1.3 }}>{p.name}</div>
                      </Link>
                      <Link to={`/products/${id}`} className="compare-view"><ShoppingBag size={13} /> View &amp; buy</Link>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.label} className={r.differs ? 'differs' : ''}>
                <th scope="row">{t(r.label)}</th>
                {r.values.map((v, i) => <td key={i} style={r.label === 'Price' ? { color: 'var(--price)', fontWeight: 700 } : undefined}>{v ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {picked.length < 3 && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 16 }}>
          {t('You can add {n} more — tap "Compare" on any product.', { n: 3 - picked.length })} <Link to="/products" style={{ color: 'var(--accent-light, var(--accent))' }}>{t('Browse products')}</Link>
        </p>
      )}

      <style>{`
        .compare-table{width:100%;border-collapse:collapse;font-size:13.5px}
        .compare-table th,.compare-table td{padding:12px 18px;text-align:left;vertical-align:top;border-bottom:1px solid var(--border);color:var(--text)}
        .compare-table thead th{vertical-align:bottom;width:${products.length ? Math.floor(80 / products.length) : 80}%}
        .compare-table thead th:first-child{width:20%}
        .compare-table tbody th{font-weight:600;color:var(--muted);font-size:12.5px;white-space:nowrap}
        .compare-table tr.differs td{background:var(--accent-dim)}
        .compare-img{aspect-ratio:4/3;border-radius:10px;background:#fff;overflow:hidden;max-width:200px}
        .compare-img img{width:100%;height:100%;object-fit:contain}
        .compare-remove{position:absolute;top:6px;right:6px;z-index:1;width:26px;height:26px;border-radius:50%;border:1px solid var(--border);background:var(--surface);color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer}
        .compare-view{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12.5px;font-weight:600;color:var(--accent-light,var(--accent));text-decoration:none}
      `}</style>
    </div>
  )
}
