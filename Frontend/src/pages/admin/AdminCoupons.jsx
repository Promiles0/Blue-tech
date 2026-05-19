import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../api/axios'

const empty = { code: '', kind: 'PERCENT', value: '', minSubtotal: '', maxUses: '', startsAt: '', endsAt: '', isActive: true }

function Modal({ title, form, setForm, onSave, onClose, saving }) {
  const field = (label, key, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--admin-muted)', marginBottom: 5 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
          background: 'var(--admin-bg)', border: '1px solid var(--admin-border)',
          color: 'var(--text)', outline: 'none',
        }}
      />
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="surface" style={{ width: '100%', maxWidth: 440, borderRadius: 16, padding: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 22 }}>{title}</h2>

        {field('Code', 'code', 'text', 'SUMMER20')}

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--admin-muted)', marginBottom: 5 }}>Kind</label>
          <select
            value={form.kind}
            onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--text)', outline: 'none' }}
          >
            <option value="PERCENT">Percent (%)</option>
            <option value="FIXED">Fixed ($)</option>
          </select>
        </div>

        {field('Value', 'value', 'number', form.kind === 'PERCENT' ? '20' : '10')}
        {field('Min subtotal ($)', 'minSubtotal', 'number', '50')}
        {field('Max uses', 'maxUses', 'number', 'Unlimited')}
        {field('Starts at', 'startsAt', 'datetime-local')}
        {field('Ends at', 'endsAt', 'datetime-local')}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
          <label htmlFor="active" style={{ fontSize: 13, color: 'var(--text)', opacity: 0.85, cursor: 'pointer' }}>Active</label>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--admin-border)', border: 'none', color: 'var(--text)', opacity: 0.85, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--admin-primary)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | coupon object
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/admin/coupons')
      .then(({ data }) => setCoupons(data.data ?? data))
      .catch(() => toast.error('Failed to load coupons'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => { setForm(empty); setModal('create') }
  const openEdit   = (c) => {
    setForm({
      code: c.code, kind: c.kind, value: c.value, minSubtotal: c.minSubtotal ?? '',
      maxUses: c.maxUses ?? '', startsAt: c.startsAt ? c.startsAt.slice(0,16) : '',
      endsAt:  c.endsAt  ? c.endsAt.slice(0,16)  : '', isActive: c.isActive,
    })
    setModal(c)
  }

  const handleSave = async () => {
    if (!form.code || !form.value) { toast.error('Code and value are required'); return }
    setSaving(true)
    try {
      const payload = {
        code: form.code, kind: form.kind,
        value: parseFloat(form.value),
        minSubtotal: form.minSubtotal ? parseFloat(form.minSubtotal) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        isActive: form.isActive,
      }
      if (modal === 'create') {
        await api.post('/admin/coupons', payload)
        toast.success('Coupon created')
      } else {
        await api.put(`/admin/coupons/${modal.couponId}`, payload)
        toast.success('Coupon updated')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (c) => {
    try {
      await api.patch(`/admin/coupons/${c.couponId}/toggle`)
      toast.success(c.isActive ? 'Coupon paused' : 'Coupon activated')
      load()
    } catch { toast.error('Toggle failed') }
  }

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete coupon "${c.code}"?`)) return
    try {
      await api.delete(`/admin/coupons/${c.couponId}`)
      toast.success('Coupon deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div style={{ padding: '28px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--admin-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Coupons</h1>
        </div>
        <button
          onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, background: 'var(--admin-primary)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={14} /> New coupon
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
        </div>
      ) : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--admin-muted)' }}>
          <Tag size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No coupons yet.</p>
        </div>
      ) : (
        <div className="surface" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                {['Code', 'Kind', 'Value', 'Min subtotal', 'Uses', 'Expires', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--admin-muted)', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid var(--admin-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.couponId} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', fontFamily: 'monospace', letterSpacing: '0.06em' }}>{c.code}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--admin-muted)' }}>{c.kind}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                    {c.kind === 'PERCENT' ? `${c.value}%` : `$${parseFloat(c.value).toFixed(2)}`}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--admin-muted)' }}>
                    {c.minSubtotal ? `$${parseFloat(c.minSubtotal).toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--admin-muted)' }}>
                    {c.uses}{c.maxUses ? `/${c.maxUses}` : ''}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--admin-muted)' }}>
                    {c.endsAt ? new Date(c.endsAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '3px 9px', borderRadius: 100,
                      color: c.isActive ? '#34d399' : 'var(--muted)',
                      background: c.isActive ? 'rgba(52,211,153,0.1)' : 'var(--glass-bg2)',
                      border: `1px solid ${c.isActive ? 'rgba(52,211,153,0.2)' : 'transparent'}`,
                    }}>
                      {c.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => handleToggle(c)} title={c.isActive ? 'Pause' : 'Activate'}
                        style={{ background: 'none', border: 'none', color: c.isActive ? '#f59e0b' : '#34d399', cursor: 'pointer', display: 'flex', padding: 4 }}>
                        {c.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => openEdit(c)} title="Edit"
                        style={{ background: 'none', border: 'none', color: 'var(--admin-muted)', cursor: 'pointer', display: 'flex', padding: 4, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-muted)'}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(c)} title="Delete"
                        style={{ background: 'none', border: 'none', color: 'var(--admin-muted)', cursor: 'pointer', display: 'flex', padding: 4, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-muted)'}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'create' ? 'New coupon' : `Edit ${modal.code}`}
          form={form} setForm={setForm}
          onSave={handleSave} onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </div>
  )
}
