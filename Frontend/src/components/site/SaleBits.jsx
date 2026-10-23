import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Timer, X } from 'lucide-react'
import apiService from '../../api/service'
import { useT } from '../../lib/i18n'

// Sale campaigns (6b): the site-wide strip and the countdown on product pages.

function useActiveCampaigns() {
  return useQuery({
    queryKey: ['campaigns-active'],
    queryFn: () => apiService.campaigns.active().then((r) => r.data ?? []),
    staleTime: 5 * 60_000,
  })
}

// "2d 4h", "4h 12m", "12m 30s": short enough for a badge.
function timeLeft(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s % 60}s`
}

function useNow(every = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), every); return () => clearInterval(id) }, [every])
  return now
}

export function SaleCountdown({ endsAt }) {
  const { t } = useT()
  const now = useNow()
  const left = new Date(endsAt).getTime() - now
  if (!endsAt || left <= 0) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--danger, #ef4444)' }}>
      <Timer size={13} /> {t('Ends in {time}', { time: '#' }).split('#').map((part, i) => i === 0 ? part : <span key={i}><span key={timeLeft(left)} className="tick">{timeLeft(left)}</span>{part}</span>)}
    </span>
  )
}

const DISMISS_KEY = 'bt_sale_banner_dismissed'

export function CampaignBanner() {
  const { t } = useT()
  const { data: campaigns = [] } = useActiveCampaigns()
  const [dismissed, setDismissed] = useState(() => { try { return sessionStorage.getItem(DISMISS_KEY) ?? '' } catch { return '' } })
  const now = useNow(30_000)
  const campaign = campaigns.find((c) => new Date(c.endsAt).getTime() > now)
  if (!campaign || dismissed === campaign.slug) return null
  const close = () => { setDismissed(campaign.slug); try { sessionStorage.setItem(DISMISS_KEY, campaign.slug) } catch { /* private mode */ } }
  return (
    <div style={{ background: 'var(--danger, #ef4444)', color: '#fff', fontSize: 13.5, fontWeight: 600 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '9px 44px 9px 16px', position: 'relative', textAlign: 'center' }}>
        <Link to={`/sale/${campaign.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>
          {campaign.bannerText || campaign.name}
          <span style={{ marginLeft: 10, textDecoration: 'underline', whiteSpace: 'nowrap' }}>{t('Shop the sale')} →</span>
        </Link>
        <button type="button" onClick={close} aria-label={t('Close')}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
