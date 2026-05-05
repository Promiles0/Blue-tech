import { useQuery } from '@tanstack/react-query'
import {
  DollarSign, TrendingUp, ShoppingBag, Users,
  AlertTriangle, Activity, Package,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from 'recharts'
import apiService from '../../api/service'
import { money } from '../../lib/format'

function fetchStats() {
  return apiService.admin.getDashboardStats().then(r => r.data.data)
}

export default function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-overview'], queryFn: fetchStats })

  return (
    <div style={{ padding: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Overview
        </h1>
        <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>
          Store performance at a glance
        </p>
      </div>

      {isError && !data && <ErrorBanner msg="Failed to load dashboard stats." />}

      {/* KPI Grid — 4 cols × 2 rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <KPI icon={DollarSign}  label="Revenue 24h"  value={isLoading ? '—' : money(data?.revenue24h)} />
        <KPI icon={TrendingUp}  label="Revenue 7d"   value={isLoading ? '—' : money(data?.revenue7d)} />
        <KPI icon={Activity}    label="Revenue 30d"  value={isLoading ? '—' : money(data?.revenue30d)} />
        <KPI icon={ShoppingBag} label="AOV (30d)"    value={isLoading ? '—' : money(data?.aov)} />
        <KPI icon={ShoppingBag} label="Orders 30d"   value={isLoading ? '—' : (data?.orders30d ?? 0).toLocaleString()} />
        <KPI icon={Users}       label="Customers"    value={isLoading ? '—' : (data?.totalCustomers ?? 0).toLocaleString()} />
        <KPI icon={AlertTriangle} label="Low Stock"  value={isLoading ? '—' : (data?.lowStockCount ?? 0).toLocaleString()} accent="var(--admin-warning)" />
        <KPI icon={Package}     label="Variants"     value={isLoading ? '—' : (data?.totalVariants ?? 0).toLocaleString()} />
      </div>

      {/* Revenue chart + Low stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* 14-day revenue chart */}
        <div className="surface" style={{ borderRadius: 14, padding: '24px 28px' }}>
          <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
            Revenue — last 14 days
          </h2>
          {isLoading ? (
            <div style={{ height: 272, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={272}>
              <LineChart data={data?.revenueSeries ?? []} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  tickFormatter={v => v.slice(5)}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                  axisLine={false} tickLine={false} width={50}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}
                  formatter={v => [money(v), 'Revenue']}
                />
                <Line
                  type="monotone" dataKey="revenue"
                  stroke="var(--admin-primary)" strokeWidth={2}
                  dot={false} activeDot={{ r: 4, fill: 'var(--admin-primary)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low stock list */}
        <div className="surface" style={{ borderRadius: 14, padding: '24px 24px' }}>
          <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 18 }}>
            Low Stock
          </h2>
          {isLoading ? (
            <Skeletons n={5} />
          ) : !data?.lowStockAlerts?.length ? (
            <p style={{ fontSize: 13, color: 'var(--admin-success)' }}>All variants well stocked.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.lowStockAlerts.map((a, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--admin-border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.productName}</div>
                    {a.skuCode && <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 1 }}>{a.skuCode}</div>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: a.currentStock === 0 ? 'var(--admin-danger)' : 'var(--admin-warning)' }}>
                    {a.currentStock === 0 ? 'Out' : `${a.currentStock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function KPI({ icon: Icon, label, value, accent }) {
  const color = accent ?? 'var(--admin-primary)'
  return (
    <div className="surface" style={{ borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--admin-muted)', marginBottom: 10 }}>
        <Icon size={12} style={{ color }} />
        {label}
      </div>
      <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
  )
}

function Skeletons({ n }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, borderRadius: 4 }} />
      ))}
    </div>
  )
}

function ErrorBanner({ msg }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--admin-danger)' }}>
      {msg}
    </div>
  )
}
