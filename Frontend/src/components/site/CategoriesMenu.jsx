import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Laptop, Monitor, ArrowRight } from 'lucide-react'
import apiService from '../../api/service'
import { getProductImage, handleProductImageError } from '../../lib/productImage'
import { useDropdownMenu, DROPDOWN_MOTION_PROPS } from '../../lib/useDropdownMenu'

// Curated shortcut links, routed through the same ?category= param the rest
// of the site uses. If a category name doesn't exist yet, ProductsPage
// degrades gracefully to showing all products rather than an empty grid.
const LAPTOPS = [
  { label: 'Dell laptops',   category: 'Dell Laptops' },
  { label: 'HP laptops',     category: 'HP Laptops' },
  { label: 'Lenovo laptops', category: 'Lenovo Laptops' },
]
const DESKTOPS = [
  { label: 'HP desktops',     category: 'HP Desktops' },
  { label: 'Lenovo desktops', category: 'Lenovo Desktops' },
]

export default function CategoriesMenu() {
  const {
    open, setOpen, close, containerRef, triggerRef, setItemRef, onTriggerKeyDown, onMenuKeyDown,
  } = useDropdownMenu()
  const PROMO_SLOT    = LAPTOPS.length + DESKTOPS.length
  const VIEW_ALL_SLOT = PROMO_SLOT + 1

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiService.categories.getAll()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 1000 * 60 * 5,
  })

  const { data: newArrival, isLoading: newArrivalLoading } = useQuery({
    queryKey: ['categories-menu-new-arrival'],
    queryFn: async () => {
      const { data } = await apiService.products.getNewest(1)
      const content = data?.content ?? (Array.isArray(data) ? data : [])
      return content[0] ?? null
    },
    staleTime: 1000 * 60 * 5,
    enabled: open,
  })

  const price = newArrival ? parseFloat(newArrival.startingPrice ?? newArrival.price ?? 0) : 0

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 14, fontWeight: 400, color: 'var(--text)',
          background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--muted)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text)' }}
      >
        Categories
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            onKeyDown={onMenuKeyDown}
            {...DROPDOWN_MOTION_PROPS}
            style={{
              position: 'absolute', top: 'calc(100% + 12px)', left: 0,
              width: 'min(560px, 90vw)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
              padding: 24, zIndex: 99,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <MenuColumn title="Laptops" items={LAPTOPS} Icon={Laptop} slotOffset={0} setItemRef={setItemRef} onSelect={close} />
              <MenuColumn title="Desktops" items={DESKTOPS} Icon={Monitor} slotOffset={LAPTOPS.length} setItemRef={setItemRef} onSelect={close} />
            </div>

            {/* Featured promo tile — real newest product */}
            {(newArrivalLoading || newArrival) && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 20 }}>
                {newArrivalLoading ? (
                  <div className="skeleton" style={{ height: 76, borderRadius: 12 }} />
                ) : (
                  <Link
                    ref={setItemRef(PROMO_SLOT)}
                    to={`/products/${newArrival.productId ?? newArrival.id}`}
                    onClick={close}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: 12, borderRadius: 12, background: 'var(--card)',
                      textDecoration: 'none', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-dim)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
                  >
                    <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface)' }}>
                      <img
                        src={getProductImage(newArrival)}
                        alt=""
                        onError={handleProductImageError}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 3 }}>
                        New arrival
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {newArrival.name}
                      </p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--price)', flexShrink: 0 }}>
                      ${price.toFixed(0)}
                    </span>
                  </Link>
                )}
              </div>
            )}

            {/* Footer row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 14,
            }}>
              <Link
                ref={setItemRef(VIEW_ALL_SLOT)}
                to="/products"
                onClick={close}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
              >
                View all products <ArrowRight size={13} />
              </Link>
              <span style={{ fontSize: 12, color: 'var(--muted-dark)' }}>{categories.length} categories</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuColumn({ title, items, Icon, slotOffset, setItemRef, onSelect }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-dark)', marginBottom: 10 }}>
        {title}
      </p>
      {items.map((item, i) => (
        <Link
          key={item.label}
          ref={setItemRef(slotOffset + i)}
          to={`/products?category=${encodeURIComponent(item.category)}`}
          onClick={onSelect}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10,
            color: 'var(--text)', textDecoration: 'none', fontSize: 13.5,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent-light)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text)' }}
        >
          <Icon size={15} style={{ flexShrink: 0, opacity: 0.7 }} />
          {item.label}
        </Link>
      ))}
    </div>
  )
}
