import api from "../api/axios";

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
    // Handle both paginated { content: [] } and plain array responses
    return Array.isArray(res.data) ? res.data : res.data.content ?? res.data;
  },

  /**
   * GET /products/:id
   */
  getById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  /**
   * GET /products/categories
   */
  getCategories: async () => {
    const res = await api.get("/products/categories");
    return res.data;
  },
};

export default productService;