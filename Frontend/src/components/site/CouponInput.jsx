import { useState } from 'react'
import { Tag, X, Loader2 } from 'lucide-react'
import api from '../../api/axios'

export default function CouponInput({ onApply, onRemove, applied, compact }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    if (!code.trim()) return
    setError('')
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/coupons/validate?code=${encodeURIComponent(code.trim())}`)
      const coupon = data.data ?? data
      onApply(coupon)
      setCode('')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid or expired coupon.')
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: compact ? '0' : '10px 14px', borderRadius: 10,
        background: compact ? 'transparent' : 'var(--accent-dim)',
        border: compact ? 'none' : '1px solid var(--accent-glow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag size={13} color="var(--accent-light)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)', letterSpacing: '0.05em' }}>
            {applied.code}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            — {applied.kind === 'PERCENT' ? `${applied.value}% off` : `$${parseFloat(applied.value).toFixed(2)} off`}
            {applied.minSubtotal ? ` (min $${parseFloat(applied.minSubtotal).toFixed(2)})` : ''}
          </span>
        </div>
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', color: 'var(--muted-dark)', display: 'flex', padding: 6, cursor: 'pointer', transition: 'color 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  const isActive = !!code.trim() && !loading

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!compact ? (
          <div style={{ position: 'relative', flex: 1 }}>
            <Tag size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-dark)', pointerEvents: 'none' }} />
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleApply()}
              placeholder="COUPON CODE"
              className="noir-input"
              style={{ paddingLeft: 34, letterSpacing: '0.08em', fontSize: 13 }}
            />
          </div>
        ) : (
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="Coupon code"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: 13, letterSpacing: '0.06em',
              fontFamily: 'inherit', padding: 0,
            }}
          />
        )}

        <button
          onClick={handleApply}
          disabled={!isActive}
          style={(() => {
            if (compact) {
              return {
                padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#fff' : 'var(--muted)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                cursor: isActive ? 'pointer' : 'default',
                transition: 'all 0.16s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
              }
            }
            return {
              padding: '0 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: 'var(--accent)', color: '#fff', border: 'none', cursor: isActive ? 'pointer' : 'default',
              opacity: isActive ? 1 : 0.5,
              transition: 'opacity 0.16s, background 0.16s', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }
          })()}
          onMouseEnter={e => { if (isActive) e.currentTarget.style.background = compact ? '#6b4fd8' : 'var(--accent-hover)' }}
          onMouseLeave={e => { if (isActive) e.currentTarget.style.background = 'var(--accent)' }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
