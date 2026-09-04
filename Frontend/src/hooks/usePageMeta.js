import { useEffect } from 'react'

// Minimal, dependency-free per-page <title>/meta/OG tags — no react-helmet, since this is
// (for now) the only route that needs page-specific SEO tags at all. Matches App.jsx's own
// lightweight useEffect-driven DOM-manipulation style rather than pulling in a library for
// one page. Restores whatever was there before on unmount — important precisely because
// no other route resets these, so without cleanup a stale <title>/meta would linger over
// whatever page loads next.
export function usePageMeta({ title, description, ogImage } = {}) {
  useEffect(() => {
    const prevTitle = document.title
    if (title) document.title = title

    const restores = []
    function upsertMeta(selector, attrs, content) {
      let el = document.querySelector(selector)
      const created = !el
      const prevContent = created ? null : el.getAttribute('content')
      if (created) {
        el = document.createElement('meta')
        Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value))
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
      restores.push({ el, created, prevContent })
    }

    if (description) upsertMeta('meta[name="description"]', { name: 'description' }, description)
    if (title) upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title)
    if (description) upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description)
    if (ogImage) upsertMeta('meta[property="og:image"]', { property: 'og:image' }, ogImage)

    return () => {
      document.title = prevTitle
      restores.forEach(({ el, created, prevContent }) => {
        if (created) el.remove()
        else if (prevContent != null) el.setAttribute('content', prevContent)
        else el.removeAttribute('content')
      })
    }
  }, [title, description, ogImage])
}
