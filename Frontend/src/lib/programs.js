import { useQuery } from '@tanstack/react-query'
import apiService from '../api/service'
import { useStoreSettings } from './delivery'

// Program settings (trade-in, instalments, loyalty, student) — all off until the admin turns
// them on. These estimates mirror the API's formulas; the API's numbers are the real ones.
export function usePrograms() {
  return useStoreSettings().programs ?? null
}

export const TRADE_IN_TYPES = ['laptop', 'desktop', 'phone', 'tablet', 'monitor', 'printer']
export const CONDITIONS = ['excellent', 'good', 'fair', 'broken']
const CONDITION_FACTOR = { excellent: 1.1, good: 1, fair: 0.7, broken: 0.25 }

export function tradeInEstimate(programs, type, ageYears, condition) {
  const base = programs?.tradeIn?.enabled ? programs.tradeIn.baseValues?.[type] : null
  if (!base) return null
  const ageFactor = Math.max(0.2, 1 - 0.18 * Math.max(0, ageYears - 1))
  const mid = base * ageFactor * (CONDITION_FACTOR[condition] ?? 1)
  const round = (n) => Math.round(n / 5000) * 5000
  return { low: round(mid * 0.85), high: round(mid * 1.15) }
}

export function instalmentPlan(programs, price, months) {
  const p = programs.instalments
  const total = price * (1 + p.feePercent / 100)
  const deposit = Math.round(total * p.depositPercent / 100)
  return { total: Math.round(total), deposit, monthly: Math.ceil((total - deposit) / months) }
}

// Signed-in shopper's points balance and student status.
export function useRewards(enabled) {
  return useQuery({
    queryKey: ['my-rewards'],
    queryFn: () => apiService.rewards.get().then(r => r.data),
    enabled,
    staleTime: 60_000,
  })
}
