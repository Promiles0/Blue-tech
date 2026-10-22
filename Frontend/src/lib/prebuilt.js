// Pages that scripts/prerender.mjs writes as <path>/index.html. Render serves those files only
// at the address with a trailing slash (/products/30/); without it the app's catch-all answers.
// So canonical links, previews and the sitemap point Google at the slash form.
// Shared by usePageMeta, prerender.mjs and generate-sitemap.mjs.
const PREBUILT = /^\/(products(\/\d+)?|category\/[^/]+|about)$/

export function canonicalPath(path) {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path
  return PREBUILT.test(clean) ? `${clean}/` : clean
}
