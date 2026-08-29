import { createContext, useContext, useEffect, useState } from "react";
import { AdminAuthService } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("rr_admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    AdminAuthService.me()
      .then((res) => setAdmin(res.data))
      .catch(() => {
        localStorage.removeItem("rr_admin_token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const res = await AdminAuthService.login(username, password);
    localStorage.setItem("rr_admin_token", res.data.token);
    setAdmin(res.data.admin);
    return res.data.admin;
  }

  function logout() {
    localStorage.removeItem("rr_admin_token");
    setAdmin(null);
  }

  return <AuthContext.Provider value={{ admin, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
