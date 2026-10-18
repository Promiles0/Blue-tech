import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TrendingUp, ShoppingBag, Package, Users, Truck, Percent, SearchX } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import apiService from '../../api/service'
import { money } from '../../lib/format'

const RANGES = [{ d: 30, label: '30 days' }, { d: 90, label: '90 days' }, { d: 365, label: '12 months' }]
const PAYMENT_LABEL = { MOMO: 'MTN MoMo', AIRTEL_MONEY: 'Airtel Money', CARD: 'Card', CASH: 'Cash', CHEQUE: 'Cheque', MANUAL: 'Marked paid', UNKNOWN: 'Unknown' }
const card = { borderRadius: 14, padding: '20px 22px' }
const h2 = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, margin: '0 0 14px' }
const short = (v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(v)

// What sold, through which channels, and what customers wanted — the Overview covers today.
export default function AdminAnalytics() {
  const [days, setDays] = useState(30)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-insights', days],
    queryFn: () => apiService.admin.insights(days).then(r => r.data),
  })
  const t = data?.totals

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Sales insights</h1>
          <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>Paid orders only. What sells, how people pay, and what they asked for that you don't stock.</p>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 9, border: '1px solid var(--admin-border)' }}>
          {RANGES.map(r => (
            <button key={r.d} onClick={() => setDays(r.d)} style={{ padding: '6px 12px', borderRadius: 7, border: 0, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: days === r.d ? 'var(--admin-primary)' : 'transparent', color: days === r.d ? '#fff' : 'var(--text)' }}>{r.label}</button>
          ))}
        </div>
      </div>

      {isError && <p style={{ color: 'var(--admin-danger)', fontSize: 13 }}>Could not load insights.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Stat icon={TrendingUp} label="Revenue" value={t ? money(t.revenue) : '—'} />
        <Stat icon={ShoppingBag} label="Paid orders" value={t?.orders ?? '—'} sub={t ? `avg ${money(t.avgOrder)}` : null} />
        <Stat icon={Package} label="Units sold" value={t?.unitsSold ?? '—'} />
        <Stat icon={Users} label="Repeat buyers" value={t ? `${t.repeatBuyers}/${t.buyers}` : '—'} sub={t?.buyers ? `${Math.round(t.repeatBuyers / t.buyers * 100)}% came back` : null} />
        <Stat icon={Truck} label="Order → shipped" value={t?.avgHoursToShip != null ? (t.avgHoursToShip >= 48 ? `${Math.round(t.avgHoursToShip / 24)} days` : `${t.avgHoursToShip} h`) : '—'} sub="average" />
        <Stat icon={Percent} label="Points & student discounts" value={t ? money(t.discounts) : '—'} />
      </div>

      <div className="surface" style={{ ...card, marginBottom: 16 }}>
        <h2 style={h2}>Revenue by month (last 12 months)</h2>
        {isLoading ? <Muted>Loading…</Muted> : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.revenueByMonth ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={m => m.slice(5)} tick={{ fill: 'var(--admin-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={short} tick={{ fill: 'var(--admin-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v, k) => [k === 'revenue' ? money(v) : v, k === 'revenue' ? 'Revenue' : 'Orders']}
                contentStyle={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="var(--admin-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
        <Ranked title="Best sellers" rows={data?.bestSellers} loading={isLoading} link={r => r.id ? `/products/${r.id}` : null} />
        <Ranked title="Sales by category" rows={data?.byCategory} loading={isLoading} />
        <Ranked title="Sales by brand" rows={data?.byBrand} loading={isLoading} />
        <div className="surface" style={card}>
          <h2 style={h2}>How customers pay</h2>
          {isLoading ? <Muted>Loading…</Muted> : !data?.payments?.length ? <Muted>No paid orders in this period.</Muted> : data.payments.map(p => (
            <div key={p.method} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--admin-border)', fontSize: 13 }}>
              <span>{PAYMENT_LABEL[p.method] ?? p.method}</span>
              <span style={{ color: 'var(--admin-muted)' }}>{p.orders} order{p.orders === 1 ? '' : 's'} · <strong style={{ color: 'var(--text)' }}>{money(p.revenue)}</strong></span>
            </div>
          ))}
        </div>
      </div>

      <div className="surface" style={card}>
        <h2 style={{ ...h2, display: 'flex', alignItems: 'center', gap: 8 }}><SearchX size={16} /> Asked for but not stocked</h2>
        {isLoading ? <Muted>Loading…</Muted> : !data?.missedDemand?.length ? <Muted>Blue didn't hear any requests you couldn't meet in this period.</Muted> : (
          <>
            {data.missedDemand.map(m => (
              <div key={m.question} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid var(--admin-border)', fontSize: 13 }}>
                <span>“{m.question}”</span>{m.count > 1 && <span style={{ color: 'var(--admin-muted)', whiteSpace: 'nowrap' }}>× {m.count}</span>}
              </div>
            ))}
            <Link to="/admin/blue" style={{ fontSize: 12.5, color: 'var(--admin-primary)', display: 'inline-block', marginTop: 10 }}>All Blue conversations →</Link>
          </>
        )}
      </div>
    </div>
  )
}

const Muted = ({ children }) => <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0 }}>{children}</p>

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="surface" style={{ borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-muted)', marginBottom: 8 }}>
        <Icon size={12} style={{ color: 'var(--admin-primary)' }} /> {label}
      </div>
      <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--admin-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Ranked({ title, rows, loading, link }) {
  const max = Math.max(1, ...(rows ?? []).map(r => r.revenue))
  return (
    <div className="surface" style={card}>
      <h2 style={h2}>{title}</h2>
      {loading ? <Muted>Loading…</Muted> : !rows?.length ? <Muted>No sales in this period.</Muted> : rows.map(r => (
        <div key={r.name} style={{ marginBottom: 9 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, marginBottom: 3 }}>
            {link?.(r) ? <a href={link(r)} target="_blank" rel="noreferrer" style={{ color: 'var(--text)' }}>{r.name}</a> : <span>{r.name}</span>}
            <span style={{ color: 'var(--admin-muted)', whiteSpace: 'nowrap' }}>{r.units} · {money(r.revenue)}</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'var(--glass-border)' }}>
            <div style={{ width: `${(r.revenue / max) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--admin-primary)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
