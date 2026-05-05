import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Trash2, Star, Search } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../api/axios'
import { dateShort } from '../../lib/format'

function fetchReviews(rating) {
  const q = rating ? `?rating=${rating}` : ''
  return api.get(`/admin/reviews${q}`).then(r => r.data)
}

export default function AdminReviews() {
  const qc = useQueryClient()
  const [ratingFilter, setRatingFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data: allReviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews', ratingFilter],
    queryFn: () => fetchReviews(ratingFilter || null),
  })

  const filtered = search
    ? allReviews.filter(r =>
        (r.productName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.comment ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : allReviews

  const toggleHidden = useMutation({
    mutationFn: ({ reviewId, isHidden }) =>
      api.patch(`/admin/reviews/${reviewId}`, { isHidden }).then(r => r.data),
    onSuccess: (_, { isHidden }) => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      toast.success(isHidden ? 'Review hidden' : 'Review visible')
    },
    onError: () => toast.error('Failed to update review'),
  })

  const deleteReview = useMutation({
    mutationFn: reviewId => api.delete(`/admin/reviews/${reviewId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Review deleted') },
    onError: () => toast.error('Failed to delete review'),
  })

  return (
    <div style={{ padding: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Reviews</h1>
          <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>Moderate customer reviews</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product or comment…"
              style={{ ...inputStyle, paddingLeft: 32, width: 220 }}
            />
          </div>
          {/* Rating filter */}
          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={selectStyle}>
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
      ) : !filtered.length ? (
        <div style={{ color: 'var(--admin-muted)', fontSize: 13 }}>No reviews match.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(r => (
            <div key={r.reviewId} className="surface" style={{
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
              opacity: r.hidden ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}>
              {/* Left content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{r.productName ?? '—'}</span>
                  <StarRow rating={r.rating} />
                  {r.hidden && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: 'var(--admin-warning)' }}>
                      hidden
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginBottom: 8 }}>
                  {r.authorName ?? r.authorEmail ?? 'Unknown'} · {dateShort(r.createdAt)}
                </div>
                {r.comment && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>{r.comment}</p>
                )}
              </div>

              {/* Right actions */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => toggleHidden.mutate({ reviewId: r.reviewId, isHidden: !r.hidden })}
                  disabled={toggleHidden.isPending}
                  style={ghostIconBtn}
                  title={r.hidden ? 'Show review' : 'Hide review'}
                >
                  {r.hidden ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  onClick={() => { if (window.confirm('Delete this review?')) deleteReview.mutate(r.reviewId) }}
                  disabled={deleteReview.isPending}
                  style={{ ...ghostIconBtn, color: 'var(--admin-danger)' }}
                  title="Delete review"
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

function StarRow({ rating }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i} size={12}
          fill={i < rating ? 'var(--admin-amber)' : 'none'}
          color={i < rating ? 'var(--admin-amber)' : 'rgba(255,255,255,0.2)'}
        />
      ))}
    </div>
  )
}

const inputStyle = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: '#fff', padding: '7px 12px', fontSize: 13, outline: 'none',
}
const selectStyle = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: '#fff', padding: '7px 12px', fontSize: 13, cursor: 'pointer',
}
const ghostIconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--admin-muted)', padding: '5px', borderRadius: 6, transition: 'color 0.15s',
}
