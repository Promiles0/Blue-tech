import { useQuery } from '@tanstack/react-query'
import apiService from '../api/service'

// Matches on category *name* rather than a hardcoded id, since categories are
// seeded per-environment. Once an "Interactive Screens" (or similarly named)
// category and its products exist in the catalog, this fills in on its own —
// no code change needed here.
const CATEGORY_MATCH = /interactive.?screens?/i

// Shared by InteractiveScreensModels and InteractiveScreensComparison — both need the
// same category + product list, and identical query keys mean react-query dedupes the
// network call rather than fetching twice.
export function useInteractiveScreensProducts({ size = 12 } = {}) {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiService.categories.getAll()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 1000 * 60 * 5,
  })

  const category = categories.find(c => CATEGORY_MATCH.test(c.name ?? ''))

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['interactive-screens-models', category?.categoryId, size],
    queryFn: async () => {
      const params = new URLSearchParams({ categoryId: String(category.categoryId), size: String(size), sort: 'createdAt,desc' })
      const res = await apiService.products.search(params)
      return res.data?.content ?? (Array.isArray(res.data) ? res.data : [])
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 2,
  })

  return { category, products, isLoading: isLoading && !!category }
}
