// Fails if any `apiService.x.y()` call in src/ doesn't exist in src/api/service.js.
// A missing method only breaks at runtime — once it blanked the whole site — so this runs
// before every build (see "prebuild" in package.json).
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL, fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')

// Load service.js with its axios import replaced by a stub, so it runs in plain Node.
const service = fs.readFileSync(path.join(SRC, 'api', 'service.js'), 'utf8')
  .replace(/^import api from ['"]\.\/axios['"];?/m, 'const api = { get(){}, post(){}, put(){}, patch(){}, delete(){} };')
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'api-check-')), 'service.mjs')
fs.writeFileSync(tmp, service)
const api = (await import(pathToFileURL(tmp).href)).default

const files = []
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : /\.(jsx?|mjs)$/.test(e.name) && files.push(path.join(d, e.name)))
walk(SRC)

const missing = []
for (const f of files) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/apiService((?:\.[A-Za-z_]\w*)+)\s*\(/g)) {
    let cur = api
    for (const p of m[1].slice(1).split('.')) cur = cur?.[p]
    if (typeof cur !== 'function') missing.push(`${path.relative(ROOT, f)}: apiService${m[1]}()`)
  }
}

if (missing.length) {
  console.error(`✖ ${missing.length} apiService call(s) don't exist in src/api/service.js:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}
console.log(`✓ all apiService calls resolve (${files.length} files)`)
