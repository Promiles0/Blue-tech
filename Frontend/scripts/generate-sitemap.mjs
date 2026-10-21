// Writes public/sitemap.xml before every build: the home page, main pages, every category
// and every live product, so Google can find them all. Runs as part of "prebuild".
// If the API can't be reached, it keeps the static pages and warns instead of failing the
// build — a deploy must never break because of the sitemap.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadEnv } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = loadEnv('production', ROOT, '')
const SITE = (env.VITE_SITE_URL || 'https://blue-tech.onrender.com').replace(/\/$/, '')
const API = (env.VITE_SUPABASE_FUNCTIONS_URL || '').replace(/\/$/, '')
const OUT = path.join(ROOT, 'public', 'sitemap.xml')

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/products', priority: '0.9', changefreq: 'daily' },
  { loc: '/interactive-screens', priority: '0.8', changefreq: 'weekly' },
  { loc: '/help', priority: '0.4', changefreq: 'monthly' },
]

async function getJson(url) {
  const res = await fetch(url, { headers: { Origin: SITE }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return (await res.json()).data
}

// Same slug rule as pages/CategoryPage.jsx.
const slugOf = (c) => c.slug ?? String(c.name ?? '').toLowerCase().replace(/\s+/g, '-')

try {
  if (!API) throw new Error('VITE_SUPABASE_FUNCTIONS_URL is not set')
  const categories = await getJson(`${API}/categories`)
  for (const c of categories ?? []) urls.push({ loc: `/category/${encodeURIComponent(slugOf(c))}`, priority: '0.8', changefreq: 'weekly' })

  for (let page = 0, total = 1; page < total && page < 50; page++) {
    const data = await getJson(`${API}/products?page=${page}&size=100`)
    total = data.totalPages ?? 1
    for (const p of data.content ?? []) {
      if (p.isActive === false) continue
      urls.push({ loc: `/products/${p.productId}`, priority: '0.7', changefreq: 'weekly', lastmod: String(p.updated_at ?? p.updatedAt ?? '').slice(0, 10) || undefined })
    }
  }
} catch (error) {
  console.warn(`⚠ sitemap: couldn't load products (${error.message}); writing main pages only`)
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u.loc.replace(/&/g, '&amp;')}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`
fs.writeFileSync(OUT, xml)
console.log(`✓ sitemap: ${urls.length} pages`)
