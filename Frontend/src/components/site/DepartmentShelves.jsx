import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiService from '../../api/service'
import { getProductImage, handleProductImageError } from '../../lib/productImage'

const COVER_SIZE = 3   // a few newest products, to pick a cover photo for the tile

const categoryName = (c) => c.name ?? c.categoryName
const categoryLink = (c) => `/products?category=${encodeURIComponent(categoryName(c))}`

// One request per category: a cover photo and the product total for its tile.
async function fetchDepartments() {
  const { data } = await apiService.categories.getAll()
  const categories = Array.isArray(data) ? data : []
  const withProducts = await Promise.all(categories.map(async (category) => {
    const params = new URLSearchParams({ categoryId: String(category.categoryId), page: '0', size: String(COVER_SIZE), sort: 'updatedAt,desc' })
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
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
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
    </section>
  )
}
