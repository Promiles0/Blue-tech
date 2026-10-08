import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { X, SlidersHorizontal, ChevronDown, Check } from 'lucide-react'
import { FILTER_FACETS } from '../../lib/specTemplates'

const VISIBLE_OPTIONS = 6   // longer lists fold behind "Show all"

function Group({ id, title, hint, selectedCount = 0, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="filter-group">
      <button type="button" className="filter-group-btn" aria-expanded={open} aria-controls={`filter-${id}`} onClick={() => setOpen(o => !o)}>
        <span>
          {title}
          {hint && <span className="filter-hint">{hint}</span>}
          {selectedCount > 0 && <span className="filter-sel">{selectedCount} selected</span>}
        </span>
        <ChevronDown size={15} className="chev" />
      </button>
      {open && <div className="filter-group-body" id={`filter-${id}`}>{children}</div>}
    </div>
  )
}

function Option({ label, count, checked, onChange }) {
  return (
    <label className={`filter-option${checked ? ' on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="filter-box" aria-hidden><Check size={12} strokeWidth={3} color="#fff" /></span>
      <span className="filter-label">{label}</span>
      <span className="filter-num">{count}</span>
    </label>
  )
}

function FacetGroup({ group, values, selected, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  // Keep ticked values visible even when the list is folded.
  const shown = expanded ? values : values.filter((v, i) => i < VISIBLE_OPTIONS || selected.includes(v.value))
  const hidden = values.length - shown.length
  return (
    <Group id={group.key} title={group.label} selectedCount={selected.length}>
      {shown.map(({ value, count }) => (
        <Option key={value} label={value} count={count} checked={selected.includes(value)} onChange={() => onToggle(group.key, value)} />
      ))}
      {(hidden > 0 || expanded) && values.length > VISIBLE_OPTIONS && (
        <button type="button" className="filter-more" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less' : `Show all ${values.length}`}
        </button>
      )}
    </Group>
  )
}

// Facet values come from the API (/products/facets), so a group only appears when some
// published product actually has a value for it — no dead "coming soon" options.
function FilterGroups({ filters, setters, facets }) {
  const { selected, minPrice, maxPrice } = filters
  const { toggleFacet, setMinPrice, setMaxPrice } = setters
  const groups = FILTER_FACETS.filter(f => facets?.[f.key]?.length)

  return (
    <>
      <Group id="price" title="Price" hint="RWF" selectedCount={(minPrice ? 1 : 0) + (maxPrice ? 1 : 0)}>
        <div className="filter-price">
          <input type="number" min="0" placeholder="Min" aria-label="Minimum price" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
          <span style={{ color: 'var(--muted-dark)', fontSize: 13 }}>–</span>
          <input type="number" min="0" placeholder="Max" aria-label="Maximum price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        </div>
      </Group>

      {groups.map(group => (
        <FacetGroup key={group.key} group={group} values={facets[group.key]} selected={selected[group.key] ?? []} onToggle={toggleFacet} />
      ))}
    </>
  )
}

export default function FilterRail({ filters, setters, facets, activeCount, onClearAll, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* ── Desktop — persistent sidebar ─────────────────────── */}
      <aside className="filter-rail-desktop" aria-label="Product filters">
        <div className="filter-rail-head">
          <b>
            <SlidersHorizontal size={15} style={{ color: 'var(--accent-light)' }} /> Filters
            {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
          </b>
          {activeCount > 0 && <button type="button" className="filter-clear" onClick={onClearAll}>Clear all</button>}
        </div>
        <div className="filter-scroll">
          <FilterGroups filters={filters} setters={setters} facets={facets} />
        </div>
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
