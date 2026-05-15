const KEY = 'noir_recently_viewed'
const MAX = 12

// Strips the /uploads/products/ prefix that was incorrectly prepended to
// some absolute URLs when products were seeded or edited in older versions.
function normalizeImageUrl(url) {
  if (!url) return ''
  const m = url.match(/^\/uploads\/products\/(https?:\/\/.+)/)
  return m ? m[1] : url
}

function entryId(p) {
  return p.id ?? p.productId
}

export function trackRecentlyViewed(product) {
  const id = product.productId ?? product.id
  const rawUrl =
    product.images?.find(i => i.isPrimary)?.imageUrl
    ?? product.images?.[0]?.imageUrl
    ?? product.primaryImageUrl
    ?? product.imageUrl
    ?? ''

  const entry = {
    id,
    name:     product.name,
    price:    product.startingPrice ?? product.price,
    imageUrl: normalizeImageUrl(rawUrl),
  }

  const stored  = getRecentlyViewed()
  // Deduplicate against both `id` and legacy `productId` fields
  const updated = [entry, ...stored.filter(p => entryId(p) !== id)].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save recently viewed', e)
  }
}

export function getRecentlyViewed() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    // Normalize legacy entries (productId → id) and fix corrupted image URLs,
    // then deduplicate by id in case both old and new formats co-exist.
    const seen = new Set()
    return raw
      .map(p => ({ ...p, id: p.id ?? p.productId, imageUrl: normalizeImageUrl(p.imageUrl ?? '') }))
      .filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
  } catch {
    return []
  }
}
