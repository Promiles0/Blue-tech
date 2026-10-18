import { useState } from 'react'
import { useT } from '../../lib/i18n'
import { Truck, Zap, Store } from 'lucide-react'
import { RWANDA } from '../../lib/rwandaAddress'
import { useStoreSettings, deliveryWindow, formatWindow, savedDistrict, saveDistrict } from '../../lib/delivery'

const EXPRESS_FEE = '7,500 RWF'

// Product page: "Delivered to Gasabo by Tue 20 – Wed 21 Oct · free", with a district picker.
export default function DeliveryEstimate() {
  const { t, intlLocale } = useT()
  const { deliveryConfig: config } = useStoreSettings()
  const [district, setDistrict] = useState(savedDistrict)
  if (!config) return null

  const standard = deliveryWindow(config, district, 'STANDARD')
  const express = deliveryWindow(config, district, 'EXPRESS')
  const pickup = config.pickupEnabled ? deliveryWindow(config, district, 'PICKUP') : null
  const change = (e) => { setDistrict(e.target.value); saveDistrict(e.target.value) }

  return (
    <div style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: 'var(--muted)', display: 'grid', gap: 8 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {t('Deliver to')}
        <select value={district} onChange={change} aria-label={t('Your district')} style={{
          padding: '4px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          {Object.entries(RWANDA).map(([province, districts]) => (
            <optgroup key={province} label={province}>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <Row icon={Truck} strong={formatWindow(standard, intlLocale)} note={t('free standard delivery')} />
      <Row icon={Zap} strong={formatWindow(express, intlLocale)} note={`${t('express')} · ${EXPRESS_FEE}`} />
      {pickup && <Row icon={Store} strong={formatWindow(pickup, intlLocale)} note={t('pick up at {address}', { address: config.pickupAddress })} />}
      <span style={{ fontSize: 11.5, color: 'var(--muted-dark)' }}>{t('Estimated · order before {time} to count as today', { time: `${String(config.cutoffHour).padStart(2, '0')}:00` })}</span>
    </div>
  )
}

function Row({ icon: Icon, strong, note }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <Icon size={15} style={{ color: 'var(--accent-light, var(--accent))', flexShrink: 0 }} />
      <span><strong style={{ color: 'var(--text)' }}>{strong}</strong> · {note}</span>
    </div>
  )
}
