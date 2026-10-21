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
   * Google Login — POST /auth/google
   * Expected response: { token: string, user: { id, name, email, role } }
   */
  googleLogin: async (token) => {
    const res = await api.post("/auth/google", { token });
    return res.data;
  },

  /**
   * Two-step login — POST /auth/mfa/verify with the ticket from login/googleLogin
   * (returned as { mfaRequired: true, ticket } when the account uses an authenticator app).
   */
  verifyMfa: async (ticket, code) => {
    const res = await api.post("/auth/mfa/verify", { ticket, code }, { skipAuthRedirect: true });
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