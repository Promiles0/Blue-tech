import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bug, CheckCircle2, ChevronDown, Monitor, RotateCcw, Server } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

const card = { borderRadius: 14, padding: '20px 22px' }

function ago(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 90) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return `${Math.round(s / 86400)} days ago`
}

function device(ua = '') {
  if (!ua) return null
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iPhone/iPad' : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'Mac' : /Linux/i.test(ua) ? 'Linux' : 'Other'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'Browser'
  return `${browser} on ${os}`
}

export default function AdminErrors() {
  const queryClient = useQueryClient()
  const [showFixed, setShowFixed] = useState(false)
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['admin-errors'],
    queryFn: () => apiService.admin.errors.getAll().then(r => r.data?.data ?? r.data),
    refetchInterval: 60_000,
  })
  const setStatus = useMutation({
    mutationFn: ({ id, status }) => apiService.admin.errors.setStatus(id, status),
    onSuccess: (_, { status }) => { toast.success(status === 'fixed' ? 'Marked fixed — you\'ll be told if it comes back' : 'Reopened'); queryClient.invalidateQueries({ queryKey: ['admin-errors'] }) },
    onError: () => toast.error('Could not update'),
  })
  const open = data.filter(e => e.status === 'open')
  const fixed = data.filter(e => e.status === 'fixed')
  const list = showFixed ? fixed : open

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bug size={22} style={{ color: 'var(--admin-primary)' }} /> Site errors
      </h1>
      <p style={{ color: 'var(--admin-muted)', fontSize: 13, margin: '4px 0 22px', maxWidth: 640, lineHeight: 1.6 }}>
        Crashes in customers' browsers and unexpected server errors, grouped so one bug is one row.
        You get a notification when a new one appears. Mark it fixed once it's solved — if it happens again, it comes back here.
      </p>

      <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 9, border: '1px solid var(--admin-border)', width: 'fit-content', marginBottom: 16 }}>
        {[[false, `Open (${open.length})`], [true, `Fixed (${fixed.length})`]].map(([v, label]) => (
          <button key={label} onClick={() => setShowFixed(v)} style={{
            padding: '6px 12px', borderRadius: 7, border: 0, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            background: showFixed === v ? 'var(--admin-primary)' : 'transparent', color: showFixed === v ? '#fff' : 'var(--text)',
          }}>{label}</button>
        ))}
      </div>

      <div className="surface" style={card}>
        {isError ? <p style={{ color: 'var(--admin-danger)', fontSize: 13, margin: 0 }}>Failed to load site errors.</p>
          : isLoading ? <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0 }}>Loading…</p>
          : !list.length ? (
            <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: 'var(--admin-success, #22c55e)' }} /> {showFixed ? 'Nothing marked fixed yet.' : 'No open errors. The site is running cleanly.'}
            </p>
          ) : list.map((e, i) => <ErrorRow key={e.id} e={e} first={i === 0} onStatus={(status) => setStatus.mutate({ id: e.id, status })} busy={setStatus.isPending} />)}
      </div>
    </div>
  )
}

function ErrorRow({ e, first, onStatus, busy }) {
  const [open, setOpen] = useState(false)
  const Icon = e.source === 'server' ? Server : Monitor
  return (
    <div style={{ borderTop: first ? 'none' : '1px solid var(--admin-border)', padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Icon size={15} style={{ marginTop: 2, flexShrink: 0, color: e.source === 'server' ? 'var(--admin-warning)' : 'var(--admin-primary)' }} />
        <button onClick={() => setOpen(o => !o)} style={{ flex: 1, minWidth: 0, background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'var(--text)', cursor: 'pointer' }}>
          <div style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-word' }}>{e.message}</div>
          <div style={{ fontSize: 11.5, color: 'var(--admin-muted)', marginTop: 3 }}>
            {e.count}× · last {ago(e.lastSeen)} · first {ago(e.firstSeen)}
            {e.source === 'client' && device(e.userAgent) ? ` · ${device(e.userAgent)}` : ''}
            {e.url ? ` · ${e.url.replace(/^https?:\/\/[^/]+/, '') || '/'}` : ''}
          </div>
        </button>
        <ChevronDown size={14} onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', color: 'var(--admin-muted)', transform: open ? 'rotate(180deg)' : 'none', marginTop: 2 }} />
        {e.status === 'open' ? (
          <button onClick={() => onStatus('fixed')} disabled={busy} style={btn}><CheckCircle2 size={12} /> Mark fixed</button>
        ) : (
          <button onClick={() => onStatus('open')} disabled={busy} style={btn}><RotateCcw size={12} /> Reopen</button>
        )}
      </div>
      {open && (
        <pre style={{ margin: '10px 0 0 25px', padding: 12, borderRadius: 8, background: 'var(--glass-border)', fontSize: 11, lineHeight: 1.5, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 280 }}>
          {[e.stack || '(no stack trace)', e.release ? `\nRelease: ${e.release}` : '', e.userAgent ? `\nDevice: ${e.userAgent}` : ''].join('')}
        </pre>
      )}
    </div>
  )
}

const btn = {
  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
  border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer',
}
