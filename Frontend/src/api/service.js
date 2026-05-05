import api from './axios';

const apiService = {
  // --- AUTH ---
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    changePassword: (data) => api.put('/users/password', data),
  },

  // --- PRODUCTS ---
  products: {
    getAll: () => api.get('/products'),
    getAllPaginated: (params) => api.get(`/products?${params}`),
    search: (params) => api.get(`/products/search?${params}`),
    getOne: (id) => api.get(`/products/${id}`),
  },

  // --- CATEGORIES ---
  categories: {
    getAll: () => api.get('/categories'),
  },

  // --- REVIEWS ---
  reviews: {
    getRecent: (limit = 8) => api.get(`/reviews/recent?limit=${limit}`),
  },

  // --- CART ---
  cart: {
    get: () => api.get('/cart'),
    addItem: (item) => api.post('/cart', item),
    updateQuantity: (itemId, quantity) => api.patch(`/cart/${itemId}?quantity=${quantity}`),
    removeItem: (itemId) => api.delete(`/cart/${itemId}`),
  },

  // --- ADDRESSES ---
  addresses: {
    list: () => api.get('/users/addresses'),
    add: (address) => api.post('/users/addresses', address),
    delete: (id) => api.delete(`/users/addresses/${id}`),
    setDefault: (id) => api.put(`/users/addresses/${id}/default`),
  },

  // --- WISHLIST ---
  wishlist: {
    get: () => api.get('/wishlist'),
    toggle: (productId) => api.post(`/wishlist/${productId}`),
  },

  // --- ORDERS ---
  orders: {
    checkout: (orderRequest) => api.post('/orders/checkout', orderRequest),
    getUserOrders: () => api.get('/orders/my-orders'),
    getOrderDetails: (id) => api.get(`/orders/${id}`),
  },

  // --- ADMIN ---
  admin: {
    getDashboardStats: () => api.get('/admin/dashboard/stats'),
    getAnalytics: () => api.get('/admin/analytics'),
    users: {
      getAll: (search) => api.get(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
      setAdmin: (userId, make) => api.patch(`/admin/users/${userId}/admin`, { make }),
      setSuspend: (userId, suspend) => api.patch(`/admin/users/${userId}/suspend`, { suspend }),
    },
    shipments: {
      getAll: () => api.get('/admin/shipments'),
      update: (id, data) => api.patch(`/admin/shipments/${id}`, data),
    },
    reviews: {
      getAll: (rating) => api.get(`/admin/reviews${rating ? `?rating=${rating}` : ''}`),
      update: (id, data) => api.patch(`/admin/reviews/${id}`, data),
      delete: (id) => api.delete(`/admin/reviews/${id}`),
    },
    products: {
      getAll: (page = 0, size = 12) => api.get(`/products?page=${page}&size=${size}`),
      getOne: (id) => api.get(`/products/${id}`),
      create: (data) => api.post('/products', data),
      update: (id, data) => api.put(`/products/${id}`, data),
      delete: (id) => api.delete(`/products/${id}`),
      uploadImage: (productId, formData) => api.post(`/products/${productId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    },
    orders: {
      getAll: (status) => api.get(`/admin/orders${status && status !== 'all' ? `?status=${status}` : ''}`),
      getOne: (id) => api.get(`/admin/orders/${id}`),
      updateStatus: (orderId, status) => api.patch(`/admin/orders/${orderId}/status`, { status }),
      markPaid: (orderId) => api.post(`/admin/orders/${orderId}/payments`),
      addShipment: (orderId, data) => api.post(`/admin/orders/${orderId}/shipments`, data),
    },
    categories: {
      getAll: () => api.get('/categories'),
      create: (data) => api.post('/categories', data),
      update: (id, data) => api.put(`/categories/${id}`, data),
      delete: (id) => api.delete(`/categories/${id}`),
    },
    audit: {
      getAll: (limit = 200) => api.get(`/admin/audit?limit=${limit}`),
    },
  }
};

export default apiService;
