import { useEffect, useRef, useState } from 'react'

// Shared open/close/keyboard-nav behavior for header dropdowns (Categories,
// Help, …) so every menu in the header opens, closes, and navigates the
// same way instead of each one reimplementing it slightly differently.
export function useDropdownMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef   = useRef(null)
  // Fixed-slot ref registry (never reassigned during render) so keyboard
  // nav has a stable item order even when some items mount a beat later
  // (e.g. an item waiting on an API response).
  const itemRefs = useRef([])
  const setItemRef = (index) => (el) => { itemRefs.current[index] = el }

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  // Outside click
  useEffect(() => {
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Focus the first item whenever the menu opens
  useEffect(() => {
    if (open) itemRefs.current.find(Boolean)?.focus()
  }, [open])

  const onTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true) }
  }

  const onMenuKeyDown = (e) => {
    const items = itemRefs.current.filter(Boolean)
    if (items.length === 0) return
    const idx = items.indexOf(document.activeElement)
    if (e.key === 'Escape') {
      e.preventDefault(); close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); items[(idx + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus()
    }
  }

  return { open, setOpen, close, containerRef, triggerRef, setItemRef, onTriggerKeyDown, onMenuKeyDown }
}

// Fade + slight slide-down, ~180ms ease-out — the standard open/close
// animation for every header dropdown panel.
export const DROPDOWN_MOTION_PROPS = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
}
