import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertTriangle, BarChart2 } from 'lucide-react'
import api from '../../api/axios'

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then(({ data }) => setStats(data.data ?? data))
      .catch(() => setError('Failed to load dashboard stats.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>Overview of your store</p>
      </div>

      {error && <ErrorBanner msg={error} />}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard
          icon={DollarSign} color="#7c5cf0"
          label="Total Revenue"
          value={loading ? '—' : `$${Number(stats?.totalRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={ShoppingBag} color="#f59e0b"
          label="Total Orders"
          value={loading ? '—' : (stats?.totalOrders ?? 0).toLocaleString()}
        />
        <StatCard
          icon={Users} color="#22c55e"
          label="Customers"
          value={loading ? '—' : (stats?.totalCustomers ?? 0).toLocaleString()}
        />
        <StatCard
          icon={TrendingUp} color="#3b82f6"
          label="Orders Today"
          value={loading ? '—' : (stats?.ordersToday ?? 0).toLocaleString()}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top sellers */}
        <Section title="Top Sellers" icon={BarChart2}>
          {loading ? <Skeleton rows={5} /> : !stats?.topSellers?.length
            ? <Empty text="No sales data yet" />
            : stats.topSellers.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 20, textAlign: 'right', fontSize: 12, color: '#444', fontWeight: 600 }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, color: '#ccc' }}>{s.productName}</span>
                </div>
                <span style={{ fontSize: 13, color: '#7c5cf0', fontWeight: 600 }}>{s.totalQuantitySold} sold</span>
              </div>
            ))
          }
        </Section>

        {/* Low stock alerts */}
        <Section title="Low Stock Alerts" icon={AlertTriangle} iconColor="#f59e0b">
          {loading ? <Skeleton rows={5} /> : !stats?.lowStockAlerts?.length
            ? <Empty text="All variants are well-stocked" good />
            : stats.lowStockAlerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#ccc' }}>{a.productName}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{a.variantInfo}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: a.currentStock === 0 ? '#ef4444' : '#f59e0b' }}>
                  {a.currentStock === 0 ? 'Out of stock' : `${a.currentStock} left`}
                </span>
              </div>
            ))
          }
        </Section>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, color, label, value }) {
  return (
    <div style={{
      background: '#111', border: '1px solid #1a1a1a', borderRadius: 12,
      padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, iconColor = '#7c5cf0', children }) {
  return (
    <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <Icon size={15} color={iconColor} />
        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#ccc' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Skeleton({ rows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, borderRadius: 4, opacity: 0.5 }} />
      ))}
    </div>
  )
}

function Empty({ text, good }) {
  return (
    <p style={{ fontSize: 13, color: good ? '#22c55e' : '#555', padding: '8px 0' }}>{text}</p>
  )
}

function ErrorBanner({ msg }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#ef4444' }}>
      {msg}
    </div>
  )
}
