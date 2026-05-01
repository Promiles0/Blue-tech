import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Check } from 'lucide-react'
import { Magnetic } from '../../lib/motion'

export default function NewsletterBand() {
  const [email,      setEmail]      = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading,    setLoading]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    setSubscribed(true)
    setLoading(false)
    toast.success("You're on the list!")
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#22c55e', fontSize: 16, fontWeight: 600 }}>
            <Check size={20} /> You're on the list!
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
