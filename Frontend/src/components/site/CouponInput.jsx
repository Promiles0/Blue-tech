import { useState } from 'react'
import { Tag, X, Loader2 } from 'lucide-react'
import api from '../../api/axios'

export default function CouponInput({ onApply, onRemove, applied }) {
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
        padding: '10px 14px', borderRadius: 10,
        background: 'rgba(124,92,240,0.1)', border: '1px solid rgba(124,92,240,0.25)',
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
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Tag size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="COUPON CODE"
            className="noir-input"
            style={{ paddingLeft: 34, letterSpacing: '0.08em', fontSize: 13 }}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          style={{
            padding: '0 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: '#7c5cf0', color: '#fff', border: 'none', cursor: 'pointer',
            opacity: loading || !code.trim() ? 0.5 : 1,
            transition: 'opacity 0.2s, background 0.2s',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#6b4fd8' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#7c5cf0' }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
