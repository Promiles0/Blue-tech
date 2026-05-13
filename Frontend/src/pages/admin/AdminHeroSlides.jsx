import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, X, GripVertical, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = { imageUrl: '', label: '', altText: '', sortOrder: 0, isActive: true }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    setLoading(true)
    try {
      const { data } = await apiService.admin.heroSlides.getAll()
      setSlides(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load hero slides')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, sortOrder: slides.length })
    setShowForm(true)
  }

  const openEdit = (slide) => {
    setEditingId(slide.slideId)
    setForm({
      imageUrl: slide.imageUrl,
      label: slide.label,
      altText: slide.altText ?? '',
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.imageUrl.trim() || !form.label.trim()) {
      toast.error('Image URL and label are required')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const { data } = await apiService.admin.heroSlides.update(editingId, form)
        setSlides(slides.map(s => s.slideId === editingId ? data : s))
        toast.success('Slide updated')
      } else {
        const { data } = await apiService.admin.heroSlides.create(form)
        setSlides([...slides, data])
        toast.success('Slide created')
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slide')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slide?')) return
    try {
      await apiService.admin.heroSlides.delete(id)
      setSlides(slides.filter(s => s.slideId !== id))
      toast.success('Slide deleted')
    } catch {
      toast.error('Failed to delete slide')
    }
  }

  const handleToggleActive = async (slide) => {
    try {
      const { data } = await apiService.admin.heroSlides.update(slide.slideId, {
        ...slide, isActive: !slide.isActive,
      })
      setSlides(slides.map(s => s.slideId === slide.slideId ? data : s))
    } catch {
      toast.error('Failed to update slide')
    }
  }

  return (
    <div style={{ padding: '32px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--admin-primary)', marginBottom: 4 }}>
            HOMEPAGE
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Hero Slides</h1>
          <p style={{ fontSize: 13, color: 'var(--admin-muted)', marginTop: 4 }}>
            Manage the auto-sliding carousel on the homepage.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--admin-primary)', color: '#fff',
            border: 'none', borderRadius: 10, padding: '10px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Add Slide
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="surface" style={{ marginBottom: 28, padding: 28, borderRadius: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 24 }}>
            {editingId ? 'Edit Slide' : 'New Slide'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Image URL *
              </label>
              <input
                className="admin-input"
                value={form.imageUrl}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Label *
              </label>
              <input
                className="admin-input"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder="Precision Audio"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Alt Text
              </label>
              <input
                className="admin-input"
                value={form.altText}
                onChange={e => setForm({ ...form, altText: e.target.value })}
                placeholder="Describe the image"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Sort Order
              </label>
              <input
                className="admin-input"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: 'var(--admin-primary)', cursor: 'pointer' }}
              />
              <label htmlFor="isActive" style={{ fontSize: 13, color: '#ccc', cursor: 'pointer' }}>Active (visible on homepage)</label>
            </div>
          </div>

          {/* Preview */}
          {form.imageUrl && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 11, color: 'var(--admin-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preview</p>
              <img
                src={form.imageUrl}
                alt={form.altText || form.label}
                style={{ height: 140, width: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--admin-border)' }}
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'var(--admin-primary)', color: '#fff',
                border: 'none', borderRadius: 8, padding: '9px 18px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Slide'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'transparent', color: 'var(--admin-muted)',
                border: '1px solid var(--admin-border)', borderRadius: 8, padding: '9px 18px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Slides list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 80, background: 'var(--admin-card)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="surface" style={{ padding: 48, textAlign: 'center', borderRadius: 14 }}>
          <p style={{ color: 'var(--admin-muted)', marginBottom: 16 }}>No slides yet. Add the first one above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...slides].sort((a, b) => a.sortOrder - b.sortOrder).map(slide => (
            <div
              key={slide.slideId}
              className="surface"
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 18px', borderRadius: 12,
                opacity: slide.isActive ? 1 : 0.5,
              }}
            >
              <GripVertical size={16} style={{ color: 'var(--admin-muted)', flexShrink: 0, cursor: 'grab' }} />

              <img
                src={slide.imageUrl}
                alt={slide.altText || slide.label}
                style={{ width: 60, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--admin-border)' }}
                onError={e => { e.target.style.background = '#222'; e.target.src = '' }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{slide.label}</p>
                <p style={{ fontSize: 12, color: 'var(--admin-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {slide.imageUrl}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                  background: slide.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                  color: slide.isActive ? '#22c55e' : 'var(--admin-muted)',
                  border: `1px solid ${slide.isActive ? 'rgba(34,197,94,0.3)' : 'var(--admin-border)'}`,
                }}>
                  {slide.isActive ? 'Active' : 'Hidden'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>#{slide.sortOrder}</span>

                <button
                  onClick={() => handleToggleActive(slide)}
                  title={slide.isActive ? 'Hide slide' : 'Show slide'}
                  style={{ background: 'none', border: 'none', color: 'var(--admin-muted)', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-muted)'}
                >
                  {slide.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={() => openEdit(slide)}
                  style={{ background: 'none', border: 'none', color: 'var(--admin-muted)', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-muted)'}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(slide.slideId)}
                  style={{ background: 'none', border: 'none', color: 'var(--admin-muted)', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-muted)'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
