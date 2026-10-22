import { useQuery } from '@tanstack/react-query'
import { Copy, Share2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useCurrency } from '../../context/CurrencyContext'
import { useT } from '../../lib/i18n'
import { usePrograms } from '../../lib/programs'

// Account page: "Invite friends" (6d). Shown only while the program is on.
export default function InviteFriendsCard() {
  const { t, intlLocale } = useT()
  const { formatPrice } = useCurrency()
  const programs = usePrograms()
  const on = Boolean(programs?.referral?.enabled)
  const { data } = useQuery({
    queryKey: ['my-referral'],
    queryFn: () => apiService.rewards.referral().then((r) => r.data),
    enabled: on,
    staleTime: 60_000,
  })
  if (!on || !data?.enabled) return null

  const message = t('Join me at Blue-Tech: get {amount} off your first order over {min} with my link', { amount: formatPrice(data.friendDiscount), min: formatPrice(data.minOrder) })
  const copy = async () => {
    try { await navigator.clipboard.writeText(data.link); toast.success(t('Link copied')) } catch { toast.error(t('Could not copy — select the link and copy it')) }
  }
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Blue-Tech', text: message, url: data.link }) } catch { /* closed */ } }
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${data.link}`)}`, '_blank', 'noopener')
  }
  const day = (iso) => { try { return new Date(iso).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '' } }
  const liveRewards = (data.rewards ?? []).filter((r) => !r.used && !r.expired)

  return (
    <div style={{ borderRadius: 16, padding: 20, border: '1px solid var(--glass-border, var(--border))', background: 'var(--glass-bg, var(--surface))', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-dim)', color: 'var(--accent-light, var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserPlus size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{t('Invite friends')}</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 12px', lineHeight: 1.55 }}>
            {t('Your friend gets {amount} off their first order over {min}. When it is paid, you get {reward} off your next order.', { amount: formatPrice(data.friendDiscount), min: formatPrice(data.minOrder), reward: formatPrice(data.reward) })}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <code style={{ flex: '1 1 220px', minWidth: 0, padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.link}</code>
            <button type="button" onClick={copy} className="noir-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px' }}><Copy size={14} /> {t('Copy')}</button>
            <button type="button" onClick={share} className="noir-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px' }}><Share2 size={14} /> {t('Share')}</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted-dark, var(--muted))', margin: '10px 0 0' }}>
            {t('Your code: {code}', { code: data.code })} · {t('{n} friend(s) joined, {m} reward(s) earned', { n: data.invited, m: data.rewarded })}
          </p>
          {liveRewards.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {liveRewards.map((r) => (
                <div key={r.code} style={{ fontSize: 13, padding: '8px 12px', borderRadius: 9, background: 'var(--accent-dim)', color: 'var(--text)' }}>
                  {t('{amount} off with code {code}, until {date}', { amount: formatPrice(r.value), code: r.code, date: day(r.endsAt) })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
