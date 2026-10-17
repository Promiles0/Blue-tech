import { Truck, ShieldCheck, Wrench, Mail } from 'lucide-react'
import { Reveal } from '../../lib/motion'

// Only promises the store already makes elsewhere (delivery policy, warranty, the FAQ's
// in-the-box mount hardware, the quote confirmation email). Add installation or training
// here once those are services Blue-Tech actually offers.
const ITEMS = [
  { Icon: Truck,       title: 'Delivered across Rwanda', text: 'Free standard delivery, with express options for urgent rollouts.' },
  { Icon: Wrench,      title: 'Mount included',          text: 'Every unit ships with a stand or wall-mount hardware, a remote and a stylus.' },
  { Icon: ShieldCheck, title: 'Warranty on every unit',  text: 'Each model lists its warranty on the product page, with local support.' },
  { Icon: Mail,        title: 'Quotes by email',          text: 'Send a request and get pricing for one room or a whole school.' },
]

export default function InteractiveScreensServices() {
  return (
    <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '36px 0' }}>
      <div className="container-noir">
        <div className="grid-4" style={{ gap: 24 }}>
          {ITEMS.map(({ Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.05}>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--accent-dim)', color: 'var(--accent-light, var(--accent))',
                }}><Icon size={18} /></span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
