import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import apiService from '../api/service'

// DISPLAY currency only. Every price in the app is stored — and charged — in USD; this
// context decides how that USD number is rendered. Nothing here should ever feed an
// amount into a payment call.
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
    const formatPrice = (usdAmount) => {
      const usd = Number(usdAmount ?? 0)
      const safe = Number.isFinite(usd) ? usd : 0
      if (currency === 'USD') return `$${safe.toFixed(2)}`
      return `${Math.round(safe * rate).toLocaleString('en-US')} RWF`
    }

    return {
      currency,
      setCurrency,
      rate,
      formatPrice,
      // For the checkout disclaimer, which must always name the real USD charge.
      formatUsd: (usdAmount) => `$${(Number(usdAmount) || 0).toFixed(2)}`,
      isConverted: currency !== 'USD',
    }
  }, [currency, rate])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider')
  return ctx
}
