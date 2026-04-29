import api from "../api/axios";

const authService = {
  /**
   * Login — POST /auth/login
   * Expected response: { token: string, user: { id, name, email, role } }
   */
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  /**
   * Register — POST /auth/register
   * Expected response: { token: string, user: { id, name, email, role } }
   */
  register: async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    return res.data;
  },

  /**
   * Get the logged-in user's profile — GET /auth/me
   */
  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};

export default authService;