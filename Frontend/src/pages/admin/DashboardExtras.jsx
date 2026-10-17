import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Truck, MessageSquare, AlertTriangle, Plus, Tag, Download, Sparkles, Check } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

// "What needs me today" — each tile links straight to the page that clears it.
export function ActionCenter({ data, loading }) {
  const items = [
    { icon: FileText, label: 'New quote requests', value: data?.newQuotes, to: '/admin/quote-requests', tone: '#f59e0b' },
    { icon: Truck, label: 'Orders to ship', value: data?.toShip, to: '/admin/orders', tone: '#3b82f6' },
    { icon: MessageSquare, label: 'Reviews this week', value: data?.newReviews7d, to: '/admin/reviews', tone: 'var(--accent-light)' },
    { icon: AlertTriangle, label: 'Low-stock variants', value: data?.lowStockCount, to: '/admin/products?lowStock=1', tone: '#ef4444' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
      {items.map(({ icon: Icon, label, value, to, tone }) => {
        const n = loading ? null : (value ?? 0)
        const idle = n === 0
        return (
          <Link key={label} to={to} className="surface" style={{
            borderRadius: 12, padding: '14px 16px', textDecoration: 'none', color: 'var(--text)',
            display: 'flex', alignItems: 'center', gap: 12, opacity: idle ? 0.6 : 1,
            border: idle ? undefined : `1px solid ${tone}55`,
          }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${tone} 15%, transparent)`, color: tone, flexShrink: 0 }}>
              <Icon size={17} />
            </span>
            <div>
              <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{n ?? '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 4 }}>{idle ? `${label} — all clear` : label}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

const quickBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  border: '1px solid var(--admin-border)', color: 'var(--text)', textDecoration: 'none', background: 'transparent',
}

export function QuickActions() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Link to="/admin/products?new=1" style={{ ...quickBtn, background: 'var(--admin-primary)', borderColor: 'var(--admin-primary)', color: '#fff' }}><Plus size={14} /> Add product</Link>
      <Link to="/admin/coupons" style={quickBtn}><Tag size={14} /> Create coupon</Link>
      <Link to="/admin/orders" style={quickBtn}><Download size={14} /> Export orders</Link>
      <Link to="/admin/blue" style={quickBtn}><Sparkles size={14} /> Blue insights</Link>
    </div>
  )
}

// "+12% vs previous 30 days" under a KPI value.
export function Delta({ current, previous }) {
  const cur = Number(current) || 0
  const prev = Number(previous) || 0
  if (!prev && !cur) return null
  if (!prev) return <span style={{ fontSize: 11.5, color: 'var(--admin-success)', fontWeight: 600 }}>New this period</span>
  const pct = Math.round(((cur - prev) / prev) * 100)
  const up = pct >= 0
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, color: up ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% <span style={{ color: 'var(--admin-muted)', fontWeight: 500 }}>vs previous 30 days</span>
    </span>
  )
}

// Inline "set stock" for one low-stock variant.
export function RestockInput({ alert, onDone }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  if (!alert.variantId) return null
  const save = async (e) => {
    e.preventDefault()
    const n = Number(value)
    if (!Number.isInteger(n) || n < 0) { toast.error('Enter a whole number'); return }
    setBusy(true)
    try {
      await apiService.admin.products.setStock(alert.variantId, n)
      toast.success(`${alert.productName}: stock set to ${n}`)
      setValue('')
      onDone?.()
    } catch {
      toast.error('Could not update stock')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={save} style={{ display: 'flex', gap: 4 }}>
      <input
        type="number" min={0} value={value} onChange={e => setValue(e.target.value)} placeholder="New qty" aria-label={`New stock for ${alert.productName}`}
        style={{ width: 72, padding: '4px 8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--admin-border)', background: 'var(--glass-border)', color: 'var(--text)' }}
      />
      <button type="submit" disabled={busy || value === ''} aria-label="Save stock" style={{
        width: 28, borderRadius: 6, border: 0, background: 'var(--admin-primary)', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: value === '' ? 0.4 : 1,
      }}><Check size={13} /></button>
    </form>
  )
}
