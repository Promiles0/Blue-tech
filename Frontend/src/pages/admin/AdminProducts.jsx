import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, AlertCircle, Check, UploadCloud, Eye, EyeOff } from 'lucide-react'
import apiService from '../../api/service'
import { getProductImage, handleProductImageError } from '../../lib/productImage'
import { money } from '../../lib/format'
import { templateForCategory } from '../../lib/specTemplates'

const EMPTY_VARIANT = { variantId: null, skuCode: '', sizeOrColor: '', priceAdjustment: '', stockQuantity: 10 }
const EMPTY_IMAGE   = { imageUrl: '', isPrimary: false }
const CONDITIONS = ['New', 'Refurbished', 'Used']
const EMPTY_FORM = {
  name: '', brand: '', modelNumber: '', condition: 'New', categoryId: '', price: '', warranty: '6 months',
  isActive: true, shortDescription: '', description: '', inTheBox: '', adminNotes: '',
  specs: {},        // values for the current category's template fields
  extraSpecs: [],   // [{ key, value }] — anything outside the template
  variants: [{ ...EMPTY_VARIANT }],
  images:   [{ ...EMPTY_IMAGE }],
}

const templateKeys = (categoryName) => new Set((templateForCategory(categoryName)?.fields ?? []).map(f => f.key))

// Split a product's specs into the fields its category's template knows and the rest.
function splitSpecs(specs, categoryName) {
  const keys = templateKeys(categoryName)
  const known = {}
  const extra = []
  for (const [key, value] of Object.entries(specs ?? {})) {
    if (keys.has(key)) known[key] = String(value ?? '')
    else extra.push({ key, value: String(value ?? '') })
  }
  return { specs: known, extraSpecs: extra }
}

