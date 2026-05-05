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
  }
};

export default apiService;
