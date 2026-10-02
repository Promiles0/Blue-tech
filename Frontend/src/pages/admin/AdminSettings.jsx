import { useState, useEffect } from 'react'
import { Save, RefreshCw, AlertTriangle, Plus, X, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

export default function AdminSettings() {
  const [rate, setRate] = useState('')
  const [savedRate, setSavedRate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data } = await apiService.admin.settings.get()
      const value = Number(data?.usdToRwfRate)
      if (Number.isFinite(value)) { setRate(String(value)); setSavedRate(value) }
      setAnnouncements(Array.isArray(data?.announcements) ? data.announcements : [])
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    const parsed = Number(rate)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Enter a positive number, e.g. 1471')
      return
    }
    setSaving(true)
    try {
      const { data } = await apiService.admin.settings.updateExchangeRate(parsed)
      setSavedRate(Number(data?.usdToRwfRate ?? parsed))
      toast.success('Exchange rate updated')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update exchange rate')
    } finally {
      setSaving(false)
    }
  }

  const dirty = savedRate != null && Number(rate) !== savedRate
  const preview = Number(rate) > 0 ? (1000000 / Number(rate)).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—'

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--admin-text)', marginBottom: 6 }}>Settings</h1>
        <p style={{ fontSize: 13.5, color: 'var(--admin-text-muted)' }}>
          Store-wide configuration.
        </p>
      </div>

      <div style={{
        background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
        borderRadius: 14, padding: 24, maxWidth: 620,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 4 }}>
          Display exchange rate
        </h2>
        <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          How many Rwandan francs one US dollar buys. Prices are set in RWF; this rate converts
          them for shoppers who switch the storefront to USD, and for card payments.
        </p>

        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>Loading…</p>
        ) : (
          <>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--admin-text-muted)', marginBottom: 8 }}>
              1 USD =
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <input
                type="number"
                min="1"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                style={{
                  flex: 1, maxWidth: 220, padding: '10px 12px', fontSize: 15, fontWeight: 600,
                  background: 'var(--admin-bg)', color: 'var(--admin-text)',
                  border: '1px solid var(--admin-border)', borderRadius: 10,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-muted)' }}>RWF</span>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--admin-text-muted)', marginBottom: 20 }}>
              At this rate a <strong style={{ color: 'var(--admin-text)' }}>1,000,000 RWF</strong> product shows as{' '}
              <strong style={{ color: 'var(--admin-text)' }}>{preview}</strong> to shoppers browsing in USD.
            </p>

            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 10, padding: '11px 13px', marginBottom: 22,
            }}>
              <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--admin-text-muted)', margin: 0 }}>
                Prices are stored in RWF, and mobile money collects that RWF amount exactly.
                Card payments are different — Stripe charges in USD, converted at this rate, so an
                inaccurate rate here means under- or over-charging card customers.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={save}
                disabled={saving || !dirty}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 18px', fontSize: 13.5, fontWeight: 600,
                  background: dirty ? 'var(--admin-accent, #4f46e5)' : 'var(--admin-border)',
                  color: dirty ? '#fff' : 'var(--admin-text-muted)',
                  border: 'none', borderRadius: 10,
                  cursor: saving || !dirty ? 'default' : 'pointer',
                  opacity: saving ? 0.7 : 1, fontFamily: 'inherit',
                }}
              >
                <Save size={15} /> {saving ? 'Saving…' : 'Save rate'}
              </button>
              <button
                onClick={() => { setRate(savedRate != null ? String(savedRate) : ''); }}
                disabled={!dirty}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 16px', fontSize: 13.5, fontWeight: 600,
                  background: 'none', color: 'var(--admin-text-muted)',
                  border: '1px solid var(--admin-border)', borderRadius: 10,
                  cursor: dirty ? 'pointer' : 'default', fontFamily: 'inherit',
                  opacity: dirty ? 1 : 0.5,
                }}
              >
                <RefreshCw size={14} /> Reset
              </button>
            </div>
          </>
        )}
      </div>

      {!loading && <AnnouncementsCard initial={announcements} />}
    </div>
  )
}

