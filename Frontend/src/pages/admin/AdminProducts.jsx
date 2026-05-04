import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, AlertCircle, Check } from 'lucide-react'
import api from '../../api/axios'

const EMPTY_VARIANT = { skuCode: '', sizeOrColor: '', priceAdjustment: '', stockQuantity: 0 }
const EMPTY_IMAGE   = { imageUrl: '', isPrimary: false }
const EMPTY_FORM = {
  name: '', description: '', price: '', categoryId: '',
  variants: [{ ...EMPTY_VARIANT }],
  images:   [{ ...EMPTY_IMAGE }],
}

function formFromDetail(p) {
  return {
    name:        p.name ?? '',
    description: p.description ?? '',
    price:       p.price ?? '',
    categoryId:  p.categoryId ?? '',
    variants:    p.variants?.length ? p.variants.map(v => ({
      skuCode:         v.skuCode ?? '',
      sizeOrColor:     v.sizeOrColor ?? '',
      priceAdjustment: v.priceAdjustment ?? '',
      stockQuantity:   v.stockQuantity ?? 0,
    })) : [{ ...EMPTY_VARIANT }],
    images: p.images?.length ? p.images.map(i => ({
      imageUrl:  i.imageUrl ?? '',
      isPrimary: i.isPrimary ?? false,
    })) : [{ ...EMPTY_IMAGE }],
  }
}

