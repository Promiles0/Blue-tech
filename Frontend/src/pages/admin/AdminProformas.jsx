import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileDown, Search } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { money, dateShort } from '../../lib/format'
import { useStoreSettings } from '../../lib/delivery'
import { downloadInvoicePdf, proformaDoc } from '../../lib/invoicePdf'
import { QuoteReplyButtons } from './QuoteReplyTools'

const STATUSES = ['new', 'contacted', 'won', 'lost']
const select = { background: 'var(--glass-border)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--text)', padding: '7px 12px', fontSize: 13 }

// Proformas customers generated from their cart — warm business leads to follow up.
export default function AdminProformas() {
  const qc = useQueryClient()
  const { businessInfo } = useStoreSettings()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin-proformas'],
    queryFn: () => apiService.admin.proformas.getAll().then(r => r.data ?? []),
  })
  const update = useMutation({
    mutationFn: ({ id, status }) => apiService.admin.proformas.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-proformas'] }),
    onError: () => toast.error('Could not update status'),
  })

  const needle = search.trim().toLowerCase()
  const shown = rows.filter(p => (!status || p.status === status) &&
    (!needle || [p.number, p.organization, p.contactName, p.email, p.phone, p.tin].join(' ').toLowerCase().includes(needle)))

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Proformas</h1>
          <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>Proforma invoices customers downloaded from their cart — follow up to win the order.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="PF number, organisation, contact…" style={{ ...select, paddingLeft: 32, width: 250 }} />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} style={select}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? <p style={{ color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</p> : !shown.length ? (
        <p style={{ color: 'var(--admin-muted)', fontSize: 13 }}>No proformas yet. They appear here when customers use "Get a proforma invoice" in the cart.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map(p => (
            <div key={p.proformaId} className="surface" style={{ borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--admin-muted)' }}>{p.number}</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{p.organization}</span>
                  {p.tin && <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>TIN {p.tin}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                  {[p.contactName, p.phone, p.email].filter(Boolean).join(' · ') || 'No contact details given'} · {dateShort(p.createdAt)} · valid until {dateShort(p.validUntil)}
                </div>
                <div style={{ fontSize: 12.5, marginTop: 6 }}>
                  {(p.items ?? []).map(i => `${i.quantity} × ${i.name}`).join(', ')}
                </div>
                {(p.phone || p.email) && (
                  <QuoteReplyButtons
                    q={{ name: p.contactName || p.organization, organization: p.organization, phone: p.phone, email: p.email }}
                    subject={`Your Blue-Tech proforma ${p.number}`}
                    intro={`Thank you for requesting proforma ${p.number}${p.organization ? ` for ${p.organization}` : ''}. We're happy to help you complete the order.`}
                  />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 18, fontWeight: 700 }}>{money(p.total)}</span>
                <select value={p.status} onChange={e => update.mutate({ id: p.proformaId, status: e.target.value })} style={select}>
                  {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
                <button onClick={() => downloadInvoicePdf(proformaDoc(p, businessInfo))} style={{ ...select, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <FileDown size={13} /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
