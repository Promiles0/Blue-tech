import { useEffect, useState } from 'react'
import apiService from '../../api/service'
import ProductCard from '../ProductCard'
import { Reveal } from '../../lib/motion'

// "You may also like": same category, closest in price to the product being viewed.
export default function RelatedProducts({ product }) {
  const [items, setItems] = useState([])
  const id = product.productId ?? product.id
  const categoryId = product.categoryId ?? product.category?.id

  useEffect(() => {
    if (!categoryId) return
    let cancelled = false
    const params = new URLSearchParams({ categoryId: String(categoryId), size: '24' })
    apiService.products.search(params)
      .then(({ data }) => {
        if (cancelled) return
        const price = Number(product.price) || 0
        const pool = (data?.content ?? []).filter((p) => (p.productId ?? p.id) !== id)
        pool.sort((a, b) => Math.abs((Number(a.price) || 0) - price) - Math.abs((Number(b.price) || 0) - price))
        setItems(pool.slice(0, 4))
      })
      .catch(() => { if (!cancelled) setItems([]) })
    return () => { cancelled = true }
  }, [id, categoryId, product.price])

  if (items.length === 0) return null

  return (
    <section style={{ marginTop: 72 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>You may also like</h2>
      <div className="grid-4">
        {items.map((p, i) => (
          <Reveal key={p.productId ?? p.id} delay={i * 0.05}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
