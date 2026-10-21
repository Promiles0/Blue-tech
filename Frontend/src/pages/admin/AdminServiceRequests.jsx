import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, ShieldCheck, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

// Returns and warranty claims from customers (5b, 5c). Moving a request on messages the
// customer; refunds are sent by hand (MoMo or card) and recorded here.
const FILTERS = [['open', 'Open'], ['', 'All'], ['refunded', 'Refunded'], ['rejected', 'Rejected']]
const NEXT = {
  new: ['approved', 'rejected'],
  approved: ['received', 'rejected'],
  received: ['repaired', 'replaced', 'refunded', 'rejected'],
  repaired: ['closed'], replaced: ['closed'], refunded: ['closed'], rejected: ['closed'], closed: [],
}
const LABEL = { new: 'New', approved: 'Approved', received: 'Received', repaired: 'Repaired', replaced: 'Replaced', refunded: 'Refunded', rejected: 'Rejected', closed: 'Closed' }
const TONE = { new: '#3b82f6', approved: '#22c55e', received: '#8b5cf6', repaired: '#22c55e', replaced: '#22c55e', refunded: '#22c55e', rejected: '#ef4444', closed: '#94a3b8' }

const when = (iso) => { try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return '' } }

export default function AdminServiceRequests() {
  const [filter, setFilter] = useState('open')
  const [openId, setOpenId] = useState(null)
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['admin-service-requests', filter],
    queryFn: () => apiService.admin.serviceRequests.getAll(filter).then(r => r.data?.data ?? r.data),
  })
  const current = data.find(r => r.id === openId)

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Undo2 size={22} style={{ color: 'var(--admin-primary)' }} /> Returns &amp; warranty
      </h1>
      <p style={{ color: 'var(--admin-muted)', fontSize: 13, margin: '4px 0 20px', maxWidth: 640, lineHeight: 1.6 }}>
        Requests customers send from their delivered orders. Each step you take messages the customer.
        Refunds are sent by hand (MoMo or card) — record them here.
      </p>
      <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 9, border: '1px solid var(--admin-border)', width: 'fit-content', marginBottom: 16 }}>
        {FILTERS.map(([v, label]) => (
          <button key={label} onClick={() => setFilter(v)} style={{ padding: '6px 12px', borderRadius: 7, border: 0, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: filter === v ? 'var(--admin-primary)' : 'transparent', color: filter === v ? '#fff' : 'var(--text)' }}>{label}</button>
        ))}
      </div>

      <div className="surface" style={{ borderRadius: 14, padding: '4px 20px' }}>
        {isError ? <p style={{ color: 'var(--admin-danger)', fontSize: 13 }}>Failed to load requests.</p>
          : isLoading ? <p style={{ fontSize: 13, color: 'var(--admin-muted)', padding: '14px 0' }}>Loading…</p>
          : !data.length ? <p style={{ fontSize: 13, color: 'var(--admin-muted)', padding: '14px 0' }}>Nothing here.</p>
          : data.map((r, i) => (
            <button key={r.id} onClick={() => setOpenId(r.id)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', border: 0, borderTop: i ? '1px solid var(--admin-border)' : 'none', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
              {r.type === 'return' ? <RotateCcw size={16} style={{ color: 'var(--admin-primary)', flexShrink: 0 }} /> : <ShieldCheck size={16} style={{ color: 'var(--admin-warning)', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.type === 'return' ? 'Return' : 'Warranty'} · {r.productName}</div>
                <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 2 }}>Order #{r.orderId} · {r.customer?.name ?? r.customer?.email ?? 'Customer'} · {r.reason} · {when(r.createdAt)}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: `1px solid ${TONE[r.status]}`, color: TONE[r.status] }}>{LABEL[r.status]}</span>
            </button>
          ))}
      </div>

      {current && <RequestPanel r={current} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function RequestPanel({ r, onClose }) {
  const qc = useQueryClient()
  const [status, setStatus] = useState(NEXT[r.status]?.[0] ?? r.status)
  const [message, setMessage] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundMethod, setRefundMethod] = useState('MTN MoMo')
  const [restock, setRestock] = useState(false)
  const save = useMutation({
    mutationFn: () => apiService.admin.serviceRequests.update(r.id, { status, message, restock, ...(status === 'refunded' ? { refundAmount, refundMethod } : {}) }),
    onSuccess: () => { toast.success('Updated — the customer has been told'); qc.invalidateQueries({ queryKey: ['admin-service-requests'] }); setMessage('') },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Could not update'),
  })
  const next = NEXT[r.status] ?? []
  const input = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 100vw)', height: '100%', overflowY: 'auto', background: 'var(--admin-surface, var(--bg))', borderLeft: '1px solid var(--admin-border)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{r.type === 'return' ? 'Return' : 'Warranty claim'} · {r.productName}</div>
            <div style={{ fontSize: 12.5, color: 'var(--admin-muted)', marginTop: 3 }}>
              <Link to={`/admin/orders?focus=${r.orderId}`} style={{ color: 'var(--admin-primary)' }}>Order #{r.orderId}</Link> · qty {r.quantity} · sent {when(r.createdAt)}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 0, color: 'var(--admin-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <Block title="Customer">
          {r.customer?.name ?? '—'} · {r.customer?.email ?? ''}{r.customer?.phone ? ` · ${r.customer.phone}` : ''}
        </Block>
        <Block title="Reason">{r.reason}{r.details ? <><br /><span style={{ color: 'var(--admin-muted)' }}>{r.details}</span></> : null}</Block>
        {r.photos?.length > 0 && (
          <Block title="Photos">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {r.photos.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" style={{ width: 92, height: 92, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--admin-border)' }} /></a>)}
            </div>
          </Block>
        )}
        {r.refundAmount != null && <Block title="Refund">{Math.round(r.refundAmount).toLocaleString('en-US')} RWF {r.refundMethod ? `by ${r.refundMethod}` : ''}</Block>}

        <Block title="History">
          {(r.history ?? []).map((h, i) => (
            <div key={i} style={{ fontSize: 12.5, padding: '6px 0', borderTop: i ? '1px solid var(--admin-border)' : 'none' }}>
              <strong style={{ color: TONE[h.status] }}>{LABEL[h.status] ?? h.status}</strong> · {when(h.at)}{h.by ? ` · ${h.by}` : ''}
              {h.message && <div style={{ color: 'var(--admin-muted)', marginTop: 2 }}>{h.message}</div>}
            </div>
          ))}
        </Block>

        {next.length > 0 && (
          <div style={{ marginTop: 18, padding: 16, borderRadius: 12, border: '1px solid var(--admin-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Next step</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {next.map((s) => (
                <button key={s} onClick={() => setStatus(s)} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${TONE[s]}`, background: status === s ? TONE[s] : 'transparent', color: status === s ? '#fff' : TONE[s] }}>{LABEL[s]}</button>
              ))}
            </div>
            {status === 'refunded' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <input style={input} type="number" min="0" placeholder="Amount (RWF)" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
                <select style={input} value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                  {['MTN MoMo', 'Airtel Money', 'Card refund', 'Bank transfer', 'Cash'].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            )}
            <textarea style={{ ...input, resize: 'vertical' }} rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder={status === 'rejected' ? 'Why it was rejected (sent to the customer)' : 'Extra note for the customer (optional) — a standard message is sent automatically'} />
            {['received', 'refunded', 'replaced', 'closed'].includes(status) && !r.restocked && r.type === 'return' && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 10 }}>
                <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} /> Put the item back in stock (it's fine to resell)
              </label>
            )}
            <button onClick={() => save.mutate()} disabled={save.isPending} style={{ marginTop: 12, padding: '10px 18px', borderRadius: 9, border: 0, background: 'var(--admin-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {save.isPending ? 'Saving…' : `Mark ${LABEL[status].toLowerCase()} and tell the customer`}
            </button>
          </div>
        )}
        {r.restocked && <p style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 12 }}>✓ Put back in stock.</p>}
      </div>
    </div>
  )
}

function Block({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--admin-muted)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{children}</div>
    </div>
  )
}
