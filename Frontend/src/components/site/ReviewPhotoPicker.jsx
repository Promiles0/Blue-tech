import { useRef, useState } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useT } from '../../lib/i18n'

const MAX = 3

// Up to three photos for a review. Each is uploaded as soon as it's picked; the parent
// keeps the list of uploaded URLs and sends it with the review.
export default function ReviewPhotoPicker({ photos, onChange, disabled }) {
  const { t } = useT()
  const input = useRef(null)
  const [uploading, setUploading] = useState(0)

  const pick = async (files) => {
    const room = MAX - photos.length - uploading
    const chosen = Array.from(files).slice(0, Math.max(0, room))
    if (!chosen.length) return
    setUploading(n => n + chosen.length)
    const urls = []
    for (const file of chosen) {
      if (file.size > 3 * 1024 * 1024) { toast.error(t('Photo must be 3 MB or smaller')); continue }
      try {
        const form = new FormData()
        form.append('file', file)
        const { data } = await apiService.reviews.uploadPhoto(form)
        if (data?.url) urls.push(data.url)
      } catch (err) {
        toast.error(err?.response?.data?.message ?? t('Could not upload the photo'))
      }
    }
    setUploading(n => n - chosen.length)
    if (urls.length) onChange([...photos, ...urls].slice(0, MAX))
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {photos.map(url => (
        <div key={url} style={{ position: 'relative', width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button type="button" onClick={() => onChange(photos.filter(p => p !== url))} aria-label={t('Remove photo')}
            style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', border: 0, background: 'rgba(0,0,0,.65)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={12} />
          </button>
        </div>
      ))}
      {Array.from({ length: uploading }).map((_, i) => (
        <div key={`up-${i}`} style={{ width: 64, height: 64, borderRadius: 10, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
          <Loader2 size={18} className="animate-spin" />
        </div>
      ))}
      {photos.length + uploading < MAX && (
        <button type="button" disabled={disabled} onClick={() => input.current?.click()}
          style={{ width: 64, height: 64, borderRadius: 10, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 10.5 }}>
          <Camera size={18} /> {t('Add photo')}
        </button>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
        onChange={e => { pick(e.target.files); e.target.value = '' }} />
    </div>
  )
}