const MAX_MESSAGES = 10
const MAX_LENGTH = 80

// The scrolling strip at the top of every storefront page. Only list things that are
// actually true for the shop — an empty list hides the strip.
function AnnouncementsCard({ initial }) {
  const [items, setItems] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [saving, setSaving] = useState(false)

  const cleaned = items.map(i => i.trim()).filter(Boolean)
  const dirty = JSON.stringify(cleaned) !== JSON.stringify(saved)
  const tooLong = items.some(i => i.trim().length > MAX_LENGTH)

  const setItem = (index, value) => setItems(list => list.map((v, i) => i === index ? value : v))
  const remove = (index) => setItems(list => list.filter((_, i) => i !== index))
  const move = (index, delta) => setItems(list => {
    const next = [...list]
    const target = index + delta
    if (target < 0 || target >= next.length) return list
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await apiService.admin.settings.updateAnnouncements(cleaned)
      const next = Array.isArray(data?.announcements) ? data.announcements : cleaned
      setSaved(next)
      setItems(next)
      toast.success(next.length ? 'Announcement bar updated' : 'Announcement bar hidden')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update the announcement bar')
    } finally {
      setSaving(false)
    }
  }

  const iconBtn = (disabled) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, flexShrink: 0,
    background: 'none', border: '1px solid var(--admin-border)', borderRadius: 8,
    color: 'var(--admin-text-muted)', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1,
  })

  return (
    <div style={{
      background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
      borderRadius: 14, padding: 24, maxWidth: 620, marginTop: 20,
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 4 }}>
        Announcement bar
      </h2>
      <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
        The scrolling messages at the top of every page. Only list offers that are real —
        remove every message to hide the bar.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {items.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>No messages — the bar is hidden.</p>
        )}
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              value={item}
              maxLength={MAX_LENGTH + 20}
              onChange={e => setItem(i, e.target.value)}
              placeholder="e.g. Free standard delivery"
              style={{
                flex: 1, minWidth: 0, padding: '9px 12px', fontSize: 14,
                background: 'var(--admin-bg)', color: 'var(--admin-text)',
                border: `1px solid ${item.trim().length > MAX_LENGTH ? '#ef4444' : 'var(--admin-border)'}`,
                borderRadius: 10, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button onClick={() => move(i, -1)} disabled={i === 0} style={iconBtn(i === 0)} title="Move up"><ArrowUp size={14} /></button>
            <button onClick={() => move(i, 1)} disabled={i === items.length - 1} style={iconBtn(i === items.length - 1)} title="Move down"><ArrowDown size={14} /></button>
            <button onClick={() => remove(i)} style={iconBtn(false)} title="Remove"><X size={14} /></button>
          </div>
        ))}
      </div>

      {tooLong && (
        <p style={{ fontSize: 12.5, color: '#ef4444', marginBottom: 12 }}>Keep each message to {MAX_LENGTH} characters or fewer.</p>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => setItems(list => [...list, ''])}
          disabled={items.length >= MAX_MESSAGES}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 16px', fontSize: 13.5, fontWeight: 600,
            background: 'none', color: 'var(--admin-text-muted)',
            border: '1px solid var(--admin-border)', borderRadius: 10,
            cursor: items.length >= MAX_MESSAGES ? 'default' : 'pointer', fontFamily: 'inherit',
            opacity: items.length >= MAX_MESSAGES ? 0.5 : 1,
          }}
        >
          <Plus size={14} /> Add message
        </button>
        <button
          onClick={save}
          disabled={saving || !dirty || tooLong}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', fontSize: 13.5, fontWeight: 600,
            background: dirty && !tooLong ? 'var(--admin-accent, #4f46e5)' : 'var(--admin-border)',
            color: dirty && !tooLong ? '#fff' : 'var(--admin-text-muted)',
            border: 'none', borderRadius: 10,
            cursor: saving || !dirty || tooLong ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1, fontFamily: 'inherit',
          }}
        >
          <Save size={15} /> {saving ? 'Saving…' : 'Save messages'}
        </button>
      </div>
    </div>
  )
}
