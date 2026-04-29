import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] font-display font-semibold tracking-[0.2em] text-[#444] uppercase mb-3">
            Welcome back
          </p>
          <h1 className="font-display font-bold text-3xl text-white/90">Sign in</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-[12px] text-[#555] mb-2 tracking-wide">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-[#111] border border-white/[0.07] rounded-xl text-[14px] text-white placeholder-[#444] focus:border-primary/40 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[12px] text-[#555] mb-2 tracking-wide">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#111] border border-white/[0.07] rounded-xl text-[14px] text-white placeholder-[#444] focus:border-primary/40 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 bg-white text-black font-display font-semibold text-[14px] rounded-full hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border border-black/30 border-t-black/80 rounded-full animate-spin" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] text-[#555]">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#888] hover:text-white transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;