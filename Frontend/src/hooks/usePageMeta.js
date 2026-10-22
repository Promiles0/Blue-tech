import { useEffect } from 'react'

// The public address of the shop, used for canonical links, sitemaps and structured data.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://blue-tech.onrender.com').replace(/\/$/, '')

// Minimal, dependency-free per-page SEO tags: <title>, description, canonical link, Open
// Graph/Twitter preview tags, robots, and JSON-LD structured data (Google rich results).
// Restores whatever was there before on unmount, so a page's tags never linger over the next.
//
//   usePageMeta({ title, description, ogImage, path, ogType, robots, jsonLd })
//   path:   canonical path, e.g. `/products/12` (defaults to the current path, without query)
//   jsonLd: an object or array of schema.org objects
export function usePageMeta({ title, description, ogImage, path, ogType, robots, jsonLd } = {}) {
  const jsonText = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const prevTitle = document.title
    if (title) document.title = title

    const restores = []
    function upsert(tag, selector, attrs, valueAttr, value) {
      let el = document.head.querySelector(selector)
      const created = !el
      const prev = created ? null : el.getAttribute(valueAttr)
      if (created) {
        el = document.createElement(tag)
        Object.entries(attrs).forEach(([key, v]) => el.setAttribute(key, v))
        document.head.appendChild(el)
      }
      el.setAttribute(valueAttr, value)
      restores.push(() => {
        if (created) el.remove()
        else if (prev != null) el.setAttribute(valueAttr, prev)
        else el.removeAttribute(valueAttr)
      })
    }
    const meta = (key, attr, value) => value && upsert('meta', `meta[${attr}="${key}"]`, { [attr]: key }, 'content', value)

    const canonical = SITE_URL + (path ?? window.location.pathname)
    upsert('link', 'link[rel="canonical"]', { rel: 'canonical' }, 'href', canonical)
    meta('og:url', 'property', canonical)
    meta('description', 'name', description)
    meta('og:title', 'property', title)
    meta('og:description', 'property', description)
    meta('og:image', 'property', ogImage)
    meta('og:type', 'property', ogType || 'website')
    meta('twitter:card', 'name', ogImage ? 'summary_large_image' : 'summary')
    meta('robots', 'name', robots)

    let script = null
    if (jsonText) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.pageMeta = 'true'
      script.textContent = jsonText
      document.head.appendChild(script)
    }

    return () => {
      document.title = prevTitle
      restores.reverse().forEach((restore) => restore())
      script?.remove()
    }
  }, [title, description, ogImage, path, ogType, robots, jsonText])
}

// The shop as a business, for the home page's structured data.
export function storeJsonLd(info = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    name: 'Blue-Tech',
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    image: `${SITE_URL}/icon-512.png`,
    description: 'Laptops, computers, printers and interactive screens — delivered across Rwanda.',
    telephone: info.phone || '+250 788 304 366',
    email: info.email || 'bluetech2020@gmail.com',
    priceRange: 'RWF',
    currenciesAccepted: 'RWF',
    paymentAccepted: 'MTN Mobile Money, Airtel Money, Card',
    address: {
      '@type': 'PostalAddress',
      streetAddress: info.address || 'KN59, ST 38, near Gloria Hotel',
      addressLocality: 'Kigali',
      addressCountry: 'RW',
    },
    areaServed: { '@type': 'Country', name: 'Rwanda' },
  }
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem', position: i + 1, name: item.name, item: SITE_URL + item.path,
    })),
  }
}

const CONDITION = { new: 'NewCondition', refurbished: 'RefurbishedCondition', used: 'UsedCondition' }

// A product page's schema.org Product, with price, stock and rating for Google results.
export function productJsonLd(product, { reviews = [], categoryPath } = {}) {
  const images = [product.primaryImageUrl, ...(product.images ?? []).map((i) => i.imageUrl)].filter(Boolean)
  const stock = (product.variants ?? []).reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0)
  const rated = reviews.filter((r) => r.rating)
  const url = `${SITE_URL}/products/${product.productId ?? product.id}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url,
    image: [...new Set(images)].slice(0, 6),
    description: (product.shortDescription || product.description || product.name || '').slice(0, 500),
    sku: product.variants?.[0]?.skuCode || undefined,
    mpn: product.modelNumber || undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    category: product.categoryName || undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'RWF',
      price: Number(product.price) || 0,
      ...(product.campaign?.endsAt ? { priceValidUntil: String(product.campaign.endsAt).slice(0, 10) } : {}),
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: `https://schema.org/${CONDITION[String(product.condition ?? 'new').toLowerCase()] ?? 'NewCondition'}`,
      seller: { '@type': 'Organization', name: 'Blue-Tech' },
    },
    ...(rated.length ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: (rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1),
        reviewCount: rated.length,
      },
    } : {}),
    ...(categoryPath ? {} : {}),
  }
}
