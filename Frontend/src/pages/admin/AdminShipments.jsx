import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { dateShort } from '../../lib/format'

const SHIPMENT_STATUSES = ['PENDING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED']

function fetchShipments() {
  return apiService.admin.shipments.getAll().then(r => r.data)
}

export default function AdminShipments() {
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['admin-shipments'],
    queryFn: fetchShipments,
  })

  return (
    <div style={{ padding: 40 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Shipments</h1>
        <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>Edit carrier, tracking number and status inline</p>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
      ) : !shipments.length ? (
        <div style={{ color: 'var(--admin-muted)', fontSize: 13 }}>No shipments yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shipments.map(s => <ShipmentRow key={s.shipmentId} shipment={s} />)}
        </div>
      )}
    </div>
  )
}

function ShipmentRow({ shipment }) {
  const qc = useQueryClient()
  const [carrier, setCarrier]   = useState(shipment.carrier ?? '')
  const [tracking, setTracking] = useState(shipment.trackingNumber ?? '')
  const [status, setStatus]     = useState(shipment.status ?? 'PENDING')

  useEffect(() => {
    setCarrier(shipment.carrier ?? '')
    setTracking(shipment.trackingNumber ?? '')
    setStatus(shipment.status ?? 'PENDING')
  }, [shipment])

  const save = useMutation({
    mutationFn: () => apiService.admin.shipments.update(shipment.shipmentId, { carrier, trackingNumber: tracking, status }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shipments'] }); toast.success('Shipment saved') },
    onError: () => toast.error('Failed to save shipment'),
  })

  return (
    <div className="surface" style={{ borderRadius: 12, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
      {/* Order ref */}
      <div style={{ minWidth: 80 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-muted)', marginBottom: 2 }}>Order</div>
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>#{shipment.orderId}</span>
      </div>

      {/* Customer */}
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-muted)', marginBottom: 2 }}>Customer</div>
        <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{shipment.customerEmail ?? '—'}</span>
      </div>

      {/* Carrier input */}
      <input
        value={carrier}
        onChange={e => setCarrier(e.target.value)}
        placeholder="Carrier"
        style={{ ...inputStyle, width: 130 }}
      />

      {/* Tracking input */}
      <input
        value={tracking}
        onChange={e => setTracking(e.target.value)}
        placeholder="Tracking #"
        style={{ ...inputStyle, width: 200 }}
      />

      {/* Status select */}
      <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
        {SHIPMENT_STATUSES.map(s => (
          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')}</option>
        ))}
      </select>

      {/* Shipped date */}
      {shipment.shippedAt && (
        <span style={{ fontSize: 11, color: 'var(--admin-muted)', whiteSpace: 'nowrap' }}>
          {dateShort(shipment.shippedAt)}
        </span>
      )}

      {/* Save button */}
      <button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        style={saveBtn}
        title="Save changes"
      >
        <Save size={13} /> {save.isPending ? '…' : 'Save'}
      </button>
    </div>
  )
}

const inputStyle = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: '#fff', padding: '7px 12px', fontSize: 13, outline: 'none',
}
const selectStyle = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: '#fff', padding: '7px 12px', fontSize: 13, cursor: 'pointer',
}
const saveBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: 'var(--admin-primary)', border: 'none', borderRadius: 8,
  color: '#fff', padding: '7px 14px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
}
