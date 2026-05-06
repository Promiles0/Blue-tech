import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Reveal } from '../lib/motion'
import ProductCard from '../components/ProductCard'
import api from '../api/axios'

export default function CategoryPage() {
  const { slug }                    = useParams()
  const [category, setCategory]     = useState(null)
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(0)

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => {
        const cats = Array.isArray(data) ? data : []
        const found = cats.find(c => (c.slug ?? c.name?.toLowerCase().replace(/\s+/g, '-')) === slug)
        setCategory(found ?? null)
        return found
      })
      .then(cat => {
        if (!cat) { setLoading(false); return }
        return api.get(`/products/search?categoryId=${cat.categoryId}&page=${page}&size=12`)
      })
      .then(res => {
        if (!res) return
        const data = res.data
        setProducts(data?.content ?? (Array.isArray(data) ? data : []))
        setTotalPages(data?.totalPages ?? 1)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [slug, page])

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container-noir">
        <Link to="/products"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888', marginBottom: 36, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#888'}
        >
          <ArrowLeft size={14} /> All products
        </Link>

        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#7c5cf0', textTransform: 'uppercase', marginBottom: 8 }}>Category</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            {category?.name ?? slug}
          </h1>
          {!loading && (
            <p style={{ fontSize: 13, color: '#555', marginTop: 6 }}>{products.length} product{products.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {loading ? (
          <div className="grid-4">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 12 }} />)}
          </div>
        ) : !category ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#888', marginBottom: 16 }}>Category not found.</p>
            <Link to="/products" style={{ color: '#7c5cf0', fontSize: 14 }}>Browse all products →</Link>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#888', marginBottom: 16 }}>No products in this category yet.</p>
            <Link to="/products" style={{ color: '#7c5cf0', fontSize: 14 }}>Browse all products →</Link>
          </div>
        ) : (
          <div className="grid-4">
            {products.map((p, i) => (
              <Reveal key={p.productId ?? p.id} delay={Math.min(i * 0.04, 0.24)}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            {[...Array(Math.min(totalPages, 10))].map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                style={{ width: 36, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 500, background: i === page ? '#7c5cf0' : '#141414', color: i === page ? '#fff' : '#888', border: `1px solid ${i === page ? '#7c5cf0' : '#2a2a2a'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
