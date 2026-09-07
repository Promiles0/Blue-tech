import { useState, useEffect } from 'react'
import { Save, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

export default function AdminSettings() {
  const [rate, setRate] = useState('')
  const [savedRate, setSavedRate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data } = await apiService.admin.settings.get()
      const value = Number(data?.usdToRwfRate)
      if (Number.isFinite(value)) { setRate(String(value)); setSavedRate(value) }
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
  const preview = Number(rate) > 0 ? Math.round(1000 * Number(rate)).toLocaleString('en-US') : '—'

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
          How many Rwandan francs one US dollar buys. Used to render prices for shoppers who
          switch the storefront to RWF, and to convert the amount for mobile money charges.
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
              At this rate a <strong style={{ color: 'var(--admin-text)' }}>$1,000.00</strong> product displays as{' '}
              <strong style={{ color: 'var(--admin-text)' }}>{preview} RWF</strong>.
            </p>

            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 10, padding: '11px 13px', marginBottom: 22,
            }}>
              <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--admin-text-muted)', margin: 0 }}>
                Card payments are always charged in USD, so this only changes what shoppers see.
                Mobile money is different — the RWF amount is the amount actually collected, so an
                inaccurate rate here means under- or over-charging real customers.
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
    </div>
  )
}
