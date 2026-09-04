import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Reveal } from '../../lib/motion'

const eyebrowStyle = { fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }
const headingStyle = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }

// Generic, reusable accordion — no Interactive-Screens-specific content baked in. Pass
// `items` (and optional `eyebrow`/`heading`) from a page-specific wrapper.
export default function FAQAccordion({ eyebrow, heading, items }) {
  const reduce = useReducedMotion()
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section style={{ padding: 'clamp(56px,8vw,100px) 0' }}>
      <div className="container-noir" style={{ maxWidth: 760 }}>
        {(eyebrow || heading) && (
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
            {heading && <h2 style={headingStyle}>{heading}</h2>}
          </div>
        )}

        <Reveal>
          <div style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {items.map((item, i) => {
              const isOpen = openIndex === i
              return (
                <div key={item.q} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      padding: '18px 22px', background: 'transparent', border: 'none', cursor: 'pointer',
                      textAlign: 'left', font: 'inherit', color: 'var(--text)',
                    }}
                  >
                    <span style={{ fontSize: 14.5, fontWeight: 600 }}>{item.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ flexShrink: 0, display: 'flex', color: 'var(--muted)' }}
                    >
                      <ChevronDown size={18} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduce ? {} : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p style={{ margin: 0, padding: '0 22px 20px', fontSize: 13.5, lineHeight: 1.7, color: 'var(--muted)' }}>
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
