// Every stored amount (prices, order totals, revenue) is RWF.
export function money(amount, currency = 'RWF') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: currency === 'RWF' ? 0 : 2 }).format(amount ?? 0)
}

export function dateShort(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

export function dateTime(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(d))
}
