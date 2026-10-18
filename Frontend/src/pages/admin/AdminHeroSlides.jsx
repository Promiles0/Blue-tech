import { useState, useEffect } from 'react'
import { PROMO_SLIDES } from '../../lib/promoSlides'
import { Plus, Trash2, Edit3, Save, X, GripVertical, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = { imageUrl: '', label: '', subtitle: '', link: '/products', altText: '', sortOrder: 0, isActive: true }
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [form, setForm] = useState(emptyForm)


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

  useEffect(() => {
    fetchSlides()
  }, [])

  // Upload a banner image (same storage as product photos) and use its URL.
  const uploadImage = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await apiService.admin.products.uploadFile(fd)
      setForm(f => ({ ...f, imageUrl: data?.data ?? data }))
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Upload failed')
    } finally { setUploading(false) }
  }

  // One-time: copy the 6 built-in home slides (images included) so they can be edited here.
  const importBuiltIn = async () => {
    setImporting(true)
    try {
      const created = []
      for (const [i, slide] of PROMO_SLIDES.entries()) {
        let imageUrl = ''
        if (slide.image) {
          const blob = await fetch(slide.image).then(r => r.blob())
          const fd = new FormData()
          fd.append('file', new File([blob], `${slide.slug}.jpeg`, { type: blob.type || 'image/jpeg' }))
          const { data } = await apiService.admin.products.uploadFile(fd)
          imageUrl = data?.data ?? data
        }
        if (!imageUrl) continue
        const { data } = await apiService.admin.heroSlides.create({
          imageUrl, label: slide.title, subtitle: slide.subtitle, link: slide.to ?? `/promotions/${slide.slug}`,
          altText: slide.title, sortOrder: i, isActive: true,
        })
        created.push(data)
      }
      setSlides(created)
      toast.success(`${created.length} slides copied — they now drive the home page`)
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Copy failed')
    } finally { setImporting(false) }
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
      subtitle: slide.subtitle ?? '',
      link: slide.link ?? '/products',
      altText: slide.altText ?? '',
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.imageUrl.trim() || !form.label.trim()) {
      toast.error('An image and a headline are required')
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
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>Home banners</h1>
          <p style={{ fontSize: 13, color: 'var(--admin-muted)', marginTop: 4 }}>
            The sliding banners at the top of the home page. {slides.length === 0 && 'None added yet, so the site shows its 6 built-in banners.'}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--admin-primary)', color: 'var(--admin-primary-fg)',
            border: 'none', borderRadius: 10, padding: '10px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Add banner
        </button>
      </div>

      {slides.length === 0 && !showForm && (
        <div className="surface" style={{ marginBottom: 24, padding: 20, borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0, maxWidth: 560 }}>
            Want to edit the banners customers see now? Copy them here first — images included — then change the text, links or order, or delete the ones you don't offer.
          </p>
          <button onClick={importBuiltIn} disabled={importing} style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            {importing ? 'Copying…' : 'Copy the current home banners here'}
          </button>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="surface" style={{ marginBottom: 28, padding: 28, borderRadius: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>
            {editingId ? 'Edit Slide' : 'New Slide'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Image *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="noir-input"
                  value={form.imageUrl}
                  onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="Upload a wide image (about 1600 × 400) or paste its URL"
                />
                <label style={{ padding: '0 14px', display: 'flex', alignItems: 'center', borderRadius: 10, border: '1px solid var(--admin-border)', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
                  {uploading ? 'Uploading…' : 'Upload'}
                  <input type="file" accept="image/*" hidden onChange={e => uploadImage(e.target.files?.[0])} />
                </label>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Headline *
              </label>
              <input
                className="noir-input"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder="Back to class, sorted."
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Subtitle
              </label>
              <input
                className="noir-input"
                value={form.subtitle}
                onChange={e => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Laptops for every budget"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Opens page
              </label>
              <input
                className="noir-input"
                list="banner-links"
                value={form.link}
                onChange={e => setForm({ ...form, link: e.target.value })}
                placeholder="/products?category=Laptops"
              />
              <datalist id="banner-links">
                {['/products', '/products?category=Laptops', '/products?category=Desktops', '/interactive-screens', '/promotions/student-deals', '/promotions/trade-in', '/promotions/business-laptops', '/promotions/gaming-builds', '/promotions/care-plans', '/help?v=shipping'].map(l => <option key={l} value={l} />)}
              </datalist>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Alt Text
              </label>
              <input
                className="noir-input"
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
                className="noir-input"
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
              <label htmlFor="isActive" style={{ fontSize: 13, color: 'var(--text)', opacity: 0.85, cursor: 'pointer' }}>Active (visible on homepage)</label>
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
                background: 'var(--admin-primary)', color: 'var(--admin-primary-fg)',
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
                onError={e => { e.target.style.background = 'var(--border)'; e.target.src = '' }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{slide.label}</p>
                <p style={{ fontSize: 12, color: 'var(--admin-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {slide.imageUrl}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                  background: slide.isActive ? 'rgba(34,197,94,0.12)' : 'var(--glass-border)',
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
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-muted)'}
                >
                  {slide.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={() => openEdit(slide)}
                  style={{ background: 'none', border: 'none', color: 'var(--admin-muted)', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
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
