import { useQuery } from '@tanstack/react-query'
import { Mail, MessageSquare, MessageCircle, CheckCircle2, XCircle, BellRing } from 'lucide-react'
import apiService from '../../api/service'
import { dateShort } from '../../lib/format'

const CHANNELS = [
  { key: 'email', label: 'Email', Icon: Mail, how: 'Add RESEND_API_KEY (and RESEND_FROM with a verified domain) in Supabase → Edge Functions → Secrets.' },
  { key: 'sms', label: 'SMS', Icon: MessageSquare, how: "Add AT_USERNAME and AT_API_KEY from an Africa's Talking account (optional AT_SENDER_ID)." },
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, how: 'Add WHATSAPP_TOKEN, WHATSAPP_PHONE_ID and WHATSAPP_TEMPLATE (an approved template with one body variable) from Meta WhatsApp Business.' },
]
const STATUS_COLOR = { sent: 'var(--admin-success)', failed: 'var(--admin-danger)', skipped: 'var(--admin-muted)' }
const KIND = { order_update: 'Order update', stock_alert: 'Back in stock' }

// Customer messaging: which channels are live, people waiting for restocks, and a send log.
export default function AdminMessages() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => apiService.admin.messages().then(r => r.data),
  })
  const ch = data?.channels ?? {}
  const anyLive = Object.values(ch).some(Boolean)

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Messages</h1>
      <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4, marginBottom: 24 }}>
        Order updates and back-in-stock alerts go to customers by email, SMS or WhatsApp — on each channel once it's connected.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 24 }}>
        {CHANNELS.map(({ key, label, Icon, how }) => (
          <div key={key} className="surface" style={{ borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
              <Icon size={16} /> {label}
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: ch[key] ? 'var(--admin-success)' : 'var(--admin-muted)' }}>
                {ch[key] ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {isLoading ? '…' : ch[key] ? 'Connected' : 'Not connected'}
              </span>
            </div>
            {!ch[key] && !isLoading && <p style={{ fontSize: 12, color: 'var(--admin-muted)', lineHeight: 1.5, margin: 0 }}>{how}</p>}
          </div>
        ))}
      </div>
      {!isLoading && !anyLive && (
        <p style={{ fontSize: 13, color: 'var(--admin-warning)', marginBottom: 24 }}>
          No channel is connected yet, so customers only see in-app notifications. Everything below is still recorded, so you can contact people by hand.
        </p>
      )}

      <div className="surface" style={{ borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><BellRing size={16} /> Waiting for restock</h2>
        {isLoading ? <p style={{ fontSize: 13, color: 'var(--admin-muted)' }}>Loading…</p> : !data?.waitingAlerts?.length ? (
          <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0 }}>Nobody is waiting. When a product sells out, customers can ask to be told when it's back.</p>
        ) : data.waitingAlerts.map(p => (
          <div key={p.productId} style={{ padding: '10px 0', borderTop: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <a href={`/products/${p.productId}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>{p.name}</a>
              <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{p.contacts.length} waiting</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--admin-muted)', marginTop: 4 }}>
              {p.contacts.map(c => c.email || c.phone).join(' · ')}
            </div>
          </div>
        ))}
        <p style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 10, marginBottom: 0 }}>They're messaged automatically when you restock (dashboard restock box or product edit) and a channel is connected.</p>
      </div>

      <div className="surface" style={{ borderRadius: 14, padding: '20px 22px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Recent messages</h2>
        {isLoading ? <p style={{ fontSize: 13, color: 'var(--admin-muted)' }}>Loading…</p> : !data?.log?.length ? (
          <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0 }}>No messages yet.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>When</th><th>Type</th><th>Channel</th><th>To</th><th>Result</th></tr></thead>
            <tbody>
              {data.log.map((m, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap' }}>{dateShort(m.createdAt)}</td>
                  <td>{KIND[m.kind] ?? m.kind}</td>
                  <td style={{ textTransform: 'capitalize' }}>{m.channel}</td>
                  <td>{m.recipient}</td>
                  <td style={{ color: STATUS_COLOR[m.status] }} title={m.detail ?? ''}>{m.status}{m.detail ? ` — ${m.detail}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
