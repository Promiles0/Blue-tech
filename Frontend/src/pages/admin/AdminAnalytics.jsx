import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '../../api/axios'
import { money } from '../../lib/format'

const CHART_COLORS = ['#7c5cf0', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444']

const tooltipStyle = {
  contentStyle: {
    background: 'var(--admin-card)', border: '1px solid var(--admin-border)',
    borderRadius: 8, fontSize: 12,
  },
  labelStyle: { color: 'rgba(255,255,255,0.55)', marginBottom: 4 },
}

function fetchAnalytics() {
  return api.get('/admin/analytics').then(r => r.data)
}

export default function AdminAnalytics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: fetchAnalytics,
  })

  return (
    <div style={{ padding: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Analytics</h1>
        <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>Revenue insights and growth metrics</p>
      </div>

      {isError && <ErrorBanner msg="Failed to load analytics." />}

      {isLoading ? (
        <div style={{ color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Row 1: Top products + Revenue by category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Top products by revenue */}
            <div className="surface" style={{ borderRadius: 14, padding: '24px 28px' }}>
              <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
                Top Products by Revenue
              </h2>
              {!data?.topProducts?.length ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={288}>
                  <BarChart
                    layout="vertical"
                    data={data.topProducts}
                    margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                      tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      type="category" dataKey="name"
                      width={100}
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={v => [money(v), 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="var(--admin-primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Revenue by category — Pie */}
            <div className="surface" style={{ borderRadius: 14, padding: '24px 28px' }}>
              <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
                Revenue by Category
              </h2>
              {!data?.byCategory?.length ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={288}>
                  <PieChart>
                    <Pie
                      data={data.byCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="45%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.byCategory.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={v => [money(v), 'Revenue']}
                    />
                    <Legend
                      iconType="circle" iconSize={8}
                      formatter={v => <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Row 2: User growth — full width */}
          <div className="surface" style={{ borderRadius: 14, padding: '24px 28px' }}>
            <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
              User Growth by Month
            </h2>
            {!data?.growth?.length ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={data.growth} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                    axisLine={false} tickLine={false} width={36}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={v => [v, 'New users']}
                  />
                  <Bar dataKey="count" fill="var(--admin-amber)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Empty() {
  return <p style={{ fontSize: 13, color: 'var(--admin-muted)', padding: '40px 0', textAlign: 'center' }}>No data yet.</p>
}

function ErrorBanner({ msg }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--admin-danger)' }}>
      {msg}
    </div>
  )
}
