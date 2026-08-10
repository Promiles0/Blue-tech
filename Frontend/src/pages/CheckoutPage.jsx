import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle, Clock, ArrowLeft, MapPin, Truck, Wallet } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import apiService from "../api/service";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import CouponInput from "../components/site/CouponInput";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "14px",
      color: "var(--text-primary)",
      fontFamily: "inherit",
      "::placeholder": { color: "var(--text-muted)" },
    },
    invalid: { color: "#e53e3e" },
  },
};

function CheckoutForm() {
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState("shipping"); // "shipping" | "success" | "momo-pending"
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [momoPhone, setMomoPhone] = useState("");
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState("CARD");

  const [newAddress, setNewAddress] = useState({
    street: "", city: "", state: "", zipCode: "", country: "Rwanda", phone: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    apiService.addresses.list()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault);
        if (def) setSelectedAddressId(def.addressId);
        else if (list.length > 0) setSelectedAddressId(list[0].addressId);
        else setShowNewAddressForm(true);
      })
      .catch(() => setShowNewAddressForm(true));
  }, [user, navigate]);

  const getItemTotal = (item) => parseFloat(item.unitPrice ?? item.price ?? 0) * (item.quantity ?? 1);
  const subtotal = cart?.items?.reduce((sum, item) => sum + getItemTotal(item), 0) || 0;
  const discount = coupon
    ? coupon.kind === "PERCENT" ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value)
    : 0;
  const safeDiscount = Math.min(discount, subtotal);
  const shippingFee = shippingMethod === "EXPRESS" ? 5 : 0;
  const total = Math.max(0, subtotal - safeDiscount + shippingFee);

  const buildPayload = () => {
    if (showNewAddressForm) {
      if (!newAddress.street || !newAddress.city || !newAddress.phone) {
        toast.error("Please fill in required shipping details");
        return null;
      }
      return { ...newAddress, shippingMethod, paymentMethod, couponCode: coupon?.code ?? null };
    }
    const addr = addresses.find((a) => a.addressId === selectedAddressId);
    if (!addr) { toast.error("Select a shipping address"); return null; }
    return {
      street: addr.streetAddress, city: addr.city,
      state: addr.state ?? "", zipCode: addr.zipCode ?? "",
      country: addr.country, phone: addr.phoneNumber,
      shippingMethod, paymentMethod, couponCode: coupon?.code ?? null,
    };
  };

  const handlePlaceOrder = async () => {
    if ((paymentMethod === "MOMO" || paymentMethod === "AIRTEL_MONEY") && !momoPhone) {
      toast.error("Please provide your mobile money number");
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    setLoading(true);
    try {
      // 1. Create the order (PENDING) — backend clears cart internally
      const { data: orderData } = await apiService.orders.checkout(payload);
      const orderId = orderData?.orderId;

      if (!orderId) throw new Error("Order creation failed — no order ID returned");

      // 2. CARD: Stripe flow
      if (paymentMethod === "CARD") {
        if (!stripe || !elements) throw new Error("Stripe not loaded");
        const { data: intentData } = await apiService.payments.createIntent(orderId);
        const clientSecret = intentData?.paymentLink;
        if (!clientSecret) throw new Error("Could not get payment client secret");

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: { email: user.email, name: user.name },
          },
        });

        if (error) { toast.error(error.message || "Card payment failed"); return; }
        if (paymentIntent.status === "succeeded") { clearCart(); setStep("success"); return; }
      }

      // 3. MOMO / AIRTEL_MONEY: Paypack flow
      if (paymentMethod === "MOMO" || paymentMethod === "AIRTEL_MONEY") {
        await apiService.payments.initiateMomo(orderId, momoPhone);
        clearCart();
        setStep("momo-pending");
        return;
      }

      // 4. CASH — order placed, payment on pickup
      clearCart();
      setStep("success");

    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="fade-in" style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--success-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--success)" }}>
            <CheckCircle size={40} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", marginBottom: 12 }}>Order Confirmed</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            Thank you for your purchase. We've received your order and will start preparing it for delivery immediately.
          </p>
          <Link to="/orders" className="noir-btn-primary" style={{ padding: "14px 32px" }}>
            Track my order
          </Link>
        </div>
      </div>
    );
  }

  if (step === "momo-pending") {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="fade-in" style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--warning-soft, #fff8e1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--warning, #f59e0b)" }}>
            <Clock size={40} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", marginBottom: 12 }}>Awaiting Payment</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, marginBottom: 12 }}>
            A payment prompt has been sent to <strong>{momoPhone}</strong>.
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Please check your phone and <strong>approve the MoMo payment</strong> to complete your order. Your order is reserved and will be confirmed once payment is received.
          </p>
          <Link to="/orders" className="noir-btn-primary" style={{ padding: "14px 32px" }}>
            View my orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "44px 0 100px" }}>
      <div className="container-noir">
        <Link to="/cart" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
          <ArrowLeft size={14} /> Back to cart
        </Link>

        <div className="checkout-layout-grid">
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", marginBottom: 40, letterSpacing: "-0.02em" }}>Checkout</h1>

            {/* Shipping Address */}
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={18} style={{ color: "var(--brand)" }} /> Shipping Address
                </h2>
                {addresses.length > 0 && (
                  <button onClick={() => setShowNewAddressForm((v) => !v)}
                    style={{ background: "none", border: "none", color: "var(--brand)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {showNewAddressForm ? "Use saved address" : "+ Use new address"}
                  </button>
                )}
              </div>

              {showNewAddressForm ? (
                <div className="fade-in" style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", borderRadius: 16, padding: 32 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>STREET ADDRESS</label>
                      <input className="noir-input" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} placeholder="e.g. 123 Designer Row" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>CITY</label>
                      <input className="noir-input" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="e.g. Kigali" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>POSTAL CODE</label>
                      <input className="noir-input" value={newAddress.zipCode} onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })} placeholder="00000" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>STATE / PROVINCE</label>
                      <input className="noir-input" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} placeholder="Gasabo" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>COUNTRY</label>
                      <input className="noir-input" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} placeholder="Rwanda" />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>PHONE NUMBER</label>
                      <input className="noir-input" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} placeholder="+250 XXX XXX XXX" />
                    </div>
                  </div>
                </div>
              ) : (
                <select value={selectedAddressId || ""} onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                  className="noir-input"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", color: "var(--text-primary)", borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%", cursor: "pointer", appearance: "none" }}>
                  {addresses.map((a) => (
                    <option key={a.addressId} value={a.addressId} style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>
                      {a.streetAddress}, {a.city}, {a.country}
                    </option>
                  ))}
                </select>
              )}
            </section>

            {/* Shipping Method */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Truck size={18} style={{ color: "var(--brand)" }} /> Shipping Method
              </h2>
              <select value={shippingMethod}
                onChange={(e) => {
                  const val = e.target.value;
                  setShippingMethod(val);
                  if (val !== "PICKUP" && paymentMethod === "CASH") setPaymentMethod("CARD");
                }}
                className="noir-input"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", color: "var(--text-primary)", borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%", cursor: "pointer", appearance: "none" }}>
                <option value="STANDARD">Standard Delivery (FREE, 2-4 days)</option>
                <option value="EXPRESS">Express Delivery (+$5.00, next day)</option>
                <option value="PICKUP">Store Pickup (FREE, collect in Kigali)</option>
              </select>
            </section>

            {/* Payment Method */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Wallet size={18} style={{ color: "var(--brand)" }} /> Payment Method
              </h2>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="noir-input"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", color: "var(--text-primary)", borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%", cursor: "pointer", appearance: "none" }}>
                <option value="CARD">Credit / Debit Card</option>
                <option value="MOMO">MTN Mobile Money</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
                {shippingMethod === "PICKUP" && <option value="CASH">Cash / Cheque on Pickup</option>}
              </select>

              {/* Stripe Card Element */}
              {paymentMethod === "CARD" && (
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", borderRadius: 16, padding: "24px", marginTop: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Card Details</h3>
                  <div style={{ padding: "12px 16px", border: "1px solid var(--card-border)", borderRadius: 10, background: "var(--bg-base)" }}>
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
                    🔒 Secured by Stripe. Your card details never touch our servers.
                  </p>
                </div>
              )}

              {(paymentMethod === "MOMO" || paymentMethod === "AIRTEL_MONEY") && (
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", borderRadius: 16, padding: "24px", marginTop: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
                    {paymentMethod === "MOMO" ? "MTN MoMo Number" : "Airtel Money Number"}
                  </h3>
                  <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>MOBILE NUMBER</label>
                  <input className="noir-input" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} placeholder="078 XXX XXXX" />
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8 }}>
                    A payment prompt will be sent to this number to authorize the transaction.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Order Summary */}
          <aside>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", borderRadius: 20, padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>Order Summary</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                {cart?.items?.map((item) => (
                  <div key={item.cartItemId ?? item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{item.productName} <small>x{item.quantity}</small></span>
                    <span style={{ color: "var(--text-primary)" }}>${getItemTotal(item).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 flex flex-col gap-4" style={{ borderTop: "1px solid var(--border)", marginBottom: 24 }}>
                <div>
                  <label className="block text-[12px] mb-2 tracking-wide" style={{ color: "var(--text-muted)" }}>Coupon code</label>
                  <CouponInput applied={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} />
                </div>
                {coupon && (
                  <p className="text-[13px]" style={{ color: "var(--brand)" }}>
                    Discount applied: {coupon.kind === "PERCENT" ? `${coupon.value}% off` : `$${parseFloat(coupon.value).toFixed(2)} off`}
                  </p>
                )}
              </div>

              <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: 20, marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
                  <span style={{ color: "var(--text-primary)" }}>${subtotal.toFixed(2)}</span>
                </div>
                {safeDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "var(--text-secondary)" }}>Discount</span>
                    <span style={{ color: "var(--brand)" }}>-${safeDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 12 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Shipping</span>
                  <span style={{ color: "var(--text-primary)" }}>{shippingFee > 0 ? `$${shippingFee.toFixed(2)}` : "FREE"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, borderTop: "1px dashed var(--card-border)", paddingTop: 12 }}>
                  <span style={{ color: "var(--text-primary)" }}>Total</span>
                  <span style={{ color: "var(--price-color)" }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handlePlaceOrder} disabled={loading || !cart?.items?.length || (paymentMethod === "CARD" && !stripe)}
                className="noir-btn-cta shine"
                style={{ width: "100%", padding: "14px", fontSize: 15, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Processing…" : "Confirm & Pay"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
