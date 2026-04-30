import { createContext, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

// ── Lazy initializer — reads localStorage once on mount, no useEffect needed ──
function initAuth() {
  try {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      return { user: JSON.parse(storedUser), loading: false };
    }
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }
  return { user: null, loading: false };
}

export function AuthProvider({ children }) {
  const [{ user }, setAuth] = useState(initAuth);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setAuth({ user: data.user });
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setAuth({ user: data.user });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ user: null });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;