import api from "../api/axios";

const cartService = {
  /** GET /cart */
  getCart: async () => {
    const res = await api.get("/cart");
    return res.data;
  },

  /** POST /cart/items  { productId, quantity } */
  addItem: async (productId, quantity = 1) => {
    const res = await api.post("/cart/items", { productId, quantity });
    return res.data;
  },

  /** PUT /cart/items/:itemId  { quantity } */
  updateItem: async (itemId, quantity) => {
    const res = await api.put(`/cart/items/${itemId}`, { quantity });
    return res.data;
  },

  /** DELETE /cart/items/:itemId */
  removeItem: async (itemId) => {
    const res = await api.delete(`/cart/items/${itemId}`);
    return res.data;
  },

  /** DELETE /cart — clear entire cart */
  clearCart: async () => {
    const res = await api.delete("/cart");
    return res.data;
  },
};

export default cartService;