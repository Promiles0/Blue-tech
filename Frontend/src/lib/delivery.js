import { useQuery } from '@tanstack/react-query'
import apiService from '../api/service'

// Public store settings (delivery estimates, invoice details), edited in Admin → Settings.
export function useStoreSettings() {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => apiService.settings.get().then(r => r.data ?? {}),
    staleTime: 10 * 60 * 1000,
  })
  return data ?? {}
}

const DISTRICT_KEY = 'bt-district'
export function savedDistrict() {
  try { return localStorage.getItem(DISTRICT_KEY) || 'Gasabo' } catch { return 'Gasabo' }
}
export function saveDistrict(d) {
  try { localStorage.setItem(DISTRICT_KEY, d) } catch { /* non-fatal */ }
}

// Kigali wall-clock parts for "now", whatever the shopper's device time zone is.
function kigaliNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  }).formatToParts(now).map(p => [p.type, p.value]))
  return { date: new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day)), hour: +parts.hour % 24 }
}

// Add delivery days, skipping Sundays when the shop doesn't deliver then.
function addDeliveryDays(start, days, deliverSunday) {
  const d = new Date(start)
  let left = days
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (deliverSunday || d.getUTCDay() !== 0) left--
  }
  if (!deliverSunday && d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1)
  return d
}

// { from, to } dates for a district and method, or null when config isn't loaded yet.
export function deliveryWindow(config, district, method = 'STANDARD', now) {
  if (!config?.kigaliStandard) return null
  const { date, hour } = kigaliNow(now)
  // Orders after the cutoff are handled as if placed the next morning.
  const start = hour >= (config.cutoffHour ?? 15) ? addDeliveryDays(date, 1, true) : date
  if (method === 'PICKUP') return { from: start, to: start }
  if (method === 'EXPRESS') {
    const d = addDeliveryDays(start, config.expressDays ?? 1, config.deliverSunday)
    return { from: d, to: d }
  }
  const inKigali = (config.kigaliDistricts ?? []).includes(district)
  const [a, b] = inKigali ? config.kigaliStandard : config.provinceStandard
  return { from: addDeliveryDays(start, a, config.deliverSunday), to: addDeliveryDays(start, b, config.deliverSunday) }
}

// Browsers don't ship Kinyarwanda calendar names, so these are spelled out here.
const RW_DAYS = ['Ku cyumweru', 'Kuwa mbere', 'Kuwa kabiri', 'Kuwa gatatu', 'Kuwa kane', 'Kuwa gatanu', 'Kuwa gatandatu']
const RW_MONTHS = ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena', 'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza']
const rwDay = (d, withMonth) => `${RW_DAYS[d.getUTCDay()]} ${d.getUTCDate()}${withMonth ? ` ${RW_MONTHS[d.getUTCMonth()]}` : ''}`

// "Tue 20 Oct" or "Tue 20 – Thu 22 Oct", in the shopper's language.
export function formatWindow(win, locale = 'en-GB') {
  if (!win) return ''
  if (locale.startsWith('rw')) {
    const same = win.from.getTime() === win.to.getTime()
    return same ? rwDay(win.from, true) : `${rwDay(win.from, win.from.getUTCMonth() !== win.to.getUTCMonth())} – ${rwDay(win.to, true)}`
  }
  const fmt = (d, opts) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts }).format(d)
  if (win.from.getTime() === win.to.getTime()) return fmt(win.from, { weekday: 'short', day: 'numeric', month: 'short' })
  return `${fmt(win.from, { weekday: 'short', day: 'numeric' })} – ${fmt(win.to, { weekday: 'short', day: 'numeric', month: 'short' })}`
}
