import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, Download, CreditCard, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { money, dateShort, dateTime } from '../../lib/format'

const STATUSES = ['all', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const STATUS_COLORS = {
  PENDING:    { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  PAID:       { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  PROCESSING: { bg: 'rgba(124,92,240,0.15)',  color: '#7c5cf0' },
  SHIPPED:    { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
  DELIVERED:  { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  CANCELLED:  { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
}

function fetchOrders(status) {
  return apiService.admin.orders.getAll(status).then(r => r.data)
}

function fetchOrderDetail(id) {
  return apiService.admin.orders.getOne(id).then(r => r.data)
}

export default function AdminOrders() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [drawerOrderId, setDrawerOrderId] = useState(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => fetchOrders(statusFilter),
  })

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }) =>
      apiService.admin.orders.updateStatus(orderId, status).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Status updated') },
    onError: () => toast.error('Failed to update status'),
  })

  function exportCSV() {
    const rows = [['ID', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Date']]
    orders.forEach(o => rows.push([
      o.orderId, o.customerName ?? '', o.customerEmail ?? '',
      o.itemCount, o.totalAmount, o.status,
      o.orderedAt ? new Date(o.orderedAt).toLocaleDateString() : '',
    ]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    Object.assign(document.createElement('a'), { href: url, download: 'orders.csv' }).click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Orders</h1>
          <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>Manage and track all customer orders</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
          <button onClick={exportCSV} style={outlineBtn}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="surface" style={{ borderRadius: 14, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th><th>Customer</th><th>Items</th>
                <th>Total</th><th>Date</th><th>Status</th><th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {!orders.length ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--admin-muted)', fontSize: 13 }}>No orders found.</td></tr>
              ) : orders.map(o => (
                <tr key={o.orderId}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--admin-muted)' }}>#{String(o.orderId).padStart(6, '0')}</span></td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{o.customerName ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{o.customerEmail}</div>
                  </td>
                  <td style={{ color: 'var(--admin-muted)' }}>{o.itemCount}</td>
                  <td style={{ color: 'var(--admin-amber)', fontWeight: 600 }}>{money(o.totalAmount)}</td>
                  <td style={{ color: 'var(--admin-muted)', fontSize: 12 }}>{dateShort(o.orderedAt)}</td>
                  <td>
                    <select
                      value={o.status}
                      onChange={e => updateStatus.mutate({ orderId: o.orderId, status: e.target.value })}
                      style={{ ...selectStyle, height: 28, fontSize: 11, padding: '0 8px', width: 130,
                        ...STATUS_COLORS[o.status] }}
                    >
                      {STATUSES.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => setDrawerOrderId(o.orderId)} style={ghostIconBtn} title="View detail">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Drawer */}
      {drawerOrderId && (
        <OrderDrawer orderId={drawerOrderId} onClose={() => setDrawerOrderId(null)} />
      )}
    </div>
  )
}

function OrderDrawer({ orderId, onClose }) {
  const qc = useQueryClient()
  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: () => fetchOrderDetail(orderId),
  })

  const markPaid = useMutation({
    mutationFn: () => apiService.admin.orders.markPaid(orderId).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-order-detail', orderId] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Order marked as paid')
    },
    onError: () => toast.error('Failed to mark as paid'),
  })

  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')
  const addShipment = useMutation({
    mutationFn: () => apiService.admin.orders.addShipment(orderId, { carrier, trackingNumber: tracking }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-order-detail', orderId] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      setCarrier(''); setTracking('')
      toast.success('Shipment created')
    },
    onError: () => toast.error('Failed to create shipment'),
  })

  const sc = order?.status ? STATUS_COLORS[order.status] : {}

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }} />
      {/* Sheet */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 520,
        background: 'var(--admin-card)', borderLeft: '1px solid var(--admin-border)',
        zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Sheet header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--admin-border)', position: 'sticky', top: 0, background: 'var(--admin-card)', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--admin-muted)' }}>#{orderId}</span>
            {order?.status && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, ...sc }}>
                {order.status}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-muted)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
        ) : (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Customer */}
            <Section label="Customer">
              <Row label="Name" value={order?.customerName ?? '—'} />
              <Row label="Email" value={order?.customerEmail ?? '—'} />
              <Row label="Phone" value={order?.customerPhone ?? '—'} />
            </Section>

            {/* Ship to */}
            <Section label="Ship to">
              <p style={{ fontSize: 13 }}>{order?.addressStreet}</p>
              <p style={{ fontSize: 13, color: 'var(--admin-muted)' }}>{[order?.addressCity, order?.addressCountry].filter(Boolean).join(', ')}</p>
            </Section>

            {/* Items */}
            <Section label="Items">
              {order?.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--admin-border)', fontSize: 13 }}>
                  <span>{item.productName} {item.variantInfo ? <span style={{ color: 'var(--admin-muted)' }}>· {item.variantInfo}</span> : null} × {item.quantity}</span>
                  <span style={{ color: 'var(--admin-amber)', fontWeight: 600 }}>{money(item.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, fontSize: 14 }}>
                <span>Total</span>
                <span style={{ color: 'var(--admin-amber)' }}>{money(order?.totalAmount)}</span>
              </div>
            </Section>

            {/* Payment */}
            <Section label="Payment">
              {!order?.payment ? (
                <button
                  onClick={() => markPaid.mutate()}
                  disabled={markPaid.isPending}
                  style={{ ...outlineBtn, gap: 6 }}
                >
                  <CreditCard size={13} /> {markPaid.isPending ? 'Saving…' : 'Mark as paid'}
                </button>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-muted)' }}>{order.payment.paymentMethod ?? 'manual'} · {order.payment.status ?? 'SUCCESS'}</span>
                  <span style={{ color: 'var(--admin-amber)', fontWeight: 600 }}>{money(order.payment.amount)}</span>
                </div>
              )}
            </Section>

            {/* Shipment */}
            <Section label="Shipment">
              {order?.shipment && (
                <div style={{ fontSize: 13, marginBottom: 14, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                  <span style={{ fontWeight: 500 }}>{order.shipment.carrier}</span>
                  {order.shipment.trackingNumber && <> · <span style={{ color: 'var(--admin-muted)' }}>{order.shipment.trackingNumber}</span></>}
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--admin-muted)' }}>{order.shipment.status}</span>
                </div>
              )}
              {/* Add shipment form */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input placeholder="Carrier" value={carrier} onChange={e => setCarrier(e.target.value)}
                  style={{ ...inputStyle, width: 120 }} />
                <input placeholder="Tracking #" value={tracking} onChange={e => setTracking(e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: 140 }} />
                <button
                  onClick={() => addShipment.mutate()}
                  disabled={!carrier || !tracking || addShipment.isPending}
                  style={primaryBtn}
                >
                  <Truck size={13} /> {addShipment.isPending ? '…' : 'Ship'}
                </button>
              </div>
            </Section>
          </div>
        )}
      </div>
    </>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--admin-muted)', marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
      <span style={{ color: 'var(--admin-muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

const selectStyle = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: '#fff', padding: '7px 12px', fontSize: 13, cursor: 'pointer',
}
const outlineBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'transparent', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: '#fff', padding: '7px 14px', fontSize: 13,
  cursor: 'pointer', transition: 'border-color 0.15s',
}
const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: 'var(--admin-primary)', border: 'none',
  borderRadius: 8, color: '#fff', padding: '7px 14px', fontSize: 13,
  cursor: 'pointer',
}
const ghostIconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--admin-muted)', padding: '4px 6px', borderRadius: 6,
  transition: 'color 0.15s',
}
const inputStyle = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: '#fff', padding: '7px 12px', fontSize: 13, outline: 'none',
}
