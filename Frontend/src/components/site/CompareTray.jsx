import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, GitCompare } from 'lucide-react'
import { useCompare, removeCompare, clearCompare, COMPARE_MAX } from '../../lib/compare'

const HIDDEN_ON = ['/compare', '/checkout', '/login', '/register']

// Floating tray (bottom-left, clear of the chat button) listing what's picked for compare.
export default function CompareTray() {
  const items = useCompare()
  const { pathname } = useLocation()
  const show = items.length > 0 && !HIDDEN_ON.some((p) => pathname.startsWith(p))

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="compare-tray"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: COMPARE_MAX }).map((_, i) => {
              const p = items[i]
              return p ? (
                <div key={p.id} className="ct-slot" title={p.name}>
                  {p.image ? <img src={p.image} alt="" /> : <span>{p.name.slice(0, 2)}</span>}
                  <button onClick={() => removeCompare(p.id)} aria-label={`Remove ${p.name}`}><X size={10} /></button>
                </div>
              ) : <div key={i} className="ct-slot empty" />
            })}
          </div>
          <Link to="/compare" className={`ct-go ${items.length < 2 ? 'dim' : ''}`}>
            <GitCompare size={14} /> Compare {items.length}
          </Link>
          <button className="ct-clear" onClick={clearCompare} aria-label="Clear compare list"><X size={14} /></button>
          <style>{`
            .compare-tray{position:fixed;left:20px;bottom:20px;z-index:58;display:flex;align-items:center;gap:10px;padding:8px;
              border-radius:16px;border:1px solid var(--border);background:var(--surface);box-shadow:0 18px 50px -12px rgba(0,0,0,.55)}
            .ct-slot{position:relative;width:42px;height:42px;border-radius:10px;background:#fff;overflow:visible;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#354380}
            .ct-slot img{width:100%;height:100%;object-fit:contain;border-radius:10px}
            .ct-slot.empty{background:transparent;border:1px dashed var(--border)}
            .ct-slot button{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;border:0;background:var(--text);color:var(--bg);display:flex;align-items:center;justify-content:center;cursor:pointer}
            .ct-go{display:inline-flex;align-items:center;gap:6px;padding:10px 14px;border-radius:10px;background:var(--accent);color:#fff;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap}
            .ct-go.dim{opacity:.7}
            .ct-clear{width:30px;height:30px;border-radius:8px;border:0;background:transparent;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center}
            @media (max-width:520px){.compare-tray{left:12px;bottom:16px;padding:6px;gap:4px}.compare-tray > div:first-child{display:none}.ct-go{padding:10px 12px}}
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
