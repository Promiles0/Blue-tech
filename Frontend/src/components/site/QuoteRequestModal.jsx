import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import apiService from '../../api/service'
import { SUPPORT_EMAIL } from '../../lib/helpLinks'

const emptyForm = {
  name: '', email: '', phone: '', organization: '',
  intendedUse: 'classroom', screenSize: '', quantity: 1, notes: '',
}

export default function QuoteRequestModal({ open, onClose, initialSize, sizes = [] }) {
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  // Re-seed the form (screen size pre-filled from whichever size was active on the
  // configurator, everything else reset) every time the modal transitions to open —
  // adjusted during render rather than in an effect, per React's guidance for
  // resetting state in response to a prop change.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setForm({ ...emptyForm, screenSize: initialSize })
      setSubmitted(false)
      setError(null)
    }
  }

  const close = () => { if (!submitting) onClose() }
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Name, email, and phone are required.')
      return
    }
    const quantity = Number(form.quantity)
    if (!Number.isFinite(quantity) || quantity < 1) {
      setError('Quantity must be at least 1.')
      return
    }

    setSubmitting(true)
    try {
      await apiService.quotes.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        organization: form.organization.trim() || null,
        intendedUse: form.intendedUse,
        screenSize: form.screenSize,
        quantity,
        notes: form.notes.trim() || null,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message ?? `Something went wrong. Please try again or email us directly at ${SUPPORT_EMAIL}.`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="quote-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            style={{ position: 'fixed', inset: 0, background: 'var(--overlay-shade-soft)', backdropFilter: 'blur(8px)', zIndex: 400 }}
          />

          <motion.div
            key="quote-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 401, pointerEvents: 'none' }}
          >
            <motion.div
              key="quote-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="quote-modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                position: 'relative', width: 'min(480px, 100%)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
                background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20,
                boxShadow: 'var(--card-shadow)', pointerEvents: 'auto', padding: '32px 28px 28px',
              }}
            >
              <button
                onClick={close}
                aria-label="Close"
                style={{
                  position: 'absolute', top: 14, right: 14, background: 'var(--glass-bg2)', backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)',
                  cursor: 'pointer', transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--border)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'var(--glass-bg2)' }}
              >
                <X size={15} />
              </button>

              {submitted ? (
                <div style={{ textAlign: 'center', padding: '24px 8px 12px' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', background: 'var(--success-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
                  }}>
                    <CheckCircle2 size={26} style={{ color: 'var(--success)' }} />
                  </div>
                  <h3 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
                    Request received
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
                    Thanks — we've received your request and will be in touch shortly.
                  </p>
                  <button onClick={close} className="noir-btn-outline" style={{ fontSize: 13 }}>
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                    Request a quote
                  </p>
                  <h3 id="quote-modal-title" style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>
                    Talk to us about the {form.screenSize || '—'} model
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <Field label="Name" required>
                      <input required value={form.name} onChange={set('name')} style={inputStyle} placeholder="Jane Doe" />
                    </Field>
                    <Field label="Phone" required>
                      <input required type="tel" value={form.phone} onChange={set('phone')} style={inputStyle} placeholder="+1 555 000 0000" />
                    </Field>
                  </div>

                  <Field label="Email" required style={{ marginBottom: 12 }}>
                    <input required type="email" value={form.email} onChange={set('email')} style={inputStyle} placeholder="jane@example.com" />
                  </Field>

                  <Field label="Organization / company" style={{ marginBottom: 12 }}>
                    <input value={form.organization} onChange={set('organization')} style={inputStyle} placeholder="Optional" />
                  </Field>

                  <Field label="Intended use" required style={{ marginBottom: 12 }}>
                    <div role="radiogroup" aria-label="Intended use" style={{ display: 'flex', gap: 8 }}>
                      {[['classroom', 'Classroom'], ['office', 'Office / Business']].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={form.intendedUse === value}
                          onClick={() => setForm(f => ({ ...f, intendedUse: value }))}
                          style={{
                            flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.18s',
                            background: form.intendedUse === value ? 'var(--accent)' : 'transparent',
                            color: form.intendedUse === value ? 'var(--brand-text)' : 'var(--muted)',
                            border: `1px solid ${form.intendedUse === value ? 'var(--accent)' : 'var(--border)'}`,
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Screen size" required style={{ marginBottom: 12 }}>
                    <div role="radiogroup" aria-label="Screen size" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {sizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          role="radio"
                          aria-checked={form.screenSize === size}
                          onClick={() => setForm(f => ({ ...f, screenSize: size }))}
                          style={{
                            padding: '8px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.18s',
                            background: form.screenSize === size ? 'var(--accent)' : 'transparent',
                            color: form.screenSize === size ? 'var(--brand-text)' : 'var(--muted)',
                            border: `1px solid ${form.screenSize === size ? 'var(--accent)' : 'var(--border)'}`,
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Quantity needed" required style={{ marginBottom: 12, maxWidth: 140 }}>
                    <input required type="number" min={1} value={form.quantity} onChange={set('quantity')} style={inputStyle} />
                  </Field>

                  <Field label="Notes" style={{ marginBottom: 18 }}>
                    <textarea
                      value={form.notes}
                      onChange={set('notes')}
                      rows={3}
                      placeholder="Optional — timeline, room details, anything else that helps."
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </Field>

                  {error && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px',
                      borderRadius: 8, background: 'var(--danger-soft)', border: '1px solid var(--danger-border)',
                      color: 'var(--error)', fontSize: 12.5, marginBottom: 14, lineHeight: 1.5,
                    }}>
                      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="noir-btn-cta shine"
                    style={{ width: '100%', padding: '13px', fontSize: 14, opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : 'Request a quote'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const inputStyle = {
  width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)',
  borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 13.5, outline: 'none',
}

function Field({ label, required, children, style }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--error)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}
