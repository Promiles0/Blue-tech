import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, Download, CreditCard, Truck, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { money, dateShort } from '../../lib/format'

const STATUSES = ['all', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
// "To ship" = paid or being prepared, not yet handed to a courier (replaces the old Shipments page).
const FILTERS = ['all', 'TO_SHIP', ...STATUSES.slice(1)]
const SHIPMENT_STATUSES = ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED']

const STATUS_COLORS = {
  PENDING:    { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  PAID:       { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  PROCESSING: { bg: 'var(--accent-dim2)',  color: 'var(--accent)' },
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
  const [statusFilter, setStatusFilter] = useState(() => new URLSearchParams(window.location.search).get('filter') === 'to-ship' ? 'TO_SHIP' : 'all')
  const [drawerOrderId, setDrawerOrderId] = useState(null)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => fetchOrders(statusFilter === 'TO_SHIP' ? 'all' : statusFilter),
  })

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }) =>
      apiService.admin.orders.updateStatus(orderId, status).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Status updated') },
    onError: () => toast.error('Failed to update status'),
  })

  // Search (order number, customer name or email) and date range, applied to the
  // table and the CSV export alike.
  const needle = search.trim().toLowerCase().replace(/^#/, '')
  const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
  const to = toDate ? new Date(`${toDate}T23:59:59`) : null
  const orders = allOrders.filter(o => {
    if (statusFilter === 'TO_SHIP' && !['PAID', 'PROCESSING'].includes(o.status)) return false
    if (needle) {
      const hay = [String(o.orderId), String(o.orderId).padStart(6, '0'), o.customerName ?? '', o.customerEmail ?? ''].join(' ').toLowerCase()
      if (!hay.includes(needle)) return false
    }
    const at = o.orderedAt ? new Date(o.orderedAt) : null
    if (from && (!at || at < from)) return false
    if (to && (!at || at > to)) return false
    return true
  })
  const filtersActive = Boolean(needle || from || to)

  function exportCSV() {
    const rows = [['ID', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Date']]
    orders.forEach(o => rows.push([
      o.orderId, o.customerName ?? '', o.customerEmail ?? '',
      o.itemCount, o.totalAmount, o.status,
      o.orderedAt ? new Date(o.orderedAt).toLocaleDateString() : '',
    ]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const range = fromDate || toDate ? `-${fromDate || 'start'}_to_${toDate || 'today'}` : ''
    Object.assign(document.createElement('a'), { href: url, download: `orders${range}.csv` }).click()
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
            {FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s === 'TO_SHIP' ? 'To ship' : s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
          <button onClick={exportCSV} style={outlineBtn} disabled={!orders.length}>
            <Download size={13} /> Export CSV{filtersActive ? ` (${orders.length})` : ''}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Order #, customer name or email…"
            style={{ ...selectStyle, cursor: 'text', paddingLeft: 32, width: 260 }} />
        </div>
        <label style={{ fontSize: 12, color: 'var(--admin-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          From <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={selectStyle} />
        </label>
        <label style={{ fontSize: 12, color: 'var(--admin-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          To <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={selectStyle} />
        </label>
        {filtersActive && (
          <button onClick={() => { setSearch(''); setFromDate(''); setToDate('') }} style={{ ...outlineBtn, border: 'none' }}>
            <X size={13} /> Clear
          </button>
        )}
        {filtersActive && <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{orders.length} of {allOrders.length} orders</span>}
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
              {order?.shipment ? (
                <ShipmentEditor key={order.shipment.shipmentId} shipment={order.shipment} onSaved={() => { qc.invalidateQueries({ queryKey: ['admin-order-detail', orderId] }); qc.invalidateQueries({ queryKey: ['admin-orders'] }) }} />
              ) : (
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
              )}
            </Section>
          </div>
        )}
      </div>
    </>
  )
}

// Carrier, tracking and status of an existing shipment, edited right on the order.
function ShipmentEditor({ shipment, onSaved }) {
  const [carrier, setCarrier] = useState(shipment.carrier ?? '')
  const [tracking, setTracking] = useState(shipment.trackingNumber ?? '')
  const [status, setStatus] = useState(shipment.status ?? 'IN_TRANSIT')
  const save = useMutation({
    mutationFn: () => apiService.admin.shipments.update(shipment.shipmentId, { carrier, trackingNumber: tracking, status }),
    onSuccess: () => { toast.success('Shipment updated'); onSaved?.() },
    onError: () => toast.error('Could not update the shipment'),
  })
  // One click on delivery day: marks it out for delivery and messages the customer (5a).
  const outToday = useMutation({
    mutationFn: () => apiService.admin.shipments.update(shipment.shipmentId, { status: 'OUT_FOR_DELIVERY' }),
    onSuccess: () => { setStatus('OUT_FOR_DELIVERY'); toast.success('Marked out for delivery — the customer has been told'); onSaved?.() },
    onError: () => toast.error('Could not update the shipment'),
  })
  const dirty = carrier !== (shipment.carrier ?? '') || tracking !== (shipment.trackingNumber ?? '') || status !== shipment.status
  const options = SHIPMENT_STATUSES.includes(status) ? SHIPMENT_STATUSES : [status, ...SHIPMENT_STATUSES]
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input placeholder="Carrier" value={carrier} onChange={e => setCarrier(e.target.value)} style={{ ...inputStyle, width: 120 }} />
      <input placeholder="Tracking #" value={tracking} onChange={e => setTracking(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
      <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
        {options.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase()}</option>)}
      </select>
      <button onClick={() => save.mutate()} disabled={!dirty || save.isPending} style={{ ...primaryBtn, opacity: dirty ? 1 : 0.5 }}>
        {save.isPending ? '…' : 'Save'}
      </button>
      {shipment.status === 'IN_TRANSIT' && (
        <button onClick={() => outToday.mutate()} disabled={outToday.isPending} style={{ ...primaryBtn, background: 'var(--admin-success, #16a34a)' }}>
          {outToday.isPending ? '…' : 'Out for delivery today'}
        </button>
      )}
      <p style={{ width: '100%', margin: 0, fontSize: 11.5, color: 'var(--admin-muted)' }}>
        The customer is messaged when it's out for delivery and when it's delivered.
      </p>
    </div>
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
  background: 'var(--glass-border)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: 'var(--text)', padding: '7px 12px', fontSize: 13, cursor: 'pointer',
}
const outlineBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'transparent', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: 'var(--text)', padding: '7px 14px', fontSize: 13,
  cursor: 'pointer', transition: 'border-color 0.15s',
}
const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: 'var(--admin-primary)', border: 'none',
  borderRadius: 8, color: 'var(--admin-primary-fg)', padding: '7px 14px', fontSize: 13,
  cursor: 'pointer',
}
const ghostIconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--admin-muted)', padding: '4px 6px', borderRadius: 6,
  transition: 'color 0.15s',
}
const inputStyle = {
  background: 'var(--glass-border)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: 'var(--text)', padding: '7px 12px', fontSize: 13, outline: 'none',
}
