import api from "../api/axios";

const unwrapApiData = (payload) => payload?.data ?? payload;

const normalizeProductDetail = (product) => {
  if (!product) return product;

  const primaryImage =
    product.images?.find((image) => image.isPrimary)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    null;

  const stock = Array.isArray(product.variants)
    ? product.variants.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0)
    : 0;

  return {
    id: product.productId ?? product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl ?? primaryImage,
    stock: product.stock ?? stock,
    category: product.category ?? (product.categoryName ? { name: product.categoryName } : null),
    variants: product.variants ?? [],
    images: product.images ?? [],
  };
};

const productService = {
  /**
   * GET /products — supports optional query params: search, category, page, size
   */
  getAll: async ({ search = "", category = "", page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    params.set("page", page);
    params.set("size", size);

    const res = await api.get(`/products?${params.toString()}`);
    const payload = unwrapApiData(res.data);
    // Handle both paginated { content: [] } and plain array responses
    return Array.isArray(payload) ? payload : payload.content ?? payload;
  },

  /**
   * GET /products/:id
   */
  getById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return normalizeProductDetail(unwrapApiData(res.data));
  },

  /**
   * GET /products/categories
   */
  getCategories: async () => {
    const res = await api.get("/products/categories");
    return unwrapApiData(res.data);
  },
};

export default productService;
