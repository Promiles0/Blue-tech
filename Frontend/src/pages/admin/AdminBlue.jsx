import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, MessagesSquare, UserRound, FileText, SearchX, Save, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { dateShort } from '../../lib/format'

const RANGES = [7, 30, 90]

const card = { borderRadius: 14, padding: '20px 22px' }
const h2 = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, margin: '0 0 14px' }

function timeShort(iso) {
  try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}

export default function AdminBlue() {
  const [days, setDays] = useState(30)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-blue-insights', days],
    queryFn: () => apiService.admin.chat.insights(days).then(r => r.data?.data ?? r.data),
  })
  const t = data?.totals

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={22} style={{ color: 'var(--admin-primary)' }} /> Blue — AI assistant
          </h1>
          <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>
            What customers ask, what Blue recommends, and what they wanted that you don't stock. Chats are anonymous.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 9, border: '1px solid var(--admin-border)' }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setDays(r)} style={{
              padding: '6px 12px', borderRadius: 7, border: 0, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              background: days === r ? 'var(--admin-primary)' : 'transparent', color: days === r ? '#fff' : 'var(--text)',
            }}>{r} days</button>
          ))}
        </div>
      </div>

      {isError && <p style={{ color: 'var(--admin-danger)', fontSize: 13 }}>Failed to load Blue insights.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Stat icon={MessagesSquare} label="Conversations" value={t?.conversations} sub={t ? `${t.messages} questions` : null} loading={isLoading} />
        <Stat icon={Sparkles} label="Answered with products" value={t ? pct(t.withProducts, t.messages) : null} loading={isLoading} />
        <Stat icon={UserRound} label="Handed to a person" value={t?.handoffsHuman} loading={isLoading} />
        <Stat icon={FileText} label="Sent to quote form" value={t?.handoffsQuote} loading={isLoading} />
        <Stat icon={SearchX} label="Couldn't find a match" value={t?.noMatch} loading={isLoading} tone="var(--admin-warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="surface" style={card}>
          <h2 style={h2}>Top topics</h2>
          <BarList rows={(data?.topTopics ?? []).map(r => ({ label: r.topic, count: r.count }))} empty="No questions yet." loading={isLoading} />
        </div>
        <div className="surface" style={card}>
          <h2 style={h2}>Most recommended products</h2>
          <BarList rows={(data?.topProducts ?? []).map(r => ({ label: r.name, count: r.count, to: `/products/${r.productId}` }))} empty="Blue hasn't recommended products yet." loading={isLoading} />
        </div>
      </div>

      <div className="surface" style={{ ...card, marginBottom: 20 }}>
        <h2 style={h2}>Missed demand — things customers wanted that you don't stock</h2>
        {isLoading ? <Muted>Loading…</Muted> : !data?.missedDemand?.length ? (
          <Muted>Nothing missed in this period. 🎉</Muted>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {data.missedDemand.map((m, i) => (
              <li key={i} style={{ padding: '10px 0', borderTop: i ? '1px solid var(--admin-border)' : 'none', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>“{m.question}”</span>
                <span style={{ fontSize: 11.5, color: 'var(--admin-muted)', whiteSpace: 'nowrap' }}>{m.topic ? `${m.topic} · ` : ''}{dateShort(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 1fr)', gap: 16 }} className="blue-admin-split">
        <div className="surface" style={card}>
          <h2 style={h2}>Recent conversations</h2>
          {isLoading ? <Muted>Loading…</Muted> : !data?.conversations?.length ? (
            <Muted>No conversations yet. They'll appear here as customers chat with Blue.</Muted>
          ) : data.conversations.map(c => <Conversation key={c.sessionId} c={c} />)}
        </div>
        <BlueSettings />
      </div>
      <style>{`@media (max-width: 900px){ .blue-admin-split{ grid-template-columns: 1fr !important } }`}</style>
    </div>
  )
}

const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : '—')
const Muted = ({ children }) => <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0 }}>{children}</p>

function Stat({ icon: Icon, label, value, sub, loading, tone }) {
  return (
    <div className="surface" style={{ borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-muted)', marginBottom: 8 }}>
        <Icon size={12} style={{ color: tone ?? 'var(--admin-primary)' }} /> {label}
      </div>
      <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 24, fontWeight: 700, color: tone ?? 'var(--text)' }}>{loading ? '—' : (value ?? 0)}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--admin-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function BarList({ rows, empty, loading }) {
  if (loading) return <Muted>Loading…</Muted>
  if (!rows.length) return <Muted>{empty}</Muted>
  const max = Math.max(...rows.map(r => r.count))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map(r => (
        <div key={r.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
            {r.to ? <a href={r.to} target="_blank" rel="noreferrer" style={{ color: 'var(--text)' }}>{r.label}</a> : <span style={{ textTransform: 'capitalize' }}>{r.label}</span>}
            <span style={{ color: 'var(--admin-muted)' }}>{r.count}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--glass-border)' }}>
            <div style={{ height: '100%', width: `${(r.count / max) * 100}%`, borderRadius: 3, background: 'var(--admin-primary)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Conversation({ c }) {
  const [open, setOpen] = useState(false)
  const first = c.turns[0]
  return (
    <div style={{ borderTop: '1px solid var(--admin-border)', padding: '10px 0' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 0, color: 'var(--text)', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0, color: 'var(--admin-muted)' }} />
        <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{first?.question}</span>
        {c.noMatch && <Tag tone="var(--admin-warning)">No match</Tag>}
        {c.handoff && <Tag tone="#3b82f6">Handoff</Tag>}
        <span style={{ fontSize: 11, color: 'var(--admin-muted)', whiteSpace: 'nowrap' }}>{c.turns.length} msg · {timeShort(c.lastAt)}</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0 4px 24px' }}>
          {c.turns.map((t, i) => (
            <div key={i}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Customer: <span style={{ fontWeight: 400 }}>{t.question}</span></div>
              <div style={{ fontSize: 12.5, color: 'var(--admin-muted)', marginTop: 3, whiteSpace: 'pre-line' }}>Blue: {t.reply}</div>
              {(t.productIds?.length > 0 || t.handoff !== 'none') && (
                <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 3 }}>
                  {t.productIds?.length > 0 && <>Recommended {t.productIds.map((id, j) => <a key={id} href={`/products/${id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--admin-primary)' }}>{j ? ', ' : ' '}#{id}</a>)}</>}
                  {t.handoff !== 'none' && <> · handed off to {t.handoff === 'quote' ? 'quote form' : 'a person'}</>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Tag = ({ tone, children }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, color: tone, border: `1px solid ${tone}`, whiteSpace: 'nowrap' }}>{children}</span>
)

const PLACEHOLDER = `Examples:
- Shop hours: Mon–Sat 8:00–19:00, closed Sunday.
- Address: (your shop address in Kigali)
- This month: 10% off all HP printers with code PRINT10.
- We can install interactive screens in Kigali within 3 days.`

function BlueSettings() {
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiService.admin.settings.getBlue()
      .then(({ data }) => { const v = (data?.data ?? data)?.instructions ?? ''; setValue(v); setSaved(v) })
      .catch(() => toast.error('Could not load Blue settings'))
      .finally(() => setLoaded(true))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await apiService.admin.settings.saveBlue(value)
      setSaved(value)
      toast.success('Saved — Blue uses this within 5 minutes')
    } catch {
      toast.error('Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="surface" style={{ ...card, alignSelf: 'start' }}>
      <h2 style={h2}>Teach Blue</h2>
      <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', lineHeight: 1.6, margin: '0 0 12px' }}>
        Facts Blue should know that aren't in the catalogue: opening hours, address, current promotions, installation, delivery times.
        Write plain sentences. Blue only states what's here or in the catalogue.
      </p>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={!loaded}
        placeholder={PLACEHOLDER}
        rows={10}
        maxLength={4000}
        style={{
          width: '100%', resize: 'vertical', fontSize: 13, lineHeight: 1.55, padding: '10px 12px', borderRadius: 8, fontFamily: 'inherit',
          border: '1px solid var(--admin-border)', background: 'var(--glass-border)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{value.length}/4000</span>
        <button onClick={save} disabled={saving || value === saved} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 0, fontSize: 13, fontWeight: 600,
          background: 'var(--admin-primary)', color: '#fff', cursor: 'pointer', opacity: value === saved ? 0.5 : 1,
        }}><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}
