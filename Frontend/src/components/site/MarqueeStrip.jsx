import { useReducedMotion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import apiService from '../../api/service'

// Messages are edited in Admin → Settings → Announcement bar. Used only if the API
// can't be reached, so the strip never shows a claim the admin has removed.
const FALLBACK_ITEMS = ['Free standard delivery', 'Secure checkout · SSL encrypted']

export default function MarqueeStrip() {
  const reduce  = useReducedMotion()
  const { data: items, isError } = useQuery({
    queryKey: ['site-settings', 'announcements'],
    queryFn: async () => {
      const { data } = await apiService.settings.get()
      return Array.isArray(data?.announcements) ? data.announcements : FALLBACK_ITEMS
    },
    staleTime: 1000 * 60 * 5,
  })
  const shown = items ?? (isError ? FALLBACK_ITEMS : [])
  // The admin emptied the list: hide the bar entirely.
  if (items && items.length === 0) return null
  // While loading, keep the bar's height so the page doesn't jump when text arrives.
  const tripled = [...shown, ...shown, ...shown]

  return (
    <div
      className="marquee"
      style={{
        background: 'var(--accent)',
        color: 'rgba(255,255,255,0.9)',
        overflow: 'hidden',
        padding: '11px 0',
        flexShrink: 0,
      }}
    >
      <div
        className={reduce ? undefined : 'marquee-track'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          whiteSpace: 'nowrap',
          minWidth: 'max-content',
          minHeight: 16,
        }}
      >
        {tripled.map((msg, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: '"Space Grotesk",sans-serif',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.5)',
              }}
            />
            {msg}
          </span>
        ))}
      </div>
    </div>
  )
}
