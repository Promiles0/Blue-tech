import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Repeat, CalendarClock, Gift, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { money, dateShort } from '../../lib/format'
import { QuoteReplyButtons } from './QuoteReplyTools'

const TYPES = ['laptop', 'desktop', 'phone', 'tablet', 'monitor', 'printer']
const card = { borderRadius: 14, padding: '20px 22px', marginBottom: 16 }
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-muted)', marginBottom: 6 }
const input = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13.5, borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--glass-border)', color: 'var(--text)', fontFamily: 'inherit' }
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }

function Toggle({ on, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
      <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} /> {label}
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: on ? 'rgba(34,197,94,.15)' : 'var(--glass-border)', color: on ? 'var(--admin-success)' : 'var(--admin-muted)' }}>{on ? 'ON' : 'OFF'}</span>
    </label>
  )
}

// Trade-in, instalments, loyalty points and student discount: rules + incoming requests.
export default function AdminPrograms() {
  const qc = useQueryClient()
  const [p, setP] = useState(null)
  const [saved, setSaved] = useState(null)
  const [saving, setSaving] = useState(false)
  const { data: requests } = useQuery({ queryKey: ['admin-program-requests'], queryFn: () => apiService.admin.programs.requests().then(r => r.data) })

  useEffect(() => {
    apiService.admin.settings.get().then(({ data }) => { setP(data?.programs); setSaved(data?.programs) }).catch(() => toast.error('Failed to load settings'))
  }, [])

  const set = (section, key, value) => setP(v => ({ ...v, [section]: { ...v[section], [key]: value } }))
  const save = async () => {
    setSaving(true)
    try {
      const { data } = await apiService.admin.programs.saveSettings(p)
      setP(data); setSaved(data)
      qc.invalidateQueries({ queryKey: ['public-settings'] })
      toast.success('Saved — live on the site within a minute')
    } catch (e) { toast.error(e?.response?.data?.message ?? 'Could not save') } finally { setSaving(false) }
  }
  const setStatus = async (kind, id, status) => {
    try { await apiService.admin.programs.setStatus(kind, id, status); qc.invalidateQueries({ queryKey: ['admin-program-requests'] }) }
    catch { toast.error('Could not update') }
  }
  const dirty = JSON.stringify(p) !== JSON.stringify(saved)

  if (!p) return <div style={{ padding: 40, color: 'var(--admin-muted)' }}>Loading…</div>
  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Programs</h1>
          <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>Each program is hidden from customers until you switch it on and save.</p>
        </div>
        <button onClick={save} disabled={!dirty || saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, border: 0, fontWeight: 600, fontSize: 13.5, background: dirty ? 'var(--admin-primary)' : 'var(--admin-border)', color: dirty ? '#fff' : 'var(--admin-muted)', cursor: dirty ? 'pointer' : 'default' }}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Trade-in */}
      <div className="surface" style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Repeat size={16} /> Trade-in</h2>
        <Toggle on={p.tradeIn.enabled} onChange={v => set('tradeIn', 'enabled', v)} label="Show estimates to customers" />
        <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', margin: '10px 0' }}>
          Base value = what you'd pay for a one-year-old device in good condition. The estimate lowers it ~18% per extra year and by condition (excellent ×1.1, fair ×0.7, broken ×0.25), shown as a ±15% range. Empty = no estimate for that type (the request is still collected).
        </p>
        <div style={grid}>
          {TYPES.map(type => (
            <div key={type}><label style={lbl}>{type[0].toUpperCase() + type.slice(1)} (RWF)</label>
              <input type="number" min={0} style={input} value={p.tradeIn.baseValues?.[type] ?? ''} placeholder="—"
                onChange={e => set('tradeIn', 'baseValues', { ...p.tradeIn.baseValues, [type]: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
          ))}
        </div>
      </div>

      {/* Instalments */}
      <div className="surface" style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><CalendarClock size={16} /> Pay in instalments</h2>
        <Toggle on={p.instalments.enabled} onChange={v => set('instalments', 'enabled', v)} label='Show "Pay in instalments" on product pages' />
        <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', margin: '10px 0' }}>Customers send a request; you approve it and collect the deposit and monthly MoMo payments yourself.</p>
        <div style={grid}>
          <div><label style={lbl}>Deposit (%)</label><input type="number" min={0} max={90} style={input} value={p.instalments.depositPercent} onChange={e => set('instalments', 'depositPercent', Number(e.target.value))} /></div>
          <div><label style={lbl}>Plans (months, comma-separated)</label><input style={input} value={p.instalments.months.join(', ')} onChange={e => set('instalments', 'months', e.target.value.split(',').map(x => Number(x.trim())).filter(Boolean))} /></div>
          <div><label style={lbl}>Fee on top (%)</label><input type="number" min={0} max={50} style={input} value={p.instalments.feePercent} onChange={e => set('instalments', 'feePercent', Number(e.target.value))} /></div>
          <div><label style={lbl}>Minimum product price (RWF)</label><input type="number" min={0} style={input} value={p.instalments.minPrice} onChange={e => set('instalments', 'minPrice', Number(e.target.value))} /></div>
        </div>
      </div>

      {/* Loyalty */}
      <div className="surface" style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Gift size={16} /> Loyalty points</h2>
        <Toggle on={p.loyalty.enabled} onChange={v => set('loyalty', 'enabled', v)} label="Award and accept points" />
        <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', margin: '10px 0' }}>
          Points are earned when an order is paid and can be spent at checkout. With the values below, a 1,000,000 RWF order earns {Math.floor(1000 * p.loyalty.pointsPer1000)} points worth {money(Math.floor(1000 * p.loyalty.pointsPer1000) * p.loyalty.pointValue)}.
        </p>
        <div style={grid}>
          <div><label style={lbl}>Points per 1,000 RWF</label><input type="number" min={0} step="0.1" style={input} value={p.loyalty.pointsPer1000} onChange={e => set('loyalty', 'pointsPer1000', Number(e.target.value))} /></div>
          <div><label style={lbl}>Value of 1 point (RWF)</label><input type="number" min={0} style={input} value={p.loyalty.pointValue} onChange={e => set('loyalty', 'pointValue', Number(e.target.value))} /></div>
          <div><label style={lbl}>Max. points discount per order (%)</label><input type="number" min={0} max={100} style={input} value={p.loyalty.maxRedeemPercent} onChange={e => set('loyalty', 'maxRedeemPercent', Number(e.target.value))} /></div>
        </div>
      </div>

      {/* Student */}
      <div className="surface" style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><GraduationCap size={16} /> Student discount</h2>
        <Toggle on={p.student.enabled} onChange={v => set('student', 'enabled', v)} label="Let students apply (Account page)" />
        <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', margin: '10px 0' }}>You approve each student below; approval lasts one year and the discount is applied automatically at checkout.</p>
        <div style={{ ...grid, maxWidth: 240 }}>
          <div><label style={lbl}>Discount (%)</label><input type="number" min={0} max={50} style={input} value={p.student.percent} onChange={e => set('student', 'percent', Number(e.target.value))} /></div>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 12px' }}>Requests</h2>
      <RequestList title="Trade-in requests" rows={requests?.tradeIns} statuses={['new', 'contacted', 'accepted', 'declined']} onStatus={(id, s) => setStatus('trade-ins', id, s)}
        render={r => <>
          <strong>{r.name}</strong> · {r.phone}{r.email ? ` · ${r.email}` : ''}
          <div style={{ color: 'var(--admin-muted)' }}>{[r.device_type, r.brand, r.model].filter(Boolean).join(' · ')} · {r.age_years} yr · {r.condition}{r.estimate_low ? ` · est. ${money(r.estimate_low)}–${money(r.estimate_high)}` : ''}</div>
          {r.notes && <div style={{ marginTop: 4 }}>{r.notes}</div>}
          <QuoteReplyButtons q={{ name: r.name, phone: r.phone, email: r.email }} subject="Your Blue-Tech trade-in" intro={`Thank you for your trade-in request for your ${r.brand ?? ''} ${r.device_type}.`} />
        </>} />
      <RequestList title="Instalment requests" rows={requests?.instalments} statuses={['new', 'contacted', 'approved', 'declined']} onStatus={(id, s) => setStatus('instalments', id, s)}
        render={r => <>
          <strong>{r.name}</strong> · {r.phone}
          <div style={{ color: 'var(--admin-muted)' }}>{r.product_name} · {money(r.price)} · deposit {money(r.deposit)} then {r.months} × {money(r.monthly)}</div>
          <QuoteReplyButtons q={{ name: r.name, phone: r.phone, email: r.email }} subject="Your Blue-Tech instalment plan" intro={`Thank you for your request to pay for the ${r.product_name} in ${r.months} months.`} />
        </>} />
      <RequestList title="Student discount requests" rows={requests?.students} statuses={['new', 'approved', 'declined']} onStatus={(id, s) => setStatus('students', id, s)}
        render={r => <>
          <strong>{r.users?.name ?? 'Customer'}</strong> · {r.users?.email}
          <div style={{ color: 'var(--admin-muted)' }}>{r.school} · school email: {r.school_email}{r.users?.student_verified_until ? ` · verified until ${r.users.student_verified_until}` : ''}</div>
        </>} />
    </div>
  )
}

function RequestList({ title, rows, statuses, onStatus, render }) {
  return (
    <div className="surface" style={card}>
      <h3 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 10 }}>{title} <span style={{ color: 'var(--admin-muted)', fontWeight: 500 }}>({rows?.length ?? 0})</span></h3>
      {!rows?.length ? <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0 }}>None yet.</p> : rows.map(r => (
        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: '1px solid var(--admin-border)', fontSize: 13 }}>
          <div style={{ flex: 1, minWidth: 0 }}>{render(r)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 11.5, color: 'var(--admin-muted)' }}>{dateShort(r.created_at)}</span>
            <select value={r.status} onChange={e => onStatus(r.id, e.target.value)} style={{ ...input, width: 'auto' }}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}
