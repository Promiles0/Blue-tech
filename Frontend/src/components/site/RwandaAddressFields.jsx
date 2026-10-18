import { RWANDA } from '../../lib/rwandaAddress'
import { useT } from '../../lib/i18n'

// Province → District selects, sector/street and an optional landmark. See lib/rwandaAddress.
const label = { display: 'block', fontSize: 12, color: 'var(--text-muted, var(--muted))', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }

export default function RwandaAddressFields({ value, onChange, withPhone = true }) {
  const { t } = useT()
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })
  const districts = RWANDA[value.state] ?? []
  return (
    <div className="rw-address">
      <div>
        <label style={label} htmlFor="rw-province">{t('Province')}</label>
        <select id="rw-province" className="noir-input" value={value.state} onChange={e => onChange({ ...value, state: e.target.value, city: '' })}>
          {Object.keys(RWANDA).map(p => <option key={p} value={p}>{t(p)}</option>)}
        </select>
      </div>
      <div>
        <label style={label} htmlFor="rw-district">{t('District')}</label>
        <select id="rw-district" className="noir-input" value={value.city} onChange={set('city')}>
          <option value="">{t('Choose district…')}</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="rw-wide">
        <label style={label} htmlFor="rw-street">{t('Sector, street & house / building')}</label>
        <input id="rw-street" className="noir-input" value={value.street} onChange={set('street')} placeholder={t('e.g. Kimihurura, KG 7 Ave, house 12')} />
      </div>
      <div className="rw-wide">
        <label style={label} htmlFor="rw-landmark">{t('Nearby landmark')} <span style={{ fontWeight: 400, textTransform: 'none' }}>({t('optional, helps the courier')})</span></label>
        <input id="rw-landmark" className="noir-input" value={value.landmark ?? ''} onChange={set('landmark')} placeholder={t('e.g. opposite Kigali Heights, blue gate')} />
      </div>
      {withPhone && (
        <div className="rw-wide">
          <label style={label} htmlFor="rw-phone">{t('Phone number (for the courier)')}</label>
          <input id="rw-phone" className="noir-input" type="tel" inputMode="tel" value={value.phone} onChange={set('phone')} placeholder="078 123 4567" />
        </div>
      )}
      <style>{`
        .rw-address{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        .rw-address .rw-wide{grid-column:1 / -1}
        .rw-address select.noir-input{cursor:pointer}
        @media (max-width:560px){.rw-address{grid-template-columns:1fr}}
      `}</style>
    </div>
  )
}
