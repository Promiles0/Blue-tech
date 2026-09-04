import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { dateShort } from '../../lib/format'

const STATUSES = ['new', 'contacted', 'closed']

function fetchQuoteRequests(status) {
  return apiService.admin.quoteRequests.getAll(status).then(r => r.data)
}

export default function AdminQuoteRequests() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['admin-quote-requests', statusFilter],
    queryFn: () => fetchQuoteRequests(statusFilter || null),
  })

  const filtered = search
    ? allRequests.filter(q =>
        (q.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (q.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (q.organization ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : allRequests

  const updateStatus = useMutation({
    mutationFn: ({ quoteRequestId, status }) =>
      apiService.admin.quoteRequests.updateStatus(quoteRequestId, status).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-quote-requests'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  return (
    <div style={{ padding: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Quote Requests</h1>
          <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>Interactive Screens leads from the "Request a Quote" form</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, organization…"
              style={{ ...inputStyle, paddingLeft: 32, width: 240 }}
            />
          </div>
          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
      ) : !filtered.length ? (
        <div style={{ color: 'var(--admin-muted)', fontSize: 13 }}>No quote requests match.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(q => (
            <div key={q.quoteRequestId} className="surface" style={{
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
            }}>
              {/* Left content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{q.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{q.email}{q.phone ? ` · ${q.phone}` : ''}</span>
                  {q.organization && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--glass-border)', color: 'var(--admin-muted)' }}>
                      {q.organization}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginBottom: 8 }}>
                  {q.intendedUse === 'classroom' ? 'Classroom' : 'Office'} · {q.screenSize} · Qty {q.quantity} · {dateShort(q.createdAt)}
                </div>
                {q.notes && (
                  <p style={{ fontSize: 13, color: 'var(--text)', opacity: 0.85, lineHeight: 1.5, margin: 0 }}>{q.notes}</p>
                )}
              </div>

              {/* Right: status control */}
              <div style={{ flexShrink: 0 }}>
                <select
                  value={q.status}
                  disabled={updateStatus.isPending}
                  onChange={e => updateStatus.mutate({ quoteRequestId: q.quoteRequestId, status: e.target.value })}
                  style={selectStyle}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  background: 'var(--glass-border)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: 'var(--text)', padding: '7px 12px', fontSize: 13, outline: 'none',
}
const selectStyle = {
  background: 'var(--glass-border)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: 'var(--text)', padding: '7px 12px', fontSize: 13, cursor: 'pointer',
}
