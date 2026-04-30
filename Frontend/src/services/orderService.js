import api from "../api/axios";

const orderService = {
  /**
   * POST /orders — place order with shipping info
   * Body: { fullName, address, city, postalCode, country, phone }
   */
  placeOrder: async (shippingDetails) => {
    const res = await api.post("/orders", shippingDetails);
    return res.data;
  },

  /** GET /orders/my — current user's orders */
  getMyOrders: async () => {
    const res = await api.get("/orders/my");
    return res.data;
  },

  /** GET /orders/:id — single order detail */
  getById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** GET /orders — all orders (admin only) */
  getAllOrders: async () => {
    const res = await api.get("/orders");
    return res.data;
  },

  /** PUT /orders/:id/status  { status } */
  updateStatus: async (id, status) => {
    const res = await api.put(`/orders/${id}/status`, { status });
    return res.data;
  },
};

export default orderService;