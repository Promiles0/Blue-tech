import { specRows } from '../../lib/specTemplates'

// The general facts every product can have, ahead of its category-specific specs.
function generalRows(product) {
  return [
    ['Brand', product.brand],
    ['Model', product.modelNumber],
    ['Condition', product.condition],
    ['Warranty', product.warranty],
  ].filter(([, value]) => value && String(value).trim())
    .map(([label, value]) => ({ key: label.toLowerCase(), label, value: String(value) }))
}

// Specifications table for the product page (full) and quick view (`limit` rows).
export default function ProductSpecs({ product, limit, compact = false }) {
  const rows = [...(compact ? [] : generalRows(product)), ...specRows(product)]
  const shown = limit ? rows.slice(0, limit) : rows
  if (shown.length === 0) return null

  return (
    <dl style={{
      margin: 0, display: 'grid', gridTemplateColumns: 'minmax(110px, 38%) 1fr',
      border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
      fontSize: compact ? 12.5 : 14,
    }}>
      {shown.map((row, i) => (
        <div key={row.key} style={{ display: 'contents' }}>
          <dt style={{
            padding: compact ? '8px 12px' : '11px 16px', color: 'var(--muted)', fontWeight: 500,
            background: 'var(--surface)', borderTop: i ? '1px solid var(--border)' : 'none',
          }}>
            {row.label}
          </dt>
          <dd style={{
            margin: 0, padding: compact ? '8px 12px' : '11px 16px', color: 'var(--text)',
            borderTop: i ? '1px solid var(--border)' : 'none', overflowWrap: 'anywhere', lineHeight: 1.5,
          }}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
