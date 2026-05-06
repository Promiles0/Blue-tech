const KEY = 'noir_recently_viewed'
const MAX = 12

export function trackRecentlyViewed(product) {
  const id = product.productId ?? product.id
  const entry = {
    id,
    name:     product.name,
    price:    product.startingPrice ?? product.price,
    imageUrl: product.images?.find(i => i.isPrimary)?.imageUrl
              ?? product.images?.[0]?.imageUrl
              ?? product.primaryImageUrl
              ?? product.imageUrl
              ?? '',
  }
  const stored  = getRecentlyViewed()
  const updated = [entry, ...stored.filter(p => p.id !== id)].slice(0, MAX)
  try { 
    localStorage.setItem(KEY, JSON.stringify(updated)) 
  } catch (e) {
    console.error('Failed to save recently viewed', e)
  }
}

export function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}
