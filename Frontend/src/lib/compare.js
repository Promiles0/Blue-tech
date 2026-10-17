import { useSyncExternalStore } from 'react'

// Products picked for side-by-side comparison (max 3). A tiny external store rather than
// another context provider: any card, the tray and /compare read the same list, and it
// survives reloads via localStorage.
export const COMPARE_MAX = 3
const KEY = 'bt-compare'
const listeners = new Set()

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(saved) ? saved.slice(0, COMPARE_MAX) : []
  } catch { return [] }
}

let items = read()

function write(next) {
  items = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* non-fatal */ }
  listeners.forEach((l) => l())
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

// Stores just enough to draw the tray; /compare fetches full details.
export function toggleCompare(product) {
  const id = product.productId ?? product.id
  if (items.some((p) => p.id === id)) { write(items.filter((p) => p.id !== id)); return 'removed' }
  if (items.length >= COMPARE_MAX) return 'full'
  write([...items, { id, name: product.name, image: product.primaryImageUrl ?? product.imageUrl ?? product.images?.[0]?.imageUrl ?? null }])
  return 'added'
}

export const removeCompare = (id) => write(items.filter((p) => p.id !== id))
export const clearCompare = () => write([])

export function useCompare() {
  return useSyncExternalStore(subscribe, () => items, () => items)
}
