import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Gift, GraduationCap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useCurrency } from '../../context/CurrencyContext'
import { useT } from '../../lib/i18n'
import { usePrograms, useRewards } from '../../lib/programs'

// Account page: points balance (loyalty) and student discount status/request.
export default function RewardsCard() {
  const { t } = useT()
  const { formatPrice } = useCurrency()
  const programs = usePrograms()
  const loyaltyOn = programs?.loyalty?.enabled
  const studentOn = programs?.student?.enabled
  const { data } = useRewards(Boolean(loyaltyOn || studentOn))
  const qc = useQueryClient()
  const [school, setSchool] = useState('')
  const [schoolEmail, setSchoolEmail] = useState('')
  const [busy, setBusy] = useState(false)
  if (!loyaltyOn && !studentOn) return null

  const requestStudent = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await apiService.rewards.studentRequest({ school, schoolEmail })
      toast.success(t('Request sent — we will review it shortly.'))
      qc.invalidateQueries({ queryKey: ['my-rewards'] })
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t('Something went wrong. Please try again.'))
    } finally { setBusy(false) }
  }

  const box = { borderRadius: 16, padding: 20, border: '1px solid var(--glass-border, var(--border))', background: 'var(--glass-bg, var(--surface))', marginBottom: 20 }
  return (
    <div style={box}>
      {loyaltyOn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: studentOn ? 18 : 0 }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-dim)', color: 'var(--accent-light, var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Gift size={20} /></span>
          <div>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('Blue-Tech points')}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              {data?.points ?? '—'} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>{data ? `≈ ${formatPrice((data.points ?? 0) * programs.loyalty.pointValue)}` : ''}</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted-dark)' }}>{t('Earn {n} point(s) per 1,000 RWF spent. Use them at checkout.', { n: programs.loyalty.pointsPer1000 })}</p>
          </div>
        </div>
      )}
      {studentOn && (
        <div style={{ borderTop: loyaltyOn ? '1px solid var(--border)' : 'none', paddingTop: loyaltyOn ? 16 : 0 }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}><GraduationCap size={17} /> {t('Student discount — {p}% off', { p: programs.student.percent })}</p>
          {data?.studentActive ? (
            <p style={{ fontSize: 13, color: 'var(--success, #22c55e)' }}>{t('Active until {date} — applied automatically at checkout.', { date: data.studentVerifiedUntil })}</p>
          ) : data?.studentRequest?.status === 'new' ? (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('Your request is being reviewed.')}</p>
          ) : (
            <form onSubmit={requestStudent} style={{ display: 'grid', gap: 8 }}>
              {data?.studentRequest?.status === 'declined' && <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t('Your last request was not approved. You can try again with your school email.')}</p>}
              <input className="noir-input" required value={school} onChange={e => setSchool(e.target.value)} placeholder={t('School or university')} />
              <input className="noir-input" required type="email" value={schoolEmail} onChange={e => setSchoolEmail(e.target.value)} placeholder={t('Your school email')} />
              <button type="submit" disabled={busy} className="noir-btn-outline" style={{ padding: 10, fontSize: 13.5 }}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : t('Apply for the student discount')}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
