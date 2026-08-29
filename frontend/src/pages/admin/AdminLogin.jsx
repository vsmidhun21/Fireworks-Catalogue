import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      const redirectTo = location.state?.from || "/admin/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <Logo variant="white-bg" className="h-16 w-auto" />
        </div>
        <h1 className="font-display text-xl font-bold text-brand-navy text-center mb-1">Admin Login</h1>
        <p className="text-sm text-brand-muted text-center mb-6">Sri RR Crackers management panel</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Username or Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-brand-border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-brand-border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          {error && <p className="text-sm text-brand-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-brand-muted text-center mt-6">
          Demo credentials: <span className="font-mono">admin / Admin@123</span> — change before production.
        </p>
      </div>
    </div>
  );
}
