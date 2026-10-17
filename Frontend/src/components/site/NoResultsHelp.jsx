import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import apiService from '../../api/service'
import { openLiveChat } from '../../lib/liveChat'

// Same rule CategoryPage uses to match a category without its own slug.
const slugify = (name = '') => name.toLowerCase().replace(/\s+/g, '-')

// Shown under an empty search/listing: hand the query to Blue, or jump to a category.
export default function NoResultsHelp({ query }) {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    apiService.categories.getAll()
      .then(({ data }) => setCategories(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => setCategories([]))
  }, [])

  const ask = query
    ? `I searched for "${query}" and found nothing. What do you have that's close?`
    : 'Help me find the right product.'

  return (
    <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <button onClick={() => openLiveChat(ask, { send: true })} className="noir-btn-primary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '11px 22px' }}>
        <Sparkles size={15} /> Ask Blue to find it
      </button>
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 560 }}>
          {categories.map((c) => (
            <Link key={c.categoryId ?? c.id ?? c.name} to={`/category/${encodeURIComponent(c.slug ?? slugify(c.name))}`} className="budget-chip" style={{ textDecoration: 'none' }}>
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
