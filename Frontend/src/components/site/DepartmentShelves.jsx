import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '../ProductCard'
import apiService from '../../api/service'
import { getProductImage, handleProductImageError } from '../../lib/productImage'
import { Reveal } from '../../lib/motion'

const SHELF_SIZE = 10   // products per shelf
const MAX_SHELVES = 4   // the biggest departments get a shelf; every department gets a tile

const categoryName = (c) => c.name ?? c.categoryName
const categoryLink = (c) => `/products?category=${encodeURIComponent(categoryName(c))}`

// One request per category: the newest products for its shelf, plus the total for its tile.
async function fetchDepartments() {
  const { data } = await apiService.categories.getAll()
  const categories = Array.isArray(data) ? data : []
  const withProducts = await Promise.all(categories.map(async (category) => {
    const params = new URLSearchParams({ categoryId: String(category.categoryId), page: '0', size: String(SHELF_SIZE), sort: 'updatedAt,desc' })
    try {
      const { data: page } = await apiService.products.getAllPaginated(params)
      const products = page?.content ?? []
      return { category, products, total: page?.totalElements ?? products.length }
    } catch {
      return { category, products: [], total: 0 }
    }
  }))
  return withProducts.filter(d => d.total > 0).sort((a, b) => b.total - a.total)
}

function DepartmentTile({ department }) {
  const { category, products, total } = department
  const cover = products.find(p => getProductImage(p))
  return (
    <Link to={categoryLink(category)} className="dept-tile">
      <div className="dept-tile-img">
        {cover && <img src={getProductImage(cover)} alt="" loading="lazy" onError={handleProductImageError} />}
      </div>
      <div className="dept-tile-text">
        <span className="dept-tile-name">{categoryName(category)}</span>
        <span className="dept-tile-count">{total} {total === 1 ? 'product' : 'products'}</span>
      </div>
    </Link>
  )
}

function Shelf({ department }) {
  const trackRef = useRef(null)
  const { category, products, total } = department
  const scroll = (dir) => {
    const el = trackRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <Reveal>
      <div className="shelf">
        <div className="shelf-head">
          <h2 className="shelf-title">{categoryName(category)}</h2>
          <div className="shelf-actions">
            <Link to={categoryLink(category)} className="shelf-all">
              See all {total} <ArrowRight size={13} />
            </Link>
            <button type="button" className="shelf-arrow" onClick={() => scroll(-1)} aria-label={`Scroll ${categoryName(category)} left`}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="shelf-arrow" onClick={() => scroll(1)} aria-label={`Scroll ${categoryName(category)} right`}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="shelf-track" ref={trackRef}>
          {products.map(p => (
            <div className="shelf-item" key={p.productId ?? p.id}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  )
}

export default function DepartmentShelves() {
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['home-departments'],
    queryFn: fetchDepartments,
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return (
      <section className="container-noir dept-section">
        <div className="dept-grid">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 132, borderRadius: 12 }} />)}
        </div>
      </section>
    )
  }
  if (!departments.length) return null

  return (
    <section className="container-noir dept-section">
      <div className="dept-grid">
        {departments.map(d => <DepartmentTile key={d.category.categoryId} department={d} />)}
      </div>
      {departments.slice(0, MAX_SHELVES).map(d => <Shelf key={d.category.categoryId} department={d} />)}
    </section>
  )
}
