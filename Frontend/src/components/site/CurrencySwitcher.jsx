import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useCurrency } from '../../context/CurrencyContext'
import { useDropdownMenu, DROPDOWN_MOTION_PROPS } from '../../lib/useDropdownMenu'

const OPTIONS = [
  ['RWF', 'Rwandan Franc'],
  ['USD', 'US Dollar'],
]

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency()
  const {
    open, setOpen, close, containerRef, triggerRef, setItemRef, onTriggerKeyDown, onMenuKeyDown,
  } = useDropdownMenu()

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onTriggerKeyDown}
        title="Display currency"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Display currency: ${currency}`}
        style={{
          background: open ? 'var(--accent-dim)' : 'none', border: 'none',
          color: open ? 'var(--accent-light)' : 'var(--text)',
          padding: 8, display: 'flex', alignItems: 'center', gap: 3,
          transition: 'color 0.2s, background 0.2s', borderRadius: 8, cursor: 'pointer',
          fontSize: 12.5, fontWeight: 700, letterSpacing: '0.02em', fontFamily: 'inherit',
          lineHeight: '18px',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--muted)'; if (!open) e.currentTarget.style.background = 'var(--overlay-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.color = open ? 'var(--accent-light)' : 'var(--text)'; e.currentTarget.style.background = open ? 'var(--accent-dim)' : 'none' }}
      >
        {currency}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', fontSize: 9, lineHeight: 1 }}
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            onKeyDown={onMenuKeyDown}
            {...DROPDOWN_MOTION_PROPS}
            style={{
              position: 'absolute', top: 'calc(100% + 12px)', right: 0,
              width: 210,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
              padding: 16, zIndex: 99,
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-dark)', marginBottom: 8, padding: '0 4px' }}>
              Display currency
            </p>
            {OPTIONS.map(([code, label], i) => {
              const active = code === currency
              return (
                <button
                  key={code}
                  ref={setItemRef(i)}
                  role="menuitem"
                  onClick={() => { setCurrency(code); close() }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '9px 10px', borderRadius: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: active ? 'var(--accent-light)' : 'var(--text)',
                    fontSize: 13.5, fontFamily: 'inherit', textAlign: 'left',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--overlay-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  <span>
                    <strong style={{ fontWeight: 700 }}>{code}</strong>
                    <span style={{ color: 'var(--muted-dark)', fontSize: 12, marginLeft: 6 }}>{label}</span>
                  </span>
                  {active && <Check size={14} style={{ flexShrink: 0 }} />}
                </button>
              )
            })}
            <p style={{ fontSize: 11, color: 'var(--muted-dark)', lineHeight: 1.5, marginTop: 10, padding: '0 4px' }}>
              Payments are always charged in USD.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
