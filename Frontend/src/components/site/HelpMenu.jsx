import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LifeBuoy, Mail } from 'lucide-react'
import { HELP_LINKS, SUPPORT_EMAIL } from '../../lib/helpLinks'
import { useDropdownMenu, DROPDOWN_MOTION_PROPS } from '../../lib/useDropdownMenu'

export default function HelpMenu() {
  const {
    open, setOpen, close, containerRef, triggerRef, setItemRef, onTriggerKeyDown, onMenuKeyDown,
  } = useDropdownMenu()
  const CONTACT_SLOT = HELP_LINKS.length

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onTriggerKeyDown}
        title="Help"
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          background: open ? 'var(--accent-dim)' : 'none', border: 'none',
          color: open ? 'var(--accent-light)' : 'var(--text)',
          padding: 8, display: 'flex', alignItems: 'center',
          transition: 'color 0.2s, background 0.2s', borderRadius: 8, cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--muted)'; if (!open) e.currentTarget.style.background = 'var(--overlay-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.color = open ? 'var(--accent-light)' : 'var(--text)'; e.currentTarget.style.background = open ? 'var(--accent-dim)' : 'none' }}
      >
        <LifeBuoy size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            onKeyDown={onMenuKeyDown}
            {...DROPDOWN_MOTION_PROPS}
            style={{
              position: 'absolute', top: 'calc(100% + 12px)', right: 0,
              width: 260,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
              padding: 16, zIndex: 99,
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-dark)', marginBottom: 8, padding: '0 4px' }}>
              Support
            </p>
            {HELP_LINKS.map(([label, to], i) => (
              <Link
                key={label}
                ref={setItemRef(i)}
                to={to}
                onClick={close}
                style={{
                  display: 'block', padding: '9px 10px', borderRadius: 8,
                  color: 'var(--text)', textDecoration: 'none', fontSize: 13.5,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent-light)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text)' }}
              >
                {label}
              </Link>
            ))}

            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-dark)', margin: '14px 4px 8px', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              Contact us
            </p>
            <a
              ref={setItemRef(CONTACT_SLOT)}
              href={`mailto:${SUPPORT_EMAIL}`}
              onClick={close}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 10px', borderRadius: 8,
                background: 'var(--accent-dim)', color: 'var(--accent-light)',
                textDecoration: 'none', fontSize: 13, fontWeight: 600,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-dim2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
            >
              <Mail size={14} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{SUPPORT_EMAIL}</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
