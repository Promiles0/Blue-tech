import { useEffect, useState } from 'react'
import { Save, Truck, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import apiService from '../../api/service'

const card = { marginTop: 24, padding: 24, borderRadius: 14, border: '1px solid var(--admin-border)', background: 'var(--admin-card, transparent)' }
const h2 = { fontSize: 16, fontWeight: 700, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }
const hint = { fontSize: 12.5, color: 'var(--admin-text-muted)', marginBottom: 18 }
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 6 }
const input = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px', fontSize: 13.5, borderRadius: 9, fontFamily: 'inherit',
  border: '1px solid var(--admin-border)', background: 'var(--admin-input-bg, transparent)', color: 'var(--admin-text)', outline: 'none',
}
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }

function SaveBtn({ saving, dirty, onClick }) {
  return (
    <button onClick={onClick} disabled={saving || !dirty} style={{
      marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', fontSize: 13.5, fontWeight: 600,
      background: dirty ? 'var(--admin-accent, #4f46e5)' : 'var(--admin-border)', color: dirty ? '#fff' : 'var(--admin-text-muted)',
      border: 'none', borderRadius: 10, cursor: dirty ? 'pointer' : 'default', fontFamily: 'inherit',
    }}><Save size={15} /> {saving ? 'Saving…' : 'Save'}</button>
  )
}

function useSettingForm(key, saveFn) {
  const qc = useQueryClient()
  const [value, setValue] = useState(null)
  const [saved, setSaved] = useState(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    apiService.admin.settings.get()
      .then(({ data }) => { setValue(data?.[key]); setSaved(data?.[key]) })
      .catch(() => toast.error('Failed to load settings'))
  }, [key])
  const save = async () => {
    setSaving(true)
    try {
      const { data } = await saveFn(value)
      setValue(data); setSaved(data)
      qc.invalidateQueries({ queryKey: ['public-settings'] })
      toast.success('Saved')
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Could not save')
    } finally { setSaving(false) }
  }
  const set = (k) => (e) => setValue(v => ({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  return { value, setValue, set, save, saving, dirty: JSON.stringify(value) !== JSON.stringify(saved) }
}

const range = (v) => Array.isArray(v) ? v : [1, 2]

export function DeliverySettings() {
  const f = useSettingForm('deliveryConfig', apiService.admin.settings.saveDelivery)
  if (!f.value) return <div style={card}>Loading delivery settings…</div>
  const v = f.value
  const setRange = (key, i) => (e) => f.setValue(cur => { const r = [...range(cur[key])]; r[i] = Number(e.target.value); return { ...cur, [key]: r } })
  return (
    <div style={card}>
      <h2 style={h2}><Truck size={17} /> Delivery estimates</h2>
      <p style={hint}>Shown on product pages and at checkout as "Delivered by Tue 20 Oct". Working days; Sundays are skipped unless you deliver on Sundays.</p>
      <div style={grid}>
        <div><label style={lbl}>Kigali — standard (days)</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="number" min={0} max={30} style={input} value={range(v.kigaliStandard)[0]} onChange={setRange('kigaliStandard', 0)} /> to
            <input type="number" min={0} max={30} style={input} value={range(v.kigaliStandard)[1]} onChange={setRange('kigaliStandard', 1)} />
          </div></div>
        <div><label style={lbl}>Other districts — standard (days)</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="number" min={0} max={30} style={input} value={range(v.provinceStandard)[0]} onChange={setRange('provinceStandard', 0)} /> to
            <input type="number" min={0} max={30} style={input} value={range(v.provinceStandard)[1]} onChange={setRange('provinceStandard', 1)} />
          </div></div>
        <div><label style={lbl}>Express (days)</label><input type="number" min={0} max={14} style={input} value={v.expressDays} onChange={f.set('expressDays')} /></div>
        <div><label style={lbl}>Same-day cutoff (hour, 0–23)</label><input type="number" min={0} max={23} style={input} value={v.cutoffHour} onChange={f.set('cutoffHour')} /></div>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 16, fontSize: 13.5, color: 'var(--admin-text)' }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={!!v.deliverSunday} onChange={f.set('deliverSunday')} /> We deliver on Sundays</label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={!!v.pickupEnabled} onChange={f.set('pickupEnabled')} /> Offer pickup at the shop</label>
      </div>
      {v.pickupEnabled && (
        <div style={{ marginTop: 14 }}><label style={lbl}>Pickup address</label><input style={input} value={v.pickupAddress ?? ''} onChange={f.set('pickupAddress')} /></div>
      )}
      <SaveBtn saving={f.saving} dirty={f.dirty} onClick={f.save} />
    </div>
  )
}

export function BusinessSettings() {
  const f = useSettingForm('businessInfo', apiService.admin.settings.saveBusiness)
  if (!f.value) return <div style={card}>Loading business details…</div>
  const v = f.value
  return (
    <div style={card}>
      <h2 style={h2}><FileText size={17} /> Business details for invoices</h2>
      <p style={hint}>Printed on proforma invoices and order invoices. These are not EBM receipts — official EBM receipts still come from your EBM system.</p>
      <div style={grid}>
        <div><label style={lbl}>Business name</label><input style={input} value={v.legalName} onChange={f.set('legalName')} /></div>
        <div><label style={lbl}>TIN</label><input style={input} value={v.tin} onChange={f.set('tin')} placeholder="e.g. 100123456" /></div>
        <div><label style={lbl}>Phone</label><input style={input} value={v.phone} onChange={f.set('phone')} /></div>
        <div><label style={lbl}>Email</label><input style={input} value={v.email} onChange={f.set('email')} /></div>
      </div>
      <div style={{ marginTop: 14 }}><label style={lbl}>Address</label><input style={input} value={v.address} onChange={f.set('address')} /></div>
      <div style={{ ...grid, marginTop: 14 }}>
        <div><label style={lbl}>VAT on invoices</label>
          <select style={input} value={v.vatMode} onChange={f.set('vatMode')}>
            <option value="none">Don't show VAT</option>
            <option value="included">Prices include VAT (show it inside the total)</option>
            <option value="added">Add VAT on top of prices</option>
          </select></div>
        <div><label style={lbl}>VAT rate (%)</label><input type="number" min={0} max={50} style={input} value={v.vatRate} onChange={f.set('vatRate')} disabled={v.vatMode === 'none'} /></div>
        <div><label style={lbl}>Proforma valid for (days)</label><input type="number" min={1} max={180} style={input} value={v.proformaValidDays} onChange={f.set('proformaValidDays')} /></div>
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={lbl}>Payment details printed on invoices (optional)</label>
        <textarea rows={3} style={{ ...input, resize: 'vertical' }} value={v.paymentDetails} onChange={f.set('paymentDetails')} placeholder="e.g. Bank of Kigali, account 000-000000-00, Blue-Tech Ltd · MoMo Pay code 123456" />
      </div>
      <SaveBtn saving={f.saving} dirty={f.dirty} onClick={f.save} />
    </div>
  )
}
