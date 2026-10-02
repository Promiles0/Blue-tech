import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import apiService from '../api/service'

// DISPLAY currency only. Every price in the app is stored in RWF; this context decides
// whether that RWF number is shown as-is or converted to USD at the admin's exchange
// rate. Nothing here should ever feed an amount into a payment call — the server works
// out the charge (RWF for mobile money, USD for cards) from the order total itself.
const CurrencyContext = createContext()

const STORAGE_KEY = 'noir-currency'
const CURRENCIES = ['RWF', 'USD']

// Used until /settings responds, and if it never does. Matches the seeded DB value so a
// slow network shows the same number the server would have sent, not a wildly different one.
const FALLBACK_RATE = 1471

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return CURRENCIES.includes(saved) ? saved : 'RWF'
    } catch {
      return 'RWF' // private mode / storage blocked
    }
  })
  const [rate, setRate] = useState(FALLBACK_RATE)

  useEffect(() => {
    let cancelled = false
    apiService.settings.get()
      .then(({ data }) => {
        const fetched = Number(data?.usdToRwfRate)
        if (!cancelled && Number.isFinite(fetched) && fetched > 0) setRate(fetched)
      })
      .catch(() => { /* keep the fallback — prices must still render */ })
    return () => { cancelled = true }
  }, [])

  const setCurrency = (next) => {
    if (!CURRENCIES.includes(next)) return
    setCurrencyState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* non-fatal */ }
  }

  const value = useMemo(() => {
    // RWF has no minor unit in practice, so it renders as a whole number with separators.
    const toUsd = (rwfAmount) => {
      const rwf = Number(rwfAmount ?? 0)
      return Number.isFinite(rwf) && rate > 0 ? rwf / rate : 0
    }
    const formatRwf = (rwfAmount) => {
      const rwf = Number(rwfAmount ?? 0)
      return `${Math.round(Number.isFinite(rwf) ? rwf : 0).toLocaleString('en-US')} RWF`
    }
    const formatPrice = (rwfAmount) => (
      currency === 'USD' ? `$${toUsd(rwfAmount).toFixed(2)}` : formatRwf(rwfAmount)
    )

    return {
      currency,
      setCurrency,
      rate,
      formatPrice,
      formatRwf,
      // Card payments are charged in USD — the checkout names that exact amount.
      formatUsd: (rwfAmount) => `$${toUsd(rwfAmount).toFixed(2)}`,
      isConverted: currency !== 'RWF',
    }
  }, [currency, rate])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider')
  return ctx
}
