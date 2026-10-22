export const PRODUCT_IMAGE_FALLBACK = '/assets/no-image.svg'

function imageUrl(image) {
  return image?.imageUrl ?? image?.image_url ?? ''
}

function cleanUrl(url) {
  if (typeof url !== 'string') return ''
  const trimmed = url.trim()
  const malformedUpload = trimmed.match(/^\/uploads\/products\/(https?:\/\/.+)/)
  return malformedUpload ? malformedUpload[1] : trimmed
}

export function getProductImage(product, index = 0) {
  if (!product) return PRODUCT_IMAGE_FALLBACK

  const primaryUrl = cleanUrl(
    product.imageUrl ??
    product.image_url ??
    product.productImageUrl ??
    product.primaryImageUrl
  )
  if (index === 0 && primaryUrl) return primaryUrl

  const images = Array.isArray(product.images) ? product.images : []
  const primary = images.find(image => image.isPrimary || image.is_primary)
  const selected = index === 0 ? primary ?? images[0] : images[index]
  return cleanUrl(imageUrl(selected)) || PRODUCT_IMAGE_FALLBACK
}

// The small (600px WebP) copy for cards, lists, cart and search; the full photo when a
// product has no small copy yet. Product pages use productImageList() for full quality.
export function getProductThumb(product) {
  if (!product) return PRODUCT_IMAGE_FALLBACK
  const images = Array.isArray(product.images) ? product.images : []
  const primary = images.find(image => image.isPrimary || image.is_primary) ?? images[0]
  const thumb = cleanUrl(product.thumbUrl ?? product.thumb_url ?? primary?.thumbUrl ?? primary?.thumb_url ?? '')
  return thumb || getProductImage(product)
}

export function productImageList(product) {
  if (!product) return [PRODUCT_IMAGE_FALLBACK]
  const images = Array.isArray(product.images)
    ? product.images.map(image => cleanUrl(imageUrl(image))).filter(Boolean)
    : []
  const first = getProductImage(product)
  return images.length ? [first, ...images.filter(url => url !== first)] : [first]
}

export function handleProductImageError(event) {
  if (event.currentTarget.src.endsWith(PRODUCT_IMAGE_FALLBACK)) return
  event.currentTarget.src = PRODUCT_IMAGE_FALLBACK
}