export default function AdminProducts() {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)   // null | 'create' | 'edit'
  const [editing, setEditing]       = useState(null)   // product being edited
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(null)
  const [error, setError]           = useState(null)
  const [success, setSuccess]       = useState(null)
  const [fileUploads, setFileUploads] = useState([]) // [{file, isPrimary}]
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchProducts = useCallback(() => {
    setLoading(true)
    api.get(`/products?page=${page}&size=12`)
      .then(({ data }) => {
        const payload = data.data ?? data
        setProducts(payload.content ?? payload)
        setTotalPages(payload.totalPages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data ?? data))
  }, [])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFileUploads([])
    setEditing(null)
    setError(null)
    setModal('create')
  }

  const openEdit = async (product) => {
    setError(null)
    setFileUploads([])
    setForm(EMPTY_FORM)
    setEditing({ productId: product.productId ?? product.id, name: product.name })
    setModal('edit')
    setLoadingDetail(true)
    try {
      const { data } = await api.get(`/products/${product.productId ?? product.id}`)
      const p = data?.data ?? data
      setForm(formFromDetail(p))
      setEditing(p)
    } catch {
      setError('Failed to load product details.')
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeModal = () => { setModal(null); setEditing(null); setError(null); setFileUploads([]) }

  const handleSave = async () => {
    setError(null)

    if (!form.name.trim())                          { setError('Product name is required.'); return }
    if (!form.price || Number(form.price) <= 0)     { setError('A valid base price is required.'); return }
    if (!form.categoryId)                           { setError('Please select a category.'); return }
    if (form.variants.some(v => !v.skuCode.trim())) { setError('All variants must have a SKU code.'); return }

    setSaving(true)
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim() || undefined,
        price:       Number(form.price),
        categoryId:  Number(form.categoryId),
        variants:    form.variants.map(v => ({
          skuCode:         v.skuCode.trim(),
          sizeOrColor:     v.sizeOrColor.trim() || undefined,
          priceAdjustment: v.priceAdjustment !== '' ? Number(v.priceAdjustment) : undefined,
          stockQuantity:   Number(v.stockQuantity),
        })),
        images: form.images.filter(i => i.imageUrl.trim()).map(i => ({
          imageUrl:  i.imageUrl.trim(),
          isPrimary: i.isPrimary,
        })),
      }
      let productId
      if (modal === 'create') {
        const { data } = await api.post('/products', payload)
        productId = (data?.data ?? data).productId
        setSuccess('Product created!')
      } else {
        productId = editing.productId ?? editing.id
        await api.put(`/products/${productId}`, payload)
        setSuccess('Product updated!')
      }
      for (const fu of fileUploads) {
        const fd = new FormData()
        fd.append('file', fu.file)
        fd.append('isPrimary', fu.isPrimary)
        await api.post(`/products/${productId}/images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      closeModal()
      fetchProducts()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const fieldErrors = err?.response?.data?.data
      if (fieldErrors && typeof fieldErrors === 'object') {
        setError(Object.values(fieldErrors).join(' • '))
      } else {
        setError(err?.response?.data?.message ?? 'Something went wrong.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setDeleting(product.productId ?? product.id)
    try {
      await api.delete(`/products/${product.productId ?? product.id}`)
      fetchProducts()
    } catch {
      alert('Failed to delete product.')
    } finally {
      setDeleting(null)
    }
  }

  const setVariant = (i, field, val) => setForm(f => ({
    ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, [field]: val } : v)
  }))
  const setImage = (i, field, val) => setForm(f => ({
    ...f, images: f.images.map((img, idx) => idx === i ? { ...img, [field]: val } : img)
  }))
  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { ...EMPTY_VARIANT }] }))
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }))
  const addImage = () => setForm(f => ({ ...f, images: [...f.images, { ...EMPTY_IMAGE }] }))
  const removeImage = (i) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Products</h1>
          <p style={{ color: '#555', fontSize: 13, marginTop: 3 }}>{products.length} shown — manage your catalog</p>
        </div>
        <button onClick={openCreate} className="noir-btn-primary" style={{ gap: 7, fontSize: 13, padding: '10px 18px' }}>
          <Plus size={15} /> Add Product
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
              {['Product', 'Category', 'Price', 'Variants', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #141414' }}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>No products yet. Add your first one!</td></tr>
            ) : products.map(p => (
              <tr key={p.productId ?? p.id} style={{ borderBottom: '1px solid #141414', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {p.images?.[0]?.imageUrl && (
                      <img src={p.images[0].imageUrl} alt=""
                        style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: '#1c1c1c' }}
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    )}
                    <span style={{ fontWeight: 500, color: '#ddd' }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', color: '#555' }}>{p.category?.name ?? p.categoryName ?? '—'}</td>
                <td style={{ padding: '14px 16px', color: '#f59e0b', fontWeight: 600 }}>${Number(p.price).toFixed(2)}</td>
                <td style={{ padding: '14px 16px', color: '#555' }}>{p.variants?.length ?? 0}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <IconBtn icon={Pencil} onClick={() => openEdit(p)} title="Edit" />
                    <IconBtn icon={Trash2} onClick={() => handleDelete(p)} title="Delete" danger loading={deleting === (p.productId ?? p.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid #1a1a1a' }}>
            <IconBtn icon={ChevronLeft}  onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} />
            <span style={{ fontSize: 12, color: '#555' }}>Page {page + 1} of {totalPages}</span>
            <IconBtn icon={ChevronRight} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} />
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '40px 20px', zIndex: 100, overflowY: 'auto',
        }}>
          <div style={{
            background: '#111', border: '1px solid #1e1e1e', borderRadius: 16,
            width: '100%', maxWidth: 680, padding: '32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{modal === 'create' ? 'Add Product' : 'Edit Product'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#555'}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', gap: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#ef4444' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}

            {loadingDetail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 38, borderRadius: 8 }} />)}
              </div>
            )}

            {/* Basic Info */}
            <SectionLabel>Basic Info</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label style={labelStyle}>
                <span>Name *</span>
                <input className="noir-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" />
              </label>
              <label style={labelStyle}>
                <span>Category *</span>
                <select className="noir-input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  style={{ background: 'var(--surface)', color: '#fff' }}>
                  <option value="">— select —</option>
                  {categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name ?? c.categoryName}</option>
                  ))}
                </select>
              </label>
            </div>
            <label style={{ ...labelStyle, marginBottom: 12 }}>
              <span>Description</span>
              <textarea className="noir-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description" rows={3} style={{ resize: 'vertical' }} />
            </label>
            <label style={{ ...labelStyle, maxWidth: 200, marginBottom: 24 }}>
              <span>Base Price ($) *</span>
              <input className="noir-input" type="number" min="0" step="0.01" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
            </label>

            {/* Variants */}
            <SectionLabel>
              Variants
              <button onClick={addVariant} style={{ marginLeft: 'auto', fontSize: 11, color: '#7c5cf0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Add variant
              </button>
            </SectionLabel>
            {form.variants.map((v, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                <label style={labelStyle}>
                  {i === 0 && <span>SKU *</span>}
                  <input className="noir-input" value={v.skuCode} onChange={e => setVariant(i, 'skuCode', e.target.value)} placeholder="SKU-001" />
                </label>
                <label style={labelStyle}>
                  {i === 0 && <span>Size / Color</span>}
                  <input className="noir-input" value={v.sizeOrColor} onChange={e => setVariant(i, 'sizeOrColor', e.target.value)} placeholder="e.g. Black, XL" />
                </label>
                <label style={labelStyle}>
                  {i === 0 && <span>Price adj.</span>}
                  <input className="noir-input" type="number" step="0.01" value={v.priceAdjustment} onChange={e => setVariant(i, 'priceAdjustment', e.target.value)} placeholder="0.00" />
                </label>
                <label style={labelStyle}>
                  {i === 0 && <span>Stock</span>}
                  <input className="noir-input" type="number" min="0" value={v.stockQuantity} onChange={e => setVariant(i, 'stockQuantity', e.target.value)} placeholder="0" />
                </label>
                <div style={{ paddingBottom: 0 }}>
                  {i === 0 && <div style={{ height: 20 }} />}
                  <button onClick={() => removeVariant(i)} disabled={form.variants.length === 1}
                    style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 6, color: '#555', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', opacity: form.variants.length === 1 ? 0.3 : 1 }}>
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}

            {/* Images */}
            <SectionLabel style={{ marginTop: 20 }}>
              Images (URLs)
              <button onClick={addImage} style={{ marginLeft: 'auto', fontSize: 11, color: '#7c5cf0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Add URL
              </button>
            </SectionLabel>
            {form.images.map((img, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input className="noir-input" value={img.imageUrl} onChange={e => setImage(i, 'imageUrl', e.target.value)} placeholder="https://..." />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                  <input type="checkbox" checked={img.isPrimary} onChange={e => setImage(i, 'isPrimary', e.target.checked)} />
                  Primary
                </label>
                <button onClick={() => removeImage(i)}
                  style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 6, color: '#555', cursor: 'pointer', padding: '9px', display: 'flex', alignItems: 'center' }}>
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* File uploads */}
            <div style={{ marginTop: 10, marginBottom: 4 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7c5cf0', cursor: 'pointer', border: '1px dashed #3a2a6a', borderRadius: 6, padding: '7px 12px' }}>
                <Plus size={12} /> Upload from computer
                <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={e => {
                    const files = Array.from(e.target.files)
                    setFileUploads(prev => [...prev, ...files.map(f => ({ file: f, isPrimary: false }))])
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {fileUploads.map((fu, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fu.file.name}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                  <input type="checkbox" checked={fu.isPrimary}
                    onChange={e => setFileUploads(prev => prev.map((f, idx) => idx === i ? { ...f, isPrimary: e.target.checked } : f))} />
                  Primary
                </label>
                <button onClick={() => setFileUploads(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 6, color: '#555', cursor: 'pointer', padding: '9px', display: 'flex', alignItems: 'center' }}>
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28 }}>
              <button onClick={closeModal} className="noir-btn-outline" style={{ padding: '11px 20px', fontSize: 13 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="noir-btn-primary" style={{ padding: '11px 20px', fontSize: 13 }}>
                {saving ? 'Saving…' : modal === 'create' ? 'Create Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#444', textTransform: 'uppercase', marginBottom: 10, ...style }}>
      {children}
    </div>
  )
}

const labelStyle = {
  display: 'flex', flexDirection: 'column', gap: 5,
  fontSize: 12, color: '#555', fontWeight: 500,
}

function IconBtn({ icon: Icon, onClick, title, danger, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={title}
      style={{
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: '1px solid #1e1e1e', borderRadius: 6,
        color: danger ? '#ef4444' : '#555', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s, color 0.15s',
        opacity: disabled || loading ? 0.4 : 1,
      }}
      onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.borderColor = danger ? '#ef4444' : '#3a3a3a'; e.currentTarget.style.color = danger ? '#ef4444' : '#fff' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = danger ? '#ef4444' : '#555' }}
    >
      <Icon size={13} />
    </button>
  )
}
