import { useQuery } from '@tanstack/react-query'
import {
  DollarSign, TrendingUp, ShoppingBag, Users,
  AlertTriangle, Activity, Clock, UserPlus, Package,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import apiService from '../../api/service'
import { money } from '../../lib/format'

function fetchStats() {
  return apiService.admin.getDashboardStats().then(r => r.data)
}

const STATUS_COLOR = {
  PENDING:    '#f59e0b',
  PAID:       '#3b82f6',
  PROCESSING: '#a78bfa',
  SHIPPED:    '#22d3ee',
  DELIVERED:  '#22c55e',
  CANCELLED:  '#ef4444',
}

const tooltipStyle = {
  contentStyle: {
    background: 'var(--admin-card)', border: '1px solid var(--admin-border)',
    borderRadius: 8, fontSize: 12,
  },
  labelStyle: { color: 'rgba(255,255,255,0.55)', marginBottom: 4 },
}

export default function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-overview'], queryFn: fetchStats })
  const navigate = useNavigate()

  // Build order pipeline chart data from the map
  const pipelineData = data?.ordersByStatus
    ? Object.entries(data.ordersByStatus).map(([status, count]) => ({ status, count }))
    : []

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
        <KPI icon={DollarSign}    label="Revenue 24h"     value={isLoading ? '—' : money(data?.revenue24h)} />
        <KPI icon={TrendingUp}    label="Revenue 7d"      value={isLoading ? '—' : money(data?.revenue7d)} />
        <KPI icon={Activity}      label="Revenue 30d"     value={isLoading ? '—' : money(data?.revenue30d)} />
        <KPI icon={ShoppingBag}   label="AOV (30d)"       value={isLoading ? '—' : money(data?.aov)} />
        <KPI icon={ShoppingBag}   label="Orders 30d"      value={isLoading ? '—' : (data?.orders30d ?? 0).toLocaleString()} />
        <KPI icon={Clock}         label="Pending Orders"  value={isLoading ? '—' : (data?.pendingOrders ?? 0).toLocaleString()} accent="var(--admin-warning)" />
        <KPI icon={Users}         label="Customers"       value={isLoading ? '—' : (data?.totalCustomers ?? 0).toLocaleString()} />
        <KPI icon={UserPlus}      label="New Today"       value={isLoading ? '—' : (data?.newCustomers24h ?? 0).toLocaleString()} accent="var(--admin-success)" />
        <KPI icon={AlertTriangle} label="Low Stock"       value={isLoading ? '—' : (data?.lowStockCount ?? 0).toLocaleString()} accent="var(--admin-warning)" />
        <KPI icon={Package}       label="Variants"        value={isLoading ? '—' : (data?.totalVariants ?? 0).toLocaleString()} />
        <KPI icon={ShoppingBag}   label="Total Orders"    value={isLoading ? '—' : (data?.totalOrders ?? 0).toLocaleString()} />
        <KPI icon={DollarSign}    label="Total Revenue"   value={isLoading ? '—' : money(data?.totalRevenue)} />
      </div>

      {/* Row 2: Revenue chart + Low stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
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
                  {...tooltipStyle}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, margin: 0 }}>Low Stock</h2>
            {data?.lowStockCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-warning)', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 20 }}>
                {data.lowStockCount} variant{data.lowStockCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {isLoading ? (
            <Skeletons n={5} />
          ) : !data?.lowStockAlerts?.length ? (
            <p style={{ fontSize: 13, color: 'var(--admin-success)' }}>All variants well stocked.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.lowStockAlerts.slice(0, 8).map((a, i) => (
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

      {/* Row 3: Order pipeline + Recent orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
        {/* Order pipeline bar chart */}
        <div className="surface" style={{ borderRadius: 14, padding: '24px 24px' }}>
          <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
            Order Pipeline
          </h2>
          {isLoading ? (
            <Skeletons n={5} />
          ) : pipelineData.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--admin-muted)', paddingTop: 20 }}>No orders yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  layout="vertical"
                  data={pipelineData}
                  margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="status" width={90} tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={v => [v, 'orders']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {pipelineData.map((d, i) => (
                      <Cell key={i} fill={STATUS_COLOR[d.status] ?? '#7c5cf0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 14 }}>
                {pipelineData.map(d => (
                  <div key={d.status} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[d.status] ?? '#7c5cf0', flexShrink: 0 }} />
                    <span style={{ color: 'var(--admin-muted)' }}>{d.status}</span>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent orders */}
        <div className="surface" style={{ borderRadius: 14, padding: '24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, margin: 0 }}>
              Recent Orders
            </h2>
            <button
              onClick={() => navigate('/admin/orders')}
              style={{ fontSize: 12, color: '#7c5cf0', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all →
            </button>
          </div>
          {isLoading ? (
            <Skeletons n={5} />
          ) : !data?.recentOrders?.length ? (
            <p style={{ fontSize: 13, color: 'var(--admin-muted)' }}>No orders yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ color: 'var(--admin-muted)', textAlign: 'left' }}>
                  <th style={{ paddingBottom: 10, fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Order</th>
                  <th style={{ paddingBottom: 10, fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ paddingBottom: 10, fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ paddingBottom: 10, fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o, i) => (
                  <tr
                    key={o.orderId}
                    onClick={() => navigate('/admin/orders')}
                    style={{ cursor: 'pointer', borderTop: '1px solid var(--admin-border)', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 11 }}>#{o.orderId}</td>
                    <td style={{ padding: '10px 0', fontWeight: 500 }}>{o.customerName}</td>
                    <td style={{ padding: '10px 0', fontWeight: 600 }}>{money(o.totalAmount)}</td>
                    <td style={{ padding: '10px 0' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: STATUS_COLOR[o.status] ?? '#aaa',
                        background: `${STATUS_COLOR[o.status] ?? '#aaa'}18`,
                        padding: '2px 7px', borderRadius: 4,
                      }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
