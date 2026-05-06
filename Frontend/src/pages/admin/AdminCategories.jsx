import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react'
import apiService from '../../api/service'

const EMPTY = { name: '', description: '' }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)   // null | 'create' | 'edit'
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(null)
  const [error, setError]           = useState(null)
  const [success, setSuccess]       = useState(null)

  const fetchCategories = () => {
    setLoading(true)
    apiService.admin.categories.getAll()
      .then(({ data }) => setCategories(data.data ?? (Array.isArray(data) ? data : [])))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCategories() }, [])

  const openCreate = () => { setForm(EMPTY); setEditing(null); setError(null); setModal('create') }
  const openEdit   = (cat) => { setForm({ name: cat.name ?? cat.categoryName ?? '', description: cat.description ?? '' }); setEditing(cat); setError(null); setModal('edit') }
  const closeModal = () => { setModal(null); setEditing(null); setError(null) }

  const handleSave = async () => {
    setError(null)
    if (!form.name.trim()) { setError('Category name is required.'); return }
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || undefined }
      if (modal === 'create') {
        await apiService.admin.categories.create(payload)
        setSuccess('Category created!')
      } else {
        await apiService.admin.categories.update(editing.categoryId, payload)
        setSuccess('Category updated!')
      }
      closeModal()
      fetchCategories()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name ?? cat.categoryName}"? Products in this category may be affected.`)) return
    setDeleting(cat.categoryId)
    try {
      await apiService.admin.categories.delete(cat.categoryId)
      fetchCategories()
    } catch {
      alert('Failed to delete category — it may still have products assigned to it.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Categories</h1>
          <p style={{ color: '#555', fontSize: 13, marginTop: 3 }}>{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="noir-btn-primary" style={{ gap: 7, fontSize: 13, padding: '10px 18px' }}>
          <Plus size={15} /> Add Category
        </button>
      </div>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 18, fontSize: 13, color: '#22c55e' }}>
          <Check size={14} /> {success}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              {['Name', 'Description', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #141414' }}>
                  {[1, 2, 3].map(j => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>No categories yet. Add your first one!</td></tr>
            ) : categories.map(cat => (
              <tr key={cat.categoryId} style={{ borderBottom: '1px solid #141414', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 16px', fontWeight: 500, color: '#ddd' }}>
                  {cat.name ?? cat.categoryName}
                </td>
                <td style={{ padding: '14px 16px', color: '#555', maxWidth: 400 }}>
                  {cat.description ?? <span style={{ opacity: 0.3 }}>—</span>}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <IconBtn icon={Pencil} onClick={() => openEdit(cat)} title="Edit" />
                    <IconBtn icon={Trash2} onClick={() => handleDelete(cat)} title="Delete" danger loading={deleting === cat.categoryId} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, width: '100%', maxWidth: 440, padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>{modal === 'create' ? 'New Category' : 'Edit Category'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#555'}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', gap: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#ef4444' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#555', fontWeight: 500, marginBottom: 14 }}>
              Name *
              <input className="noir-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" autoFocus />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#555', fontWeight: 500, marginBottom: 28 }}>
              Description
              <textarea className="noir-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description" rows={3} style={{ resize: 'vertical' }} />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={closeModal} className="noir-btn-outline" style={{ padding: '10px 18px', fontSize: 13 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="noir-btn-primary" style={{ padding: '10px 18px', fontSize: 13 }}>
                {saving ? 'Saving…' : modal === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IconBtn({ icon: Icon, onClick, title, danger, loading }) {
  return (
    <button onClick={onClick} disabled={loading} title={title}
      style={{
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: '1px solid #1e1e1e', borderRadius: 6,
        color: danger ? '#ef4444' : '#555', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s, color 0.15s', opacity: loading ? 0.4 : 1,
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = danger ? '#ef4444' : '#3a3a3a'; e.currentTarget.style.color = danger ? '#ef4444' : '#fff' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = danger ? '#ef4444' : '#555' }}
    >
      <Icon size={13} />
    </button>
  )
}
