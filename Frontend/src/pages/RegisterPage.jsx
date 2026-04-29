import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <p className="text-[11px] font-display font-semibold tracking-[0.2em] text-[#444] uppercase mb-3">
            Get started
          </p>
          <h1 className="font-display font-bold text-3xl text-white/90">Create account</h1>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {[
            { label: "Full name", name: "name", type: "text", placeholder: "Ada Lovelace" },
            { label: "Email", name: "email", type: "email", placeholder: "you@example.com" },
            { label: "Password", name: "password", type: "password", placeholder: "Min. 8 characters" },
            { label: "Confirm password", name: "confirm", type: "password", placeholder: "••••••••" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-[12px] text-[#555] mb-2 tracking-wide">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required
                placeholder={field.placeholder}
                className="w-full px-4 py-3 bg-[#111] border border-white/[0.07] rounded-xl text-[14px] text-white placeholder-[#444] focus:border-primary/40 focus:outline-none transition-colors"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 bg-white text-black font-display font-semibold text-[14px] rounded-full hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border border-black/30 border-t-black/80 rounded-full animate-spin" />
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] text-[#555]">
          Already have an account?{" "}
          <Link to="/login" className="text-[#888] hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;