import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EyeOff, MessageCircleQuestion } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'

// Product questions from customers (3d). Answers appear on the product page, the customer is
// notified, and Blue uses them when answering in the chat.
const FILTERS = [['pending', 'Waiting'], ['answered', 'Answered'], ['hidden', 'Hidden']]
const when = (iso) => { try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return '' } }

export default function AdminQuestions() {
  const [status, setStatus] = useState('pending')
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['admin-questions', status],
    queryFn: () => apiService.admin.questions.getAll(status).then(r => r.data?.data ?? r.data),
  })
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
        <MessageCircleQuestion size={22} style={{ color: 'var(--admin-primary)' }} /> Product questions
      </h1>
      <p style={{ color: 'var(--admin-muted)', fontSize: 13, margin: '4px 0 18px', maxWidth: 640, lineHeight: 1.6 }}>
        Answers show on the product page for everyone, the customer is notified, and Blue uses them in the chat. Hide anything off-topic or rude.
      </p>
      <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 9, border: '1px solid var(--admin-border)', width: 'fit-content', marginBottom: 16 }}>
        {FILTERS.map(([v, label]) => (
          <button key={v} onClick={() => setStatus(v)} style={{ padding: '6px 12px', borderRadius: 7, border: 0, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: status === v ? 'var(--admin-primary)' : 'transparent', color: status === v ? '#fff' : 'var(--text)' }}>{label}</button>
        ))}
      </div>
      <div className="surface" style={{ borderRadius: 14, padding: '4px 20px', maxWidth: 860 }}>
        {isError ? <p style={{ color: 'var(--admin-danger)', fontSize: 13 }}>Failed to load.</p>
          : isLoading ? <p style={{ color: 'var(--admin-muted)', fontSize: 13, padding: '14px 0' }}>Loading…</p>
          : !data.length ? <p style={{ color: 'var(--admin-muted)', fontSize: 13, padding: '14px 0' }}>{status === 'pending' ? 'No questions waiting. 🎉' : 'Nothing here.'}</p>
          : data.map((q, i) => <QuestionRow key={q.id} q={q} first={i === 0} />)}
      </div>
    </div>
  )
}

function QuestionRow({ q, first }) {
  const qc = useQueryClient()
  const [answer, setAnswer] = useState(q.answer ?? '')
  const save = useMutation({
    mutationFn: (body) => apiService.admin.questions.update(q.id, body),
    onSuccess: (res) => { toast.success(res?.data?.message ?? 'Saved'); qc.invalidateQueries({ queryKey: ['admin-questions'] }) },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Could not save'),
  })
  return (
    <div style={{ padding: '16px 0', borderTop: first ? 'none' : '1px solid var(--admin-border)' }}>
      <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginBottom: 4 }}>
        <a href={`/products/${q.productId}`} target="_blank" rel="noreferrer" style={{ color: 'var(--admin-primary)' }}>{q.productName}</a>
        {' · '}{q.askedBy ?? 'Customer'} · {when(q.createdAt)}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{q.question}</div>
      <textarea rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer (shown publicly)"
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => save.mutate({ answer })} disabled={save.isPending || !answer.trim()} style={{ padding: '7px 14px', borderRadius: 8, border: 0, background: 'var(--admin-primary)', color: '#fff', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
          {q.status === 'answered' ? 'Update answer' : 'Answer'}
        </button>
        {q.status !== 'hidden' && (
          <button onClick={() => save.mutate({ status: 'hidden' })} disabled={save.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontSize: 12.5, cursor: 'pointer' }}>
            <EyeOff size={13} /> Hide
          </button>
        )}
        {q.answeredBy && <span style={{ fontSize: 11.5, color: 'var(--admin-muted)', alignSelf: 'center' }}>Answered by {q.answeredBy}</span>}
      </div>
    </div>
  )
}
