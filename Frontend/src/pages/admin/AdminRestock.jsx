import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, PackagePlus } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

// Restock planner (7b): how long each option's stock will last at the current sales pace,
// and how many to reorder. Downloads a supplier order list.
const STATUS = {
  out: { label: 'Out of stock', color: 'var(--admin-danger, #ef4444)' },
  urgent: { label: 'Order now', color: 'var(--admin-danger, #ef4444)' },
  soon: { label: 'Order soon', color: 'var(--admin-warning, #f59e0b)' },
  ok: { label: 'OK', color: 'var(--admin-success, #22c55e)' },
}

function downloadCsv(name, rows) {
  const csv = rows.map(r => r.map(v => { const s = v == null ? '' : String(v); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminRestock() {
  const qc = useQueryClient()
  const [cover, setCover] = useState(30)
  const [lead, setLead] = useState(7)
  const [onlyNeeded, setOnlyNeeded] = useState(true)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-restock', cover, lead],
    queryFn: () => apiService.admin.restock(cover, lead).then(r => r.data?.data ?? r.data),
  })
  const rows = (data?.rows ?? []).filter(r => !onlyNeeded || r.suggest > 0 || r.status !== 'ok')
  const toOrder = (data?.rows ?? []).filter(r => r.suggest > 0)

  const exportList = () => downloadCsv(`blue-tech-reorder-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['sku', 'product', 'option', 'in_stock', 'sold_30_days', 'reorder_qty'],
    ...toOrder.map(r => [r.sku, r.name, r.option, r.stock, r.sold30, r.suggest]),
  ])

  const input = { width: 70, padding: '6px 8px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontSize: 13 }
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
        <PackagePlus size={22} style={{ color: 'var(--admin-primary)' }} /> Restock planner
      </h1>
      <p style={{ color: 'var(--admin-muted)', fontSize: 13, margin: '4px 0 18px', maxWidth: 680, lineHeight: 1.6 }}>
        How long each option will last at its current sales pace (the faster of the last 30 or 90 days), and how many to reorder so it lasts
        the number of days below after your supplier delivers. Products with no sales yet are only flagged when they're out of stock.
      </p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, fontSize: 13 }}>
        <label>Supplier takes <input type="number" min={0} max={60} value={lead} onChange={e => setLead(Number(e.target.value) || 0)} style={input} /> days</label>
        <label>Stock should last <input type="number" min={7} max={120} value={cover} onChange={e => setCover(Number(e.target.value) || 30)} style={input} /> days</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={onlyNeeded} onChange={e => setOnlyNeeded(e.target.checked)} /> Only what needs attention</label>
        <button onClick={exportList} disabled={!toOrder.length} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 0, background: 'var(--admin-primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: toOrder.length ? 'pointer' : 'default', opacity: toOrder.length ? 1 : 0.5 }}>
          <Download size={14} /> Supplier order list ({toOrder.length})
        </button>
      </div>

      <div className="surface" style={{ borderRadius: 14, overflowX: 'auto' }}>
        {isError ? <p style={{ padding: 20, color: 'var(--admin-danger)', fontSize: 13 }}>Failed to load.</p>
          : isLoading ? <p style={{ padding: 20, color: 'var(--admin-muted)', fontSize: 13 }}>Working it out…</p>
          : !rows.length ? <p style={{ padding: 20, color: 'var(--admin-muted)', fontSize: 13 }}>Nothing needs restocking right now.</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--admin-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {['Product', 'Status', 'In stock', 'Sold 30d', 'Days left', 'Reorder', 'Set stock'].map(h => <th key={h} style={{ padding: '12px 14px', fontWeight: 700 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.variantId} style={{ borderTop: '1px solid var(--admin-border)' }}>
                    <td style={{ padding: '11px 14px' }}><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11.5, color: 'var(--admin-muted)' }}>{[r.option, r.sku].filter(Boolean).join(' · ')}</div></td>
                    <td style={{ padding: '11px 14px', color: STATUS[r.status].color, fontWeight: 700, whiteSpace: 'nowrap' }}>{STATUS[r.status].label}</td>
                    <td style={{ padding: '11px 14px' }}>{r.stock}</td>
                    <td style={{ padding: '11px 14px' }}>{r.sold30}</td>
                    <td style={{ padding: '11px 14px' }}>{r.daysLeft ?? '—'}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 700 }}>{r.suggest || '—'}</td>
                    <td style={{ padding: '11px 14px' }}><SetStock row={r} onDone={() => qc.invalidateQueries({ queryKey: ['admin-restock'] })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}

function SetStock({ row, onDone }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async (e) => {
    e.preventDefault()
    const n = Number(value)
    if (!Number.isInteger(n) || n < 0) { toast.error('Enter a whole number'); return }
    setBusy(true)
    try { await apiService.admin.products.setStock(row.variantId, n); toast.success(`Stock set to ${n}`); setValue(''); onDone() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Could not save') }
    finally { setBusy(false) }
  }
  return (
    <form onSubmit={save} style={{ display: 'flex', gap: 6 }}>
      <input type="number" min={0} value={value} onChange={e => setValue(e.target.value)} placeholder={String(row.stock + (row.suggest || 0))}
        style={{ width: 72, padding: '5px 8px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontSize: 12.5 }} />
      <button disabled={busy || value === ''} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>{busy ? '…' : 'Save'}</button>
    </form>
  )
}
