import { useState } from 'react'
import { MessageCircle, Mail, Phone, StickyNote, Check } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

// Rwandan numbers are often typed locally (07…); wa.me needs the full 250… form.
function waNumber(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('250')) return digits
  if (digits.startsWith('0')) return `250${digits.slice(1)}`
  if (digits.length === 9) return `250${digits}`
  return digits
}

const linkBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
  border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', textDecoration: 'none', cursor: 'pointer',
}

export function QuoteReplyButtons({ q }) {
  const subject = `Your interactive screen quote — ${q.screenSize} × ${q.quantity}`
  const greeting = `Hello ${q.name},\n\nThank you for your request for ${q.quantity} × ${q.screenSize} interactive screen${q.quantity > 1 ? 's' : ''}${q.organization ? ` for ${q.organization}` : ''}.\n\n`
  const wa = `https://wa.me/${waNumber(q.phone)}?text=${encodeURIComponent(`${greeting}This is Blue-Tech. `)}`
  const mail = `mailto:${q.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${greeting}\n\nBest regards,\nBlue-Tech`)}`
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
      {q.phone && <a href={wa} target="_blank" rel="noreferrer" style={{ ...linkBtn, borderColor: '#25D366', color: '#25D366' }}><MessageCircle size={13} /> WhatsApp</a>}
      {q.email && <a href={mail} style={linkBtn}><Mail size={13} /> Email</a>}
      {q.phone && <a href={`tel:${q.phone}`} style={linkBtn}><Phone size={13} /> Call</a>}
    </div>
  )
}

// Private note only admins see ("sent price 4.2M, follow up Friday").
export function QuoteNote({ q, onSaved }) {
  const [value, setValue] = useState(q.adminNote ?? '')
  const [saving, setSaving] = useState(false)
  const dirty = value !== (q.adminNote ?? '')

  const save = async () => {
    setSaving(true)
    try {
      await apiService.admin.quoteRequests.updateNote(q.quoteRequestId, value.trim())
      toast.success('Note saved')
      onSaved?.()
    } catch {
      toast.error('Could not save the note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <StickyNote size={14} style={{ color: 'var(--admin-muted)', marginTop: 8, flexShrink: 0 }} />
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Private note (only admins see this)"
        rows={value ? 2 : 1}
        maxLength={2000}
        style={{
          flex: 1, resize: 'vertical', fontSize: 12.5, padding: '6px 10px', borderRadius: 7, fontFamily: 'inherit',
          border: '1px solid var(--admin-border)', background: 'var(--glass-border)', color: 'var(--text)', outline: 'none',
        }}
      />
      {dirty && (
        <button onClick={save} disabled={saving} style={{ ...linkBtn, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}>
          <Check size={13} /> {saving ? 'Saving…' : 'Save'}
        </button>
      )}
    </div>
  )
}
