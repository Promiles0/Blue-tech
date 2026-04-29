import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import orderService from "../services/orderService";

function CheckoutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("form"); // "form" | "success"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await orderService.placeOrder(form);
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.message || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="container mx-auto px-6 py-20 flex flex-col items-center text-center max-w-sm">
        <CheckCircle className="w-12 h-12 text-green-400/70 mb-6" />
        <h1 className="font-display font-bold text-2xl text-white/90 mb-3">Order placed</h1>
        <p className="text-[#555] text-[14px] mb-10">
          Thank you for your purchase. You'll receive a confirmation shortly.
        </p>
        <button
          onClick={() => navigate("/orders")}
          className="px-7 py-3.5 bg-white text-black font-display font-semibold text-[14px] rounded-full hover:bg-white/90 transition-colors"
        >
          View my orders
        </button>
      </div>
    );
  }

  const fields = [
    { label: "Full name", name: "fullName", type: "text", placeholder: "Ada Lovelace", span: 2 },
    { label: "Address", name: "address", type: "text", placeholder: "123 Street Name", span: 2 },
    { label: "City", name: "city", type: "text", placeholder: "Kigali", span: 1 },
    { label: "Postal code", name: "postalCode", type: "text", placeholder: "00000", span: 1 },
    { label: "Country", name: "country", type: "text", placeholder: "Rwanda", span: 1 },
    { label: "Phone", name: "phone", type: "tel", placeholder: "+250 7XX XXX XXX", span: 1 },
  ];

  return (
    <div className="container mx-auto px-6 py-16 max-w-xl">
      <div className="mb-12">
        <p className="text-[11px] font-display font-semibold tracking-[0.2em] text-[#444] uppercase mb-3">
          Shipping
        </p>
        <h1 className="font-display font-bold text-3xl text-white/90">Checkout</h1>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-5">
          {fields.map((field) => (
            <div key={field.name} className={field.span === 2 ? "col-span-2" : "col-span-1"}>
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
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <p className="text-[12px] text-[#555] mb-6">Payment will be handled at delivery (COD).</p>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black font-display font-semibold text-[14px] rounded-full hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border border-black/30 border-t-black/80 rounded-full animate-spin" />
            ) : (
              "Place order"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CheckoutPage;