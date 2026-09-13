import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAuthService, ADMIN_SESSION_EXPIRED_EVENT } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  useEffect(() => {
    // Dispatched by the axios response interceptor (services/api.js)
    // whenever an authenticated /admin/* call comes back 401 mid-session —
    // the JWT expired (or was otherwise invalidated) while the admin was
    // actively using the panel. Previously the logged-in state was only
    // ever checked once on initial load, so once this happened the admin
    // stayed "logged in" in the UI while every subsequent save/click just
    // failed with no explanation and no way back to the login screen
    // short of a manual refresh.
    function handleSessionExpired() {
      setAdmin(null);
      // Only force a redirect if the admin is actually inside the admin
      // area right now (and not already on the login page) — a stray
      // expired-token check must never yank an ordinary customer browsing
      // the public site into /admin/login.
      const path = window.location.pathname;
      if (path.startsWith("/admin") && path !== "/admin/login") {
        navigate("/admin/login", { replace: true, state: { from: path, sessionExpired: true } });
      }
    }
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [navigate]);

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
