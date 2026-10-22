import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackagePlus, Pencil, Percent, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

// Sales and bundles (6b, 6c). During a sale the shop, cart, checkout, Blue and the Google feed
// all use the sale price; coupons don't add on top of sale items. Bundles give a saving when
// the whole set is in the cart.
const input = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, fontSize: 13, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }
const label = { display: 'block', fontSize: 12, color: 'var(--admin-muted)', marginBottom: 5 }
const primaryBtn = { padding: '9px 16px', borderRadius: 8, border: 0, background: 'var(--admin-primary)', color: 'var(--admin-primary-fg, #fff)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }
const ghostBtn = { padding: '7px 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }
const rwf = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} RWF`
const local = (iso) => { if (!iso) return ''; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
const when = (iso) => { try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return '' } }

function campaignState(c) {
  const now = Date.now()
  if (!c.isActive) return ['Off', 'var(--admin-muted)']
  if (new Date(c.startsAt).getTime() > now) return ['Scheduled', 'var(--admin-warning, #f59e0b)']
  if (new Date(c.endsAt).getTime() <= now) return ['Ended', 'var(--admin-muted)']
  return ['Live now', 'var(--admin-success, #22c55e)']
}

// Names and regular prices of every product (hidden ones too).
function useProductList() {
  return useQuery({
    queryKey: ['admin-sales-products'],
    queryFn: () => apiService.admin.products.picker().then((r) => r.data?.data ?? r.data ?? []),
    staleTime: 5 * 60_000,
  })
}

function ProductPicker({ value, onChange, max = 50 }) {
  const { data: products = [] } = useProductList()
  const [q, setQ] = useState('')
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const matches = q.trim().length < 2 ? [] : products.filter((p) => !value.includes(p.id) && p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: value.length ? 8 : 0 }}>
        {value.map((id) => (
          <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 999, background: 'var(--admin-border)', fontSize: 12 }}>
            {byId.get(id)?.name ?? `#${id}`} {byId.get(id) && <span style={{ color: 'var(--admin-muted)' }}>· {rwf(byId.get(id).price)}</span>}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== id))} aria-label="Remove" style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
          </span>
        ))}
      </div>
      {value.length < max && (
        <div style={{ position: 'relative' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a product name to add it…" style={input} />
          {matches.length > 0 && (
            <div className="surface" style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, top: '100%', marginTop: 4, borderRadius: 10, padding: 4, maxHeight: 260, overflow: 'auto' }}>
              {matches.map((p) => (
                <button key={p.id} type="button" onClick={() => { onChange([...value, p.id]); setQ('') }}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 10, width: '100%', textAlign: 'left', padding: '8px 10px', border: 0, borderRadius: 7, background: 'transparent', color: 'var(--text)', fontSize: 12.5, cursor: 'pointer' }}>
                  <span>{p.name}{p.isActive === false && <em style={{ color: 'var(--admin-muted)' }}> (hidden)</em>}</span><span style={{ color: 'var(--admin-muted)', whiteSpace: 'nowrap' }}>{rwf(p.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminSales() {
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Percent size={22} style={{ color: 'var(--admin-primary)' }} /> Sales &amp; bundles
      </h1>
      <p style={{ color: 'var(--admin-muted)', fontSize: 13, margin: '4px 0 24px', maxWidth: 680, lineHeight: 1.6 }}>
        A sale changes the price everywhere (shop, cart, Blue and Google) between its start and end, then switches back by itself.
        Coupons don&apos;t add on top of sale items. Bundles give money off when the whole set is in the cart.
      </p>
      <Campaigns />
      <div style={{ height: 36 }} />
      <Bundles />
    </div>
  )
}

const emptyCampaign = () => {
  const start = new Date(); start.setMinutes(0, 0, 0)
  const end = new Date(start.getTime() + 7 * 86400000)
  return { name: '', slug: '', kind: 'percent', value: '', target: 'all', categoryId: '', productIds: [], startsAt: local(start.toISOString()), endsAt: local(end.toISOString()), bannerText: '', isActive: true }
}

function Campaigns() {
  const qc = useQueryClient()
  const [form, setForm] = useState(null)
  const { data: list = [], isLoading } = useQuery({ queryKey: ['admin-campaigns'], queryFn: () => apiService.admin.campaigns.getAll().then((r) => r.data?.data ?? r.data ?? []) })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => apiService.categories.getAll().then((r) => r.data?.data ?? r.data ?? []) })
  const done = (msg) => { toast.success(msg); qc.invalidateQueries({ queryKey: ['admin-campaigns'] }); qc.invalidateQueries({ queryKey: ['campaigns-active'] }) }
  const save = useMutation({
    mutationFn: (f) => {
      const body = { ...f, value: Number(f.value), categoryId: f.categoryId ? Number(f.categoryId) : null, startsAt: new Date(f.startsAt).toISOString(), endsAt: new Date(f.endsAt).toISOString() }
      return f.id ? apiService.admin.campaigns.update(f.id, body) : apiService.admin.campaigns.create(body)
    },
    onSuccess: (r) => { done(r?.data?.message ?? 'Saved'); setForm(null) },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Could not save'),
  })
  const remove = useMutation({
    mutationFn: (id) => apiService.admin.campaigns.delete(id),
    onSuccess: () => done('Sale deleted'),
    onError: (e) => toast.error(e.response?.data?.message ?? 'Could not delete'),
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const catName = (id) => categories.find((c) => Number(c.categoryId ?? c.id) === Number(id))?.name ?? `category #${id}`

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 900, marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Sales</h2>
        {!form && <button style={primaryBtn} onClick={() => setForm(emptyCampaign())}>New sale</button>}
      </div>

      {form && (
        <div className="surface" style={{ borderRadius: 14, padding: 20, maxWidth: 900, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div><label style={label}>Name</label><input style={input} value={form.name} onChange={set('name')} placeholder="Back to school" /></div>
            <div><label style={label}>Link name (optional)</label><input style={input} value={form.slug} onChange={set('slug')} placeholder="back-to-school" /></div>
            <div><label style={label}>Discount</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ ...input, flex: 1 }} type="number" min="1" value={form.value} onChange={set('value')} placeholder={form.kind === 'percent' ? '10' : '20000'} />
                <select style={{ ...input, width: 96 }} value={form.kind} onChange={set('kind')}><option value="percent">%</option><option value="fixed">RWF</option></select>
              </div>
            </div>
            <div><label style={label}>Applies to</label>
              <select style={input} value={form.target} onChange={set('target')}>
                <option value="all">Every product</option><option value="category">One category</option><option value="products">Chosen products</option>
              </select>
            </div>
            <div><label style={label}>Starts</label><input style={input} type="datetime-local" value={form.startsAt} onChange={set('startsAt')} /></div>
            <div><label style={label}>Ends</label><input style={input} type="datetime-local" value={form.endsAt} onChange={set('endsAt')} /></div>
          </div>
          {form.target === 'category' && (
            <div style={{ marginTop: 14 }}><label style={label}>Category</label>
              <select style={input} value={form.categoryId} onChange={set('categoryId')}>
                <option value="">Choose…</option>
                {categories.map((c) => <option key={c.categoryId ?? c.id} value={c.categoryId ?? c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {form.target === 'products' && (
            <div style={{ marginTop: 14 }}><label style={label}>Products</label>
              <ProductPicker value={form.productIds} onChange={(productIds) => setForm((f) => ({ ...f, productIds }))} />
            </div>
          )}
          <div style={{ marginTop: 14 }}><label style={label}>Banner text (shown across the top of the shop)</label>
            <input style={input} value={form.bannerText} onChange={set('bannerText')} maxLength={140} placeholder="Back to school: 10% off every laptop until Sunday" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> On (untick to pause it)
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button style={primaryBtn} disabled={save.isPending} onClick={() => save.mutate(form)}>{save.isPending ? 'Saving…' : form.id ? 'Save sale' : 'Create sale'}</button>
            <button style={ghostBtn} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="surface" style={{ borderRadius: 14, padding: '4px 20px', maxWidth: 900 }}>
        {isLoading ? <p style={{ color: 'var(--admin-muted)', fontSize: 13, padding: '14px 0' }}>Loading…</p>
          : !list.length ? <p style={{ color: 'var(--admin-muted)', fontSize: 13, padding: '14px 0' }}>No sales yet.</p>
          : list.map((c, i) => {
            const [state, color] = campaignState(c)
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: i ? '1px solid var(--admin-border)' : 'none', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name} <span style={{ fontSize: 11.5, fontWeight: 700, color, marginLeft: 6 }}>● {state}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 3 }}>
                    {c.kind === 'percent' ? `${c.value}% off` : `${rwf(c.value)} off`} · {c.target === 'all' ? 'every product' : c.target === 'category' ? catName(c.categoryId) : `${c.productIds.length} product(s)`} · {when(c.startsAt)} → {when(c.endsAt)}
                    {' · '}<a href={`/sale/${c.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--admin-primary)' }}>/sale/{c.slug}</a>
                  </div>
                </div>
                <button style={ghostBtn} onClick={() => setForm({ ...c, categoryId: c.categoryId ?? '', bannerText: c.bannerText ?? '', startsAt: local(c.startsAt), endsAt: local(c.endsAt), productIds: (c.productIds ?? []).map(Number) })}><Pencil size={13} /> Edit</button>
                <button style={ghostBtn} onClick={() => { if (confirm(`Delete the sale "${c.name}"?`)) remove.mutate(c.id) }}><Trash2 size={13} /></button>
              </div>
            )
          })}
      </div>
    </section>
  )
}

function Bundles() {
  const qc = useQueryClient()
  const [form, setForm] = useState(null)
  const { data: products = [] } = useProductList()
  const { data: list = [], isLoading } = useQuery({ queryKey: ['admin-bundles'], queryFn: () => apiService.admin.bundles.getAll().then((r) => r.data?.data ?? r.data ?? []) })
  const save = useMutation({
    mutationFn: (f) => {
      const body = { name: f.name, productIds: f.productIds, saving: Number(f.saving), isActive: f.isActive }
      return f.id ? apiService.admin.bundles.update(f.id, body) : apiService.admin.bundles.create(body)
    },
    onSuccess: (r) => { toast.success(r?.data?.message ?? 'Saved'); setForm(null); qc.invalidateQueries({ queryKey: ['admin-bundles'] }) },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Could not save'),
  })
  const remove = useMutation({
    mutationFn: (id) => apiService.admin.bundles.delete(id),
    onSuccess: () => { toast.success('Bundle deleted'); qc.invalidateQueries({ queryKey: ['admin-bundles'] }) },
  })
  const setTotal = form ? form.productIds.reduce((s, id) => s + (products.find((p) => p.id === id)?.price ?? 0), 0) : 0

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 900, marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><PackagePlus size={17} /> Bundles</h2>
        {!form && <button style={primaryBtn} onClick={() => setForm({ name: '', productIds: [], saving: '', isActive: true })}>New bundle</button>}
      </div>

      {form && (
        <div className="surface" style={{ borderRadius: 14, padding: 20, maxWidth: 900, marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}><label style={label}>Name</label><input style={input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Office starter set" /></div>
          <div style={{ marginBottom: 14 }}><label style={label}>Products (2 to 5)</label>
            <ProductPicker max={5} value={form.productIds} onChange={(productIds) => setForm((f) => ({ ...f, productIds }))} />
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ width: 220 }}><label style={label}>Saving for the whole set (RWF)</label>
              <input style={input} type="number" min="1" value={form.saving} onChange={(e) => setForm((f) => ({ ...f, saving: e.target.value }))} placeholder="15000" />
            </div>
            {setTotal > 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', margin: '0 0 10px' }}>
                Set price {rwf(setTotal)}{Number(form.saving) > 0 && <> → <strong style={{ color: 'var(--text)' }}>{rwf(setTotal - Number(form.saving))}</strong> ({Math.round(Number(form.saving) / setTotal * 100)}% off)</>}
              </p>
            )}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> On
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button style={primaryBtn} disabled={save.isPending} onClick={() => save.mutate(form)}>{save.isPending ? 'Saving…' : form.id ? 'Save bundle' : 'Create bundle'}</button>
            <button style={ghostBtn} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="surface" style={{ borderRadius: 14, padding: '4px 20px', maxWidth: 900 }}>
        {isLoading ? <p style={{ color: 'var(--admin-muted)', fontSize: 13, padding: '14px 0' }}>Loading…</p>
          : !list.length ? <p style={{ color: 'var(--admin-muted)', fontSize: 13, padding: '14px 0' }}>No bundles yet. They show as &ldquo;Buy together and save&rdquo; on each product in the set.</p>
          : list.map((b, i) => {
            const total = b.products.reduce((s, p) => s + p.price, 0)
            const broken = b.products.some((p) => !p.isActive)
            return (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: i ? '1px solid var(--admin-border)' : 'none', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {b.name} {!b.isActive && <span style={{ fontSize: 11.5, color: 'var(--admin-muted)', marginLeft: 6 }}>● Off</span>}
                    {broken && <span style={{ fontSize: 11.5, color: 'var(--admin-danger)', marginLeft: 6 }}>● A product is hidden, so this bundle isn&apos;t shown</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 3 }}>{b.products.map((p) => p.name).join(' + ')} · save {rwf(b.saving)} of {rwf(total)}</div>
                </div>
                <button style={ghostBtn} onClick={() => setForm({ id: b.id, name: b.name, productIds: (b.productIds ?? []).map(Number), saving: b.saving, isActive: b.isActive })}><Pencil size={13} /> Edit</button>
                <button style={ghostBtn} onClick={() => { if (confirm(`Delete the bundle "${b.name}"?`)) remove.mutate(b.id) }}><Trash2 size={13} /></button>
              </div>
            )
          })}
      </div>
    </section>
  )
}
