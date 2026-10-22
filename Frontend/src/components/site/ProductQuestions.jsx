import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageCircleQuestion } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../lib/i18n'

// Questions and answers on a product page (3d). Customers ask (signed in); the team answers;
// only answered questions are shown.
export default function ProductQuestions({ productId }) {
  const { t, intlLocale } = useT()
  const { user } = useAuth()
  const location = useLocation()
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const { data: items = [] } = useQuery({
    queryKey: ['product-questions', productId],
    queryFn: () => apiService.products.questions(productId).then((r) => r.data ?? []),
    enabled: Boolean(productId),
    staleTime: 5 * 60_000,
  })

  const ask = async (e) => {
    e.preventDefault()
    if (question.trim().length < 5) { toast.error(t('Please write your question (at least a few words)')); return }
    setBusy(true)
    try {
      await apiService.products.ask(productId, question.trim())
      setQuestion(''); setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('Could not send your question'))
    } finally { setBusy(false) }
  }

  const day = (iso) => { try { return new Date(iso).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '' } }

  return (
    <section style={{ marginTop: 48 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <MessageCircleQuestion size={20} style={{ color: 'var(--accent)' }} /> {t('Questions and answers')}
      </h2>

      {items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
          {items.map((q) => (
            <div key={q.id} style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{t('Q:')} {q.question}</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                <strong style={{ color: 'var(--accent)' }}>{t('A:')}</strong> {q.answer}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--muted-dark, var(--muted))' }}>{t('Answered by Blue-Tech · {date}', { date: day(q.answeredAt) })}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 16px' }}>{t('No questions yet. Ask one and our team will answer here.')}</p>
      )}

      {sent ? (
        <p style={{ fontSize: 14, color: 'var(--success, #22c55e)' }}>{t("Thanks — we'll answer soon and let you know")}</p>
      ) : user ? (
        <form onSubmit={ask} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} className="noir-input"
            placeholder={t('Ask about this product, e.g. does it come with a bag?')} style={{ flex: 1, minWidth: 240 }} />
          <button type="submit" disabled={busy} className="noir-btn-primary" style={{ padding: '11px 20px' }}>{busy ? t('Sending…') : t('Ask')}</button>
        </form>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          <Link to="/login" state={{ from: location.pathname }} style={{ color: 'var(--accent)' }}>{t('Sign in')}</Link> {t('to ask a question about this product.')}
        </p>
      )}
    </section>
  )
}
