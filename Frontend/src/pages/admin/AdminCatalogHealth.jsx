import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { HeartPulse, Pencil, RefreshCw, CheckCircle2 } from 'lucide-react'
import apiService from '../../api/service'

const LEVEL = {
  high:   { label: 'Fix first', color: 'var(--admin-danger, #ef4444)' },
  medium: { label: 'Should fix', color: 'var(--admin-warning, #f59e0b)' },
  low:    { label: 'Nice to fix', color: 'var(--admin-muted)' },
}

export function useCatalogHealth() {
  return useQuery({
    queryKey: ['admin-catalog-health'],
    queryFn: () => apiService.admin.catalog.health().then(r => r.data?.data ?? r.data),
    staleTime: 60_000,
  })
}

export default function AdminCatalogHealth() {
  const { data, isLoading, isError, refetch, isFetching } = useCatalogHealth()
  const [filter, setFilter] = useState('all')
  const issues = (data?.issues ?? []).filter(i => filter === 'all' || i.level === filter)

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <HeartPulse size={22} style={{ color: 'var(--admin-primary)' }} /> Catalogue health
          </h1>
          <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4, maxWidth: 640, lineHeight: 1.6 }}>
            Problems a shopper or Google would notice in your live products: missing photos, prices or specs,
            descriptions that contradict the specs, and listings that can't be bought. Fix the red ones first.
          </p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Check again
        </button>
      </div>

      {isError && <p style={{ color: 'var(--admin-danger)', fontSize: 13 }}>Failed to check the catalogue.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Tile label="Health score" value={isLoading ? '—' : `${data?.score ?? 0}%`} sub={data ? `${data.checked} live products checked` : null}
          tone={data?.score >= 90 ? 'var(--admin-success, #22c55e)' : data?.score >= 70 ? 'var(--admin-warning)' : 'var(--admin-danger)'} />
        {['high', 'medium', 'low'].map(l => (
          <Tile key={l} label={LEVEL[l].label} value={isLoading ? '—' : data?.counts?.[l] ?? 0} sub="products" tone={LEVEL[l].color}
            active={filter === l} onClick={() => setFilter(f => f === l ? 'all' : l)} />
        ))}
      </div>

      <div className="surface" style={{ borderRadius: 14, padding: '6px 22px' }}>
        {isLoading ? <p style={{ fontSize: 13, color: 'var(--admin-muted)', padding: '14px 0' }}>Checking every product…</p>
          : !issues.length ? (
            <p style={{ fontSize: 13, color: 'var(--admin-muted)', padding: '14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: 'var(--admin-success, #22c55e)' }} /> {filter === 'all' ? 'No problems found. Nice work!' : 'Nothing at this level.'}
            </p>
          ) : issues.map((p, i) => (
            <div key={p.productId} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 0', borderTop: i ? '1px solid var(--admin-border)' : 'none' }}>
              <span title={LEVEL[p.level].label} style={{ width: 9, height: 9, borderRadius: '50%', background: LEVEL[p.level].color, marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name} <span style={{ fontWeight: 400, color: 'var(--admin-muted)', fontSize: 12 }}>{p.category ? `· ${p.category}` : ''}</span></div>
                <ul style={{ margin: '5px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {p.problems.map((x, j) => (
                    <li key={j} style={{ fontSize: 12.5, color: x.level === 'low' ? 'var(--admin-muted)' : 'var(--text)', display: 'flex', gap: 7 }}>
                      <span style={{ color: LEVEL[x.level].color }}>•</span> {x.text}
                    </li>
                  ))}
                </ul>
              </div>
              <Link to={`/admin/products?edit=${p.productId}`} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, border: '1px solid var(--admin-border)', color: 'var(--text)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                <Pencil size={12} /> Edit
              </Link>
            </div>
          ))}
      </div>
    </div>
  )
}

function Tile({ label, value, sub, tone, active, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className="surface" style={{
      textAlign: 'left', borderRadius: 12, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default', color: 'var(--text)',
      border: active ? `1px solid ${tone}` : '1px solid var(--admin-border)', background: 'var(--admin-surface, transparent)',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 24, fontWeight: 700, color: tone }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--admin-muted)', marginTop: 2 }}>{sub}</div>}
    </button>
  )
}
