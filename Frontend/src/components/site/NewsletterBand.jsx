// v2
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import apiService from '../../api/service'
import { Magnetic } from '../../lib/motion'

export default function NewsletterBand() {
  const [email,      setEmail]      = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading,    setLoading]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) return
    setLoading(true)
    try {
      await apiService.newsletter.subscribe(email)
      setSubscribed(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ padding: '80px 0', borderTop: '1px solid #141414' }}>
      <div className="container-noir" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#7c5cf0', marginBottom: 12 }}>
          STAY IN THE LOOP
        </p>
        <h2 style={{
          fontFamily: '"Space Grotesk",sans-serif',
          fontSize: 'clamp(26px, 4vw, 40px)',
          fontWeight: 800, letterSpacing: '-0.02em',
          marginBottom: 12, lineHeight: 1.15,
        }}>
          The quieter kind of newsletter
        </h2>
        <p style={{ color: '#888', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
          New arrivals, behind-the-scenes, and occasional notes on craft. Infrequent by design.
        </p>

        {subscribed ? (
          <div style={{
            background: 'rgba(124,92,240,0.06)',
            border: '1px solid rgba(124,92,240,0.2)',
            borderRadius: 14,
            padding: '28px 32px',
            maxWidth: 400,
            margin: '0 auto',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(124,92,240,0.15)',
              border: '1px solid rgba(124,92,240,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 20,
            }}>
              ✓
            </div>
            <p style={{
              fontFamily: '"Space Grotesk",sans-serif',
              fontSize: 17, fontWeight: 700,
              color: '#fff', marginBottom: 8,
            }}>
              Subscription confirmed
            </p>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              Thank you for subscribing. You'll hear from us when it matters.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="noir-input"
              style={{ flex: 1, height: 48 }}
            />
            <Magnetic strength={0.2}>
              <button
                type="submit"
                disabled={loading}
                className="noir-btn-primary shine"
                style={{ height: 48, padding: '0 22px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {loading ? '…' : <><span>Subscribe</span> <ArrowRight size={14} /></>}
              </button>
            </Magnetic>
          </form>
        )}
      </div>
    </section>
  )
}
