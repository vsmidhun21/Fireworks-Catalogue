import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, User, Loader2, LogIn } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy via-slate-900 to-indigo-950 px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="flex justify-center mb-6">
          <Logo variant="white-bg" className="h-16 w-auto" />
        </div>
        <h1 className="font-display text-xl font-bold text-brand-navy text-center mb-1">Admin Portal</h1>
        <p className="text-xs text-brand-muted text-center mb-6">Sri RR Crackers Management Dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-navy mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-primary" />
              <span>Username or Email</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full rounded-xl border border-brand-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-navy mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-brand-primary" />
              <span>Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-brand-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          {error && <p className="text-xs text-brand-error bg-rose-50 p-2.5 rounded-lg border border-rose-200">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 !py-2.5 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-brand-muted text-center mt-6">
          Demo credentials: <span className="font-mono font-semibold">admin / Admin@123</span>
        </p>
      </div>
    </div>
  );
}
