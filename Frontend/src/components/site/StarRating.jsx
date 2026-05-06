import { useState } from 'react'
import { Star } from 'lucide-react'

export function StarDisplay({ rating, size = 13 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          color="#f59e0b"
        />
      ))}
    </div>
  )
}

export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', transition: 'transform 0.15s' }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Star
            size={22}
            fill={i <= (hover || value) ? '#f59e0b' : 'none'}
            color={i <= (hover || value) ? '#f59e0b' : '#444'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}
