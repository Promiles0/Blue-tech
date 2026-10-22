// Pre-built pages (round 4, 4d). After `vite build`, writes a real HTML page for every product,
// category, the product list and About: its own title, description, link-preview tags
// (WhatsApp/Facebook show the photo and price), Google structured data, and readable content.
// Visitors still get the live app — React replaces this content as soon as it starts.
// If the API can't be reached the build carries on without these pages (never fails a deploy).
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadEnv } from 'vite'
import { canonicalPath } from '../src/lib/prebuilt.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const env = loadEnv('production', ROOT, '')
const SITE = (env.VITE_SITE_URL || 'https://blue-tech.onrender.com').replace(/\/$/, '')
const API = (env.VITE_SUPABASE_FUNCTIONS_URL || '').replace(/\/$/, '')

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c')
const rwf = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} RWF`
const slugOf = (c) => c.slug ?? String(c.name ?? '').toLowerCase().replace(/\s+/g, '-')
const titleCase = (name) => String(name).trim().split(/\s+/).map((w) => (/\d/.test(w) || (w.length <= 3 && w === w.toUpperCase()) ? w : w[0].toUpperCase() + w.slice(1).toLowerCase())).join(' ')

async function getJson(url) {
  const res = await fetch(url, { headers: { Origin: SITE }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return (await res.json()).data
}

// Fill the built index.html with one page's head tags and content.
function page(template, { title, description, url, image, type = 'website', jsonLd = [], body }) {
  const head = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="Blue-Tech" />`,
    image ? `<meta property="og:image" content="${esc(image)}" />` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    ...jsonLd.map((o) => `<script type="application/ld+json">${json(o)}</script>`),
  ].filter(Boolean).join('\n    ')
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><main style="max-width:980px;margin:0 auto;padding:32px 20px;font-family:system-ui,sans-serif;line-height:1.55">${body}</main></div>`)
}

function write(route, html) {
  const dir = path.join(DIST, ...route.split('/').filter(Boolean).map(decodeURIComponent))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
}

const crumbs = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE + canonicalPath(it.path) })),
})
const nav = (items) => `<nav style="font-size:14px;margin-bottom:12px">${items.map((it) => `<a href="${esc(canonicalPath(it.path))}">${esc(it.name)}</a>`).join(' › ')}</nav>`

try {
  if (!API) throw new Error('VITE_SUPABASE_FUNCTIONS_URL is not set')
  const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
  const [categories, settings] = await Promise.all([getJson(`${API}/categories`), getJson(`${API}/settings`)])
  const products = []
  for (let p = 0, total = 1; p < total && p < 50; p++) {
    const d = await getJson(`${API}/products?page=${p}&size=100`)
    total = d.totalPages ?? 1
    products.push(...(d.content ?? []).filter((x) => x.isActive !== false))
  }
  const catSlug = new Map((categories ?? []).map((c) => [c.categoryId ?? c.id, slugOf(c)]))
  const business = settings?.businessInfo ?? {}

  // Products.
  for (const p of products) {
    const id = p.productId ?? p.id
    const name = titleCase(p.name)
    const stock = (p.variants ?? []).reduce((s, v) => s + (Number(v.stockQuantity) || 0), 0)
    const image = p.primaryImageUrl ?? p.imageUrl ?? (p.images ?? [])[0]?.imageUrl
    const desc = String(p.shortDescription || p.description || `${name} at Blue-Tech Kigali.`).replace(/\s+/g, ' ').trim()
    const specs = Object.entries(p.specs ?? {}).filter(([, v]) => v !== null && v !== '').slice(0, 12)
    const cat = p.categoryName ? [{ name: p.categoryName, path: `/category/${catSlug.get(p.categoryId) ?? slugOf({ name: p.categoryName })}` }] : []
    const trail = [{ name: 'Home', path: '/' }, ...cat, { name, path: `/products/${id}` }]
    const url = `${SITE}${canonicalPath(`/products/${id}`)}`
    write(`/products/${id}`, page(template, {
      title: `${name} — ${rwf(p.price)} | Blue-Tech`,
      description: `${desc.slice(0, 150)} ${rwf(p.price)}, delivered across Rwanda.`.trim(),
      url, image, type: 'product',
      jsonLd: [{
        '@context': 'https://schema.org', '@type': 'Product', name, url, image: (p.images ?? []).map((i) => i.imageUrl).filter(Boolean).slice(0, 6),
        description: desc.slice(0, 500), sku: p.variants?.[0]?.skuCode || undefined, mpn: p.modelNumber || undefined,
        brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined, category: p.categoryName || undefined,
        offers: { '@type': 'Offer', url, priceCurrency: 'RWF', price: Number(p.price) || 0, ...(p.campaign?.endsAt ? { priceValidUntil: String(p.campaign.endsAt).slice(0, 10) } : {}), availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', seller: { '@type': 'Organization', name: 'Blue-Tech' } },
      }, crumbs(trail)],
      body: `${nav(trail)}<h1>${esc(name)}</h1>
        ${image ? `<img src="${esc(p.thumbUrl ?? image)}" alt="${esc(name)}" width="300" height="300" style="object-fit:contain;max-width:100%;height:auto" />` : ''}
        <p><strong>${rwf(p.price)}</strong> · ${stock > 0 ? 'In stock' : 'Out of stock'}${p.warranty ? ` · ${esc(p.warranty)} warranty` : ''}${p.brand ? ` · ${esc(p.brand)}` : ''}</p>
        <p>${esc(desc)}</p>
        ${specs.length ? `<ul>${specs.map(([k, v]) => `<li>${esc(k.replace(/_/g, ' '))}: ${esc(v)}</li>`).join('')}</ul>` : ''}
        <p>Free standard delivery across Rwanda · 30-day returns · Pay with MTN MoMo, Airtel Money or card</p>
        <p><a href="/products/">All products</a> · <a href="/about/">About Blue-Tech</a></p>`,
    }))
  }

  // Categories.
  for (const c of categories ?? []) {
    const slug = slugOf(c)
    const items = products.filter((p) => (p.categoryId ?? null) === (c.categoryId ?? c.id))
    const trail = [{ name: 'Home', path: '/' }, { name: c.name, path: `/category/${slug}` }]
    write(`/category/${slug}`, page(template, {
      title: `${c.name} in Rwanda — prices and delivery | Blue-Tech`,
      description: `Buy ${String(c.name).toLowerCase()} at Blue-Tech Kigali: ${items.length} products, prices in RWF, warranty on every product, delivery across Rwanda.`,
      url: `${SITE}${canonicalPath(`/category/${encodeURIComponent(slug)}`)}`, image: items[0]?.primaryImageUrl ?? items[0]?.imageUrl,
      jsonLd: [crumbs(trail)],
      body: `${nav(trail)}<h1>${esc(c.name)}</h1><ul>${items.map((p) => `<li><a href="${canonicalPath(`/products/${p.productId ?? p.id}`)}">${esc(titleCase(p.name))}</a> — ${rwf(p.price)}</li>`).join('')}</ul>`,
    }))
  }

  // All products.
  write('/products', page(template, {
    title: 'Shop laptops, printers, monitors and more in Rwanda | Blue-Tech',
    description: 'Every product at Blue-Tech Kigali: laptops, desktops, printers, monitors, networking and accessories, with prices in RWF and delivery across Rwanda.',
    url: `${SITE}${canonicalPath('/products')}`,
    body: `<h1>All products</h1><ul>${products.map((p) => `<li><a href="${canonicalPath(`/products/${p.productId ?? p.id}`)}">${esc(titleCase(p.name))}</a> — ${rwf(p.price)}</li>`).join('')}</ul>`,
  }))

  // About.
  write('/about', page(template, {
    title: 'About Blue-Tech — electronics shop in Kigali, Rwanda',
    description: `Blue-Tech, ${business.address || 'Kigali'}. Laptops, computers, printers and interactive screens with warranty, delivered across Rwanda.`,
    url: `${SITE}${canonicalPath('/about')}`,
    body: `<h1>About Blue-Tech</h1><p>${esc(settings?.aboutPage?.story || 'Blue-Tech is an electronics shop in Kigali, delivering across Rwanda.')}</p>
      <p>${esc(business.address || '')}${settings?.aboutPage?.hours ? ` · ${esc(settings.aboutPage.hours)}` : ''}</p>
      <p>${esc(business.phone || '')} · ${esc(business.email || '')}</p>`,
  }))

  console.log(`✓ prerender: ${products.length} products, ${(categories ?? []).length} categories, product list, About`)
} catch (error) {
  console.warn(`⚠ prerender skipped: ${error.message}`)
}
