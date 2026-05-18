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
        background: compact ? 'transparent' : 'rgba(124,92,240,0.1)',
        border: compact ? 'none' : '1px solid rgba(124,92,240,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag size={13} color="#a78bfa" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', letterSpacing: '0.05em' }}>
            {applied.code}
          </span>
          <span style={{ fontSize: 12, color: '#888' }}>
            — {applied.kind === 'PERCENT' ? `${applied.value}% off` : `$${parseFloat(applied.value).toFixed(2)} off`}
            {applied.minSubtotal ? ` (min $${parseFloat(applied.minSubtotal).toFixed(2)})` : ''}
          </span>
        </div>
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', color: '#555', display: 'flex', padding: 2, cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = '#555'}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          style={{
            padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: code.trim() ? '#7c5cf0' : 'transparent',
            color: code.trim() ? '#fff' : '#444',
            border: `1px solid ${code.trim() ? '#7c5cf0' : '#2a2a2a'}`,
            cursor: loading || !code.trim() ? 'default' : 'pointer',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
          onMouseEnter={e => { if (code.trim() && !loading) e.currentTarget.style.background = '#6b4fd8' }}
          onMouseLeave={e => { if (code.trim()) e.currentTarget.style.background = '#7c5cf0' }}
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{error}</p>}
    </div>
  )
}
