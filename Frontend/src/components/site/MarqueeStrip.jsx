import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Truck, ShieldCheck, RotateCcw, Smartphone } from 'lucide-react'
import { useT } from '../../lib/i18n'

const ITEMS = [
  { icon: Truck,       text: 'Free delivery across Rwanda' },
  { icon: ShieldCheck, text: 'Warranty on every product' },
  { icon: RotateCcw,   text: 'Free returns within 30 days' },
  { icon: Smartphone,  text: 'Pay with MoMo or card' },
]

// The store's promises in one calm bar under the header. It used to scroll forever; now the
// items sit still on wide screens and phones show one at a time (UX audit B9/D1).
export default function MarqueeStrip() {
  const { t } = useT()
  const reduce = useReducedMotion()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setCurrent(i => (i + 1) % ITEMS.length), 4000)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div className="trust-bar" role="note" aria-label={t('Why shop with Blue-Tech')}>
      <ul className="container-noir">
        {ITEMS.map(({ icon: Icon, text }, i) => (
          <li key={text} className={i === current ? 'current' : undefined}>
            <Icon size={14} aria-hidden /> {t(text)}
          </li>
        ))}
      </ul>
    </div>
  )
}
