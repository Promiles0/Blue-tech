import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal } from 'lucide-react'
import { FILTER_FACETS } from '../../lib/specTemplates'

function SectionTitle({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-dark)' }}>
        {children}
      </p>
      {hint && (
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--muted-dark)', border: '1px solid var(--border)', borderRadius: 100,
          padding: '2px 7px',
        }}>
          {hint}
        </span>
      )}
    </div>
  )
}

function Checkbox({ label, checked, onChange }) {
  const disabled = !onChange
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 0', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      fontSize: 13.5, color: 'var(--text)',
      userSelect: 'none',
    }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      {label}
    </label>
  )
}

// Facet values come from the API (/products/facets), so a group only appears when some
// published product actually has a value for it — no dead "coming soon" options.
function FilterGroups({ filters, setters, facets }) {
  const { selected, minPrice, maxPrice } = filters
  const { toggleFacet, setMinPrice, setMaxPrice } = setters
  const groups = FILTER_FACETS.filter(f => facets?.[f.key]?.length)

  const priceInput = {
    width: '100%', background: 'none', border: '1px solid var(--border)',
    borderRadius: 6, padding: '8px 10px', fontSize: 13, color: 'var(--text)',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <>
      <div style={{ paddingBottom: 28, borderBottom: groups.length ? '1px solid var(--border)' : 'none' }}>
        <SectionTitle hint="RWF">Price</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="number" min="0" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={priceInput} />
          <span style={{ color: 'var(--muted-dark)', fontSize: 13 }}>–</span>
          <input type="number" min="0" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={priceInput} />
        </div>
      </div>

      {groups.map((group, i) => (
        <div key={group.key} style={{ padding: '28px 0', borderBottom: i < groups.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <SectionTitle>{group.label}</SectionTitle>
          {facets[group.key].map(({ value, count }) => (
            <Checkbox
              key={value}
              label={<span style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                <span>{value}</span>
                <span style={{ color: 'var(--muted-dark)', fontSize: 12 }}>{count}</span>
              </span>}
              checked={(selected[group.key] ?? []).includes(value)}
              onChange={() => toggleFacet(group.key, value)}
            />
          ))}
        </div>
      ))}
    </>
  )
}

export default function FilterRail({ filters, setters, facets, activeCount, onClearAll, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* ── Desktop — persistent sidebar ─────────────────────── */}
      <aside
        className="filter-rail-desktop"
        style={{ position: 'sticky', top: 90, alignSelf: 'start', paddingRight: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Filters</span>
          {activeCount > 0 && (
            <button
              onClick={onClearAll}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Clear all
            </button>
          )}
        </div>
        <FilterGroups filters={filters} setters={setters} facets={facets} />
      </aside>

      {/* ── Mobile — drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="filter-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)', zIndex: 200 }}
            />
            <motion.div
              key="filter-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: 'min(340px, 84vw)',
                background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', zIndex: 201,
              }}
            >
              <div style={{ padding: '22px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <SlidersHorizontal size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Filters</span>
                </div>
                <button
                  onClick={onMobileClose}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', padding: 6, borderRadius: 8, cursor: 'pointer', display: 'flex' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 22px' }}>
                <FilterGroups filters={filters} setters={setters} facets={facets} />
              </div>

              <div style={{ padding: '18px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                <button
                  onClick={onClearAll}
                  className="noir-btn-outline"
                  style={{ flex: 1, fontSize: 13 }}
                >
                  Clear all
                </button>
                <button
                  onClick={onMobileClose}
                  className="noir-btn-cta"
                  style={{ flex: 1, fontSize: 13 }}
                >
                  Show results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
