import { useEffect, useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { openQuote } from '../../lib/quote'
import { openLiveChat } from '../../lib/liveChat'

// Appears once the hero has scrolled away, and steps aside when the closing CTA
// (which has the same buttons) is on screen.
export default function InteractiveScreensStickyBar({ ctaId }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 1.2
      const cta = document.getElementById(ctaId)
      const ctaInView = cta ? cta.getBoundingClientRect().top < window.innerHeight : false
      setVisible(pastHero && !ctaInView)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ctaId])

  return (
    <div className="iss-wrap">
    <AnimatePresence>
      {visible && (
        <motion.div
          className="iss-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="iss-text">Equipping a classroom or office?</span>
          <button className="iss-ghost" onClick={() => openLiveChat('Which interactive screen size do I need for ')}>
            <Sparkles size={14} /> Ask Blue
          </button>
          <button className="iss-primary" onClick={() => openQuote()}>
            Get a quote <ArrowRight size={14} />
          </button>
          <style>{`
            .iss-wrap{position:fixed;left:0;right:0;bottom:20px;z-index:55;display:flex;justify-content:center;pointer-events:none;padding:0 12px}
            .iss-bar{pointer-events:auto;display:flex;align-items:center;gap:8px;
              padding:8px 8px 8px 18px;border-radius:999px;border:1px solid var(--border);background:var(--surface);
              box-shadow:0 18px 50px -12px rgba(0,0,0,.55)}
            .iss-text{font-size:13px;font-weight:600;color:var(--text);margin-right:6px;white-space:nowrap}
            .iss-ghost,.iss-primary{display:inline-flex;align-items:center;gap:6px;padding:9px 15px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
            .iss-ghost{border:1px solid var(--border);background:transparent;color:var(--text)}
            .iss-primary{border:0;background:#f59e0b;color:#241a06}
            @media (max-width:640px){
              .iss-wrap{bottom:16px;padding:0 84px 0 12px}
              .iss-bar{flex:1;padding:6px}
              .iss-text{display:none}
              .iss-ghost,.iss-primary{flex:1;justify-content:center}
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  )
}