function formFromDetail(p, categories) {
  const categoryName = categories.find(c => String(c.categoryId) === String(p.categoryId))?.name ?? p.categoryName
  return {
    name:             p.name ?? '',
    brand:            p.brand ?? '',
    modelNumber:      p.modelNumber ?? '',
    condition:        p.condition ?? '',
    categoryId:       p.categoryId ?? '',
    price:            p.price ?? '',
    warranty:         p.warranty ?? '',
    isActive:         p.isActive !== false,
    shortDescription: p.shortDescription ?? '',
    description:      p.description ?? '',
    inTheBox:         p.inTheBox ?? '',
    adminNotes:       p.adminNotes ?? '',
    ...splitSpecs(p.specs, categoryName),
    variants:    p.variants?.length ? p.variants.map(v => ({
      variantId:       v.variantId ?? null,
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
  const [dragActive, setDragActive] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchProducts = useCallback(() => {
    setLoading(true)
    apiService.admin.products.getAll(page, 12)
      .then(({ data }) => {
        const payload = data.data ?? data
        setProducts(payload.content ?? (Array.isArray(payload) ? payload : []))
        setTotalPages(payload.totalPages ?? 1)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    apiService.categories.getAll().then(({ data }) => setCategories(data.data ?? (Array.isArray(data) ? data : [])))
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
      const { data } = await apiService.admin.products.getOne(product.productId ?? product.id)
      const p = data?.data ?? data
      setForm(formFromDetail(p, categories))
      setEditing(p)
    } catch {
      setError('Failed to load product details.')
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeModal = () => { setModal(null); setEditing(null); setError(null); setFileUploads([]) }

  const addFiles = (files) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (imageFiles.length !== Array.from(files).length) setError('Only image files can be uploaded.')
    setFileUploads(prev => [...prev, ...imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: false,
    }))])
  }

  const uploadSelectedFiles = async () => {
    const uploadedImages = []

    for (const fu of fileUploads) {
      const fd = new FormData()
      fd.append('file', fu.file)
      const { data } = await apiService.admin.products.uploadFile(fd)
      const imageUrl = data?.data ?? data

      if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
        throw new Error(`Upload failed for ${fu.file.name}. The storage service did not return an image URL.`)
      }

      uploadedImages.push({
        imageUrl: imageUrl.trim(),
        isPrimary: fu.isPrimary,
      })
    }

    return uploadedImages
  }

  const handleSave = async () => {
    setError(null)

    if (!form.name.trim())                          { setError('Product name is required.'); return }
    const price = Number(form.price)
    if (form.price === '' || !Number.isFinite(price) || price < 0) { setError('A valid price (RWF) is required.'); return }
    if (price === 0 && form.isActive)               { setError('A product with no price can only be saved as hidden.'); return }
    if (!form.categoryId)                           { setError('Please select a category.'); return }
    if (form.variants.some(v => !v.skuCode.trim())) { setError('All variants must have a SKU code.'); return }
    const skuList = form.variants.map(v => v.skuCode.trim().toLowerCase())
    if (new Set(skuList).size < skuList.length)     { setError('Two variants share the same SKU. Each variant must have a unique SKU.'); return }
    if (form.extraSpecs.some(s => s.value.trim() && !s.key.trim())) { setError('Every extra spec needs a name.'); return }

    setSaving(true)
    try {
      const uploadedImages = await uploadSelectedFiles()
      const images = [
        ...form.images.filter(i => i.imageUrl.trim()).map(i => ({
          imageUrl:  i.imageUrl.trim(),
          isPrimary: i.isPrimary,
        })),
        ...uploadedImages,
      ]

      setForm(f => ({ ...f, images }))

      const specs = {}
      for (const [key, value] of Object.entries(form.specs)) if (String(value).trim()) specs[key] = String(value).trim()
      for (const { key, value } of form.extraSpecs) if (key.trim() && value.trim()) specs[key.trim()] = value.trim()

      const payload = {
        name:             form.name.trim(),
        brand:            form.brand.trim(),
        modelNumber:      form.modelNumber.trim(),
        condition:        form.condition.trim(),
        categoryId:       Number(form.categoryId),
        price,
        warranty:         form.warranty.trim(),
        isActive:         form.isActive,
        shortDescription: form.shortDescription.trim(),
        description:      form.description.trim(),
        inTheBox:         form.inTheBox.trim(),
        adminNotes:       form.adminNotes.trim(),
        specs,
        variants:    form.variants.map(v => ({
          ...(v.variantId != null ? { variantId: v.variantId } : {}),
          skuCode:         v.skuCode.trim(),
          sizeOrColor:     v.sizeOrColor.trim() || undefined,
          priceAdjustment: v.priceAdjustment !== '' ? Number(v.priceAdjustment) : undefined,
          stockQuantity:   Number(v.stockQuantity),
        })),
        images,
      }
      if (modal === 'create') {
        await apiService.admin.products.create(payload)
        setSuccess('Product created!')
      } else {
        const productId = editing.productId ?? editing.id
        await apiService.admin.products.update(productId, payload)
        setSuccess('Product updated!')
      }
      closeModal()
      fetchProducts()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const msg = err?.response?.data?.message ?? ''
      const fieldErrors = err?.response?.data?.data
      if (msg.toLowerCase().includes('sku') || msg.toLowerCase().includes('duplicate key') || msg.toLowerCase().includes('unique constraint')) {
        setError(msg || 'This SKU code already exists. Please use a unique SKU for each variant.')
      } else if (fieldErrors && typeof fieldErrors === 'object') {
        setError(Object.values(fieldErrors).join(' • '))
      } else {
        setError(msg || err?.message || 'Something went wrong.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    const productId = product.productId ?? product.id
    setDeleting(productId)
    try {
      await apiService.admin.products.delete(productId)
      fetchProducts()
    } catch {
      alert('Failed to delete product.')
    } finally {
      setDeleting(null)
    }
  }

  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: value }))
  }
  const categoryName = (id) => categories.find(c => String(c.categoryId) === String(id))?.name ?? ''
  const template = useMemo(() => templateForCategory(categoryName(form.categoryId)), [categories, form.categoryId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Switching category re-sorts the specs: values the new template has a field for stay
  // in their field, everything else moves to "Other specs" — nothing typed is lost.
  const setCategory = (categoryId) => setForm(f => {
    const all = { ...f.specs }
    for (const { key, value } of f.extraSpecs) if (key.trim()) all[key.trim()] = value
    return { ...f, categoryId, ...splitSpecs(all, categoryName(categoryId)) }
  })
  const setSpec = (key, value) => setForm(f => ({ ...f, specs: { ...f.specs, [key]: value } }))
  const setExtraSpec = (i, field, value) => setForm(f => ({
    ...f, extraSpecs: f.extraSpecs.map((row, idx) => idx === i ? { ...row, [field]: value } : row),
  }))
  const addExtraSpec = () => setForm(f => ({ ...f, extraSpecs: [...f.extraSpecs, { key: '', value: '' }] }))
  const removeExtraSpec = (i) => setForm(f => ({ ...f, extraSpecs: f.extraSpecs.filter((_, idx) => idx !== i) }))
  const hasImage = form.images.some(i => i.imageUrl.trim()) || fileUploads.length > 0

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
          <p style={{ color: 'var(--muted-dark)', fontSize: 13, marginTop: 3 }}>{products.length} shown — hidden products are only visible here until you publish them</p>
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
      <div className="surface" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
              {['Product', 'Category', 'Price', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted-dark)', fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-dark)' }}>No products yet. Add your first one!</td></tr>
            ) : products.map(p => (
              <tr key={p.productId ?? p.id} style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--overlay-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: 'var(--card)' }}
                      onError={handleProductImageError}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>{p.name}</span>
                      {(p.brand || p.variants?.[0]?.skuCode) && (
                        <span style={{ fontSize: 11, color: 'var(--muted-dark)' }}>
                          {[p.brand, p.variants?.[0]?.skuCode].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--muted-dark)' }}>{p.categoryName ?? p.category?.name ?? '—'}</td>
                <td style={{ padding: '14px 16px', color: '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap' }}>{money(p.startingPrice ?? p.price ?? 0)}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
                    padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap',
                    color: p.isActive === false ? 'var(--muted-dark)' : '#22c55e',
                    background: p.isActive === false ? 'var(--overlay-hover)' : 'rgba(34,197,94,0.1)',
                  }}>
                    {p.isActive === false ? <EyeOff size={11} /> : <Eye size={11} />}
                    {p.isActive === false ? 'Hidden' : 'Live'}
                  </span>
                </td>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--admin-border)' }}>
            <IconBtn icon={ChevronLeft}  onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} />
            <span style={{ fontSize: 12, color: 'var(--muted-dark)' }}>Page {page + 1} of {totalPages}</span>
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
          <div className="surface" style={{
            width: '100%', maxWidth: 760, padding: '32px', borderRadius: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{modal === 'create' ? 'Add Product' : 'Edit Product'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--muted-dark)', cursor: 'pointer', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}>
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
            <div style={gridStyle}>
              <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
                <span>Name *</span>
                <input className="noir-input" value={form.name} onChange={setField('name')} placeholder="e.g. HP PROBOOK 450G9 I5" />
              </label>
              <label style={labelStyle}>
                <span>Category *</span>
                <select className="noir-input" value={form.categoryId} onChange={e => setCategory(e.target.value)}
                  style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                  <option value="">— select —</option>
                  {categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name ?? c.categoryName}</option>
                  ))}
                </select>
              </label>
              <label style={labelStyle}>
                <span>Price (RWF) *</span>
                <input className="noir-input" type="number" min="0" step="1" value={form.price}
                  onChange={setField('price')} placeholder="e.g. 1200000" />
              </label>
              <label style={labelStyle}>
                <span>Brand</span>
                <input className="noir-input" value={form.brand} onChange={setField('brand')} placeholder="e.g. HP" />
              </label>
              <label style={labelStyle}>
                <span>Model number</span>
                <input className="noir-input" value={form.modelNumber} onChange={setField('modelNumber')} placeholder="e.g. ProBook 450 G9" />
              </label>
              <label style={labelStyle}>
                <span>Condition</span>
                <select className="noir-input" value={form.condition} onChange={setField('condition')}
                  style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                  <option value="">— not set —</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  {form.condition && !CONDITIONS.includes(form.condition) && <option value={form.condition}>{form.condition}</option>}
                </select>
              </label>
              <label style={labelStyle}>
                <span>Warranty</span>
                <input className="noir-input" value={form.warranty} onChange={setField('warranty')} placeholder="e.g. 6 months" />
              </label>
            </div>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, margin: '4px 0 24px', padding: '12px 14px',
              border: '1px solid var(--admin-border)', borderRadius: 8, cursor: 'pointer',
            }}>
              <input type="checkbox" checked={form.isActive} onChange={setField('isActive')} style={{ marginTop: 2 }} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Visible in the shop</span>
                <span style={{ fontSize: 12, color: 'var(--muted-dark)' }}>
                  {form.isActive
                    ? (hasImage ? 'Customers can see and buy this product.' : 'Customers will see this product without a photo — add one below first.')
                    : 'Hidden: only admins can see it. Publish once photos and details are ready.'}
                </span>
              </span>
            </label>

            {/* Descriptions */}
            <SectionLabel>Descriptions</SectionLabel>
            <label style={{ ...labelStyle, marginBottom: 12 }}>
              <span>Short description — shown at the top of the product page</span>
              <textarea className="noir-input" value={form.shortDescription} onChange={setField('shortDescription')}
                placeholder="One line, e.g. HP ProBook 450 G9 with Intel Core i5, 8GB RAM, 512GB SSD." rows={2} style={{ resize: 'vertical' }} />
            </label>
            <label style={{ ...labelStyle, marginBottom: 12 }}>
              <span>Full description</span>
              <textarea className="noir-input" value={form.description} onChange={setField('description')}
                placeholder="What it is, who it's for, the key features." rows={4} style={{ resize: 'vertical' }} />
            </label>
            <label style={{ ...labelStyle, marginBottom: 24 }}>
              <span>What's in the box</span>
              <input className="noir-input" value={form.inTheBox} onChange={setField('inTheBox')} placeholder="e.g. Laptop, AC adapter, power cord" />
            </label>

            {/* Specifications — fields depend on the category */}
            <SectionLabel>
              Specifications{template ? '' : ' — pick a category to see its fields'}
              <button onClick={addExtraSpec} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Add other spec
              </button>
            </SectionLabel>
            {template && (
              <div style={gridStyle}>
                {template.fields.map(field => (
                  <label key={field.key} style={{ ...labelStyle, ...(field.wide ? { gridColumn: '1 / -1' } : {}) }}>
                    <span>{field.label}</span>
                    <input className="noir-input" value={form.specs[field.key] ?? ''} placeholder={field.placeholder}
                      list={field.options ? `spec-options-${field.key}` : undefined}
                      onChange={e => setSpec(field.key, e.target.value)} />
                    {field.options && (
                      <datalist id={`spec-options-${field.key}`}>
                        {field.options.map(o => <option key={o} value={o} />)}
                      </datalist>
                    )}
                  </label>
                ))}
              </div>
            )}
            {form.extraSpecs.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input className="noir-input" value={row.key} onChange={e => setExtraSpec(i, 'key', e.target.value)} placeholder="Spec name, e.g. colour" />
                <input className="noir-input" value={row.value} onChange={e => setExtraSpec(i, 'value', e.target.value)} placeholder="Value" />
                <button onClick={() => removeExtraSpec(i)}
                  style={{ background: 'none', border: '1px solid var(--admin-border)', borderRadius: 6, color: 'var(--muted-dark)', cursor: 'pointer', padding: '9px', display: 'flex', alignItems: 'center' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            <div style={{ height: 16 }} />

            {/* Variants */}
            <SectionLabel>
              SKU & stock
              <button onClick={addVariant} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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
                  {i === 0 && <span>Variant</span>}
                  <input className="noir-input" value={v.sizeOrColor} onChange={e => setVariant(i, 'sizeOrColor', e.target.value)} placeholder="e.g. Default, Black" />
                </label>
                <label style={labelStyle}>
                  {i === 0 && <span>Price adj. (RWF)</span>}
                  <input className="noir-input" type="number" step="1" value={v.priceAdjustment} onChange={e => setVariant(i, 'priceAdjustment', e.target.value)} placeholder="0" />
                </label>
                <label style={labelStyle}>
                  {i === 0 && <span>Stock</span>}
                  <input className="noir-input" type="number" min="0" value={v.stockQuantity} onChange={e => setVariant(i, 'stockQuantity', e.target.value)} placeholder="0" />
                </label>
                <div style={{ paddingBottom: 0 }}>
                  {i === 0 && <div style={{ height: 20 }} />}
                  <button onClick={() => removeVariant(i)} disabled={form.variants.length === 1}
                    style={{ background: 'none', border: '1px solid var(--admin-border)', borderRadius: 6, color: 'var(--muted-dark)', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', opacity: form.variants.length === 1 ? 0.3 : 1 }}>
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}

            {/* Images */}
            <SectionLabel style={{ marginTop: 20 }}>
              Images
              <button onClick={addImage} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Add URL
              </button>
            </SectionLabel>
            {form.images.map((img, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input className="noir-input" value={img.imageUrl} onChange={e => setImage(i, 'imageUrl', e.target.value)} placeholder="https://..." />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-dark)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                  <input type="checkbox" checked={img.isPrimary} onChange={e => setImage(i, 'isPrimary', e.target.checked)} />
                  Primary
                </label>
                <button onClick={() => removeImage(i)}
                  style={{ background: 'none', border: '1px solid var(--admin-border)', borderRadius: 6, color: 'var(--muted-dark)', cursor: 'pointer', padding: '9px', display: 'flex', alignItems: 'center' }}>
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* File uploads */}
            <div
              onDragEnter={e => { e.preventDefault(); setDragActive(true) }}
              onDragOver={e => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={e => { e.preventDefault(); setDragActive(false) }}
              onDrop={e => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files) }}
              style={{
                marginTop: 10, marginBottom: 10, padding: '22px 16px', textAlign: 'center',
                border: `1px dashed ${dragActive ? 'var(--accent)' : 'var(--accent-border)'}`,
                borderRadius: 8, background: dragActive ? 'var(--accent-dim2)' : 'transparent',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <UploadCloud size={20} color="var(--accent)" />
              <p style={{ margin: '8px 0 4px', fontSize: 12, color: 'var(--text)' }}>Drop images here</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-dark)' }}>or choose files from your computer</p>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: 'var(--accent)', cursor: 'pointer', border: '1px solid #3a2a6a', borderRadius: 6, padding: '7px 12px' }}>
                <Plus size={12} /> Choose images
                <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={e => { addFiles(e.target.files); e.target.value = '' }}
                />
              </label>
            </div>
            {fileUploads.map((fu, i) => (
              <div key={`${fu.file.name}-${i}`} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <img src={fu.preview} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 5, border: '1px solid var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fu.file.name}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-dark)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                  <input type="checkbox" checked={fu.isPrimary}
                    onChange={e => setFileUploads(prev => prev.map((f, idx) => idx === i ? { ...f, isPrimary: e.target.checked } : f))} />
                  Primary
                </label>
                <button onClick={() => setFileUploads(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: '1px solid var(--admin-border)', borderRadius: 6, color: 'var(--muted-dark)', cursor: 'pointer', padding: '9px', display: 'flex', alignItems: 'center' }}>
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Internal notes */}
            <SectionLabel style={{ marginTop: 20 }}>Internal notes</SectionLabel>
            <label style={{ ...labelStyle, marginBottom: 4 }}>
              <span>Only admins see this — e.g. details still to confirm with the supplier</span>
              <textarea className="noir-input" value={form.adminNotes} onChange={setField('adminNotes')}
                rows={2} style={{ resize: 'vertical' }} />
            </label>

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
    <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted-dark)', textTransform: 'uppercase', marginBottom: 10, ...style }}>
      {children}
    </div>
  )
}

const gridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12, marginBottom: 12,
}

const labelStyle = {
  display: 'flex', flexDirection: 'column', gap: 5,
  fontSize: 12, color: 'var(--muted-dark)', fontWeight: 500,
}

function IconBtn({ icon: Icon, onClick, title, danger, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={title}
      style={{
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: '1px solid var(--admin-border)', borderRadius: 6,
        color: danger ? '#ef4444' : 'var(--muted-dark)', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s, color 0.15s',
        opacity: disabled || loading ? 0.4 : 1,
      }}
      onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.borderColor = danger ? '#ef4444' : 'var(--border-hover)'; e.currentTarget.style.color = danger ? '#ef4444' : 'var(--text)' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.color = danger ? '#ef4444' : 'var(--muted-dark)' }}
    >
      <Icon size={13} />
    </button>
  )
}
