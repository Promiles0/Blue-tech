import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle, ArrowLeft, MapPin, Truck, ShieldCheck } from "lucide-react";
import apiService from "../api/service";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import CouponInput from "../components/site/CouponInput";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState("shipping");
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [coupon, setCoupon] = useState(null);

  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Rwanda",
    phone: "",
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
        const defaultAddress = list.find((address) => address.isDefault);
        if (defaultAddress) setSelectedAddressId(defaultAddress.addressId);
        else if (list.length > 0) setSelectedAddressId(list[0].addressId);
        else setShowNewAddressForm(true);
      })
      .catch(() => setShowNewAddressForm(true));
  }, [user, navigate]);

  const getItemTotal = (item) => {
    const unitPrice = parseFloat(item.unitPrice ?? item.price ?? 0);
    return unitPrice * (item.quantity ?? 1);
  };

  const subtotal = cart?.items?.reduce((sum, item) => sum + getItemTotal(item), 0) || 0;
  const discount = coupon
    ? coupon.kind === "PERCENT"
      ? subtotal * (Number(coupon.value) / 100)
      : Number(coupon.value)
    : 0;
  const safeDiscount = Math.min(discount, subtotal);
  const total = Math.max(0, subtotal - safeDiscount);

  const handlePlaceOrder = async () => {
    let payload;

    if (showNewAddressForm) {
      if (!newAddress.street || !newAddress.city || !newAddress.phone) {
        toast.error("Please fill in required shipping details");
        return;
      }
      payload = {
        street: newAddress.street,
        city: newAddress.city,
        state: newAddress.state,
        zipCode: newAddress.zipCode,
        country: newAddress.country,
        phone: newAddress.phone,
        paymentMethod: "COD",
      };
    } else {
      const address = addresses.find((entry) => entry.addressId === selectedAddressId);
      if (!address) {
        toast.error("Please select an address");
        return;
      }
      payload = {
        street: address.streetAddress,
        city: address.city,
        state: address.state ?? "",
        zipCode: address.zipCode ?? "",
        country: address.country,
        phone: address.phoneNumber,
        paymentMethod: "COD",
      };
    }

    setLoading(true);
    try {
      await apiService.orders.checkout(payload);
      await clearCart();
      setStep("success");
      toast.success("Order placed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="fade-in" style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#22c55e" }}>
            <CheckCircle size={40} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Order Confirmed</h1>
          <p style={{ color: "#888", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            Thank you for your purchase. We've received your order and will start preparing it for delivery immediately.
          </p>
          <Link to="/orders" className="noir-btn-primary" style={{ padding: "14px 32px" }}>
            Track my order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "48px 0 100px" }}>
      <div className="container-noir">
        <Link to="/cart" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555", marginBottom: 32 }}>
          <ArrowLeft size={14} /> Back to cart
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 64, alignItems: "start" }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 40, letterSpacing: "-0.02em" }}>Checkout</h1>

            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={18} style={{ color: "#7c5cf0" }} /> Shipping Address
                </h2>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setShowNewAddressForm((value) => !value)}
                    style={{ background: "none", border: "none", color: "#7c5cf0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    {showNewAddressForm ? "Use saved address" : "+ Use new address"}
                  </button>
                )}
              </div>

              {showNewAddressForm ? (
                <div className="fade-in" style={{ background: "#141414", border: "1px solid #1e1e1e", borderRadius: 16, padding: 32 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 8, fontWeight: 600 }}>STREET ADDRESS</label>
                      <input className="noir-input" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} placeholder="e.g. 123 Designer Row" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 8, fontWeight: 600 }}>CITY</label>
                      <input className="noir-input" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="e.g. Kigali" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 8, fontWeight: 600 }}>POSTAL CODE</label>
                      <input className="noir-input" value={newAddress.zipCode} onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })} placeholder="00000" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 8, fontWeight: 600 }}>STATE / PROVINCE</label>
                      <input className="noir-input" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} placeholder="Gasabo" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 8, fontWeight: 600 }}>COUNTRY</label>
                      <input className="noir-input" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} placeholder="Rwanda" />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 8, fontWeight: 600 }}>PHONE NUMBER</label>
                      <input className="noir-input" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} placeholder="+250 XXX XXX XXX" />
                      <p style={{ fontSize: 11, color: "#444", marginTop: 8 }}>Used only for delivery updates.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {addresses.map((address) => (
                    <div
                      key={address.addressId}
                      onClick={() => setSelectedAddressId(address.addressId)}
                      style={{ background: selectedAddressId === address.addressId ? "rgba(124,92,240,0.05)" : "#141414", border: `1px solid ${selectedAddressId === address.addressId ? "#7c5cf0" : "#1e1e1e"}`, borderRadius: 16, padding: "20px 24px", cursor: "pointer", transition: "all 0.2s", position: "relative" }}
                    >
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{address.streetAddress}</p>
                      <p style={{ fontSize: 13, color: "#666" }}>{address.city}, {address.country}</p>
                      {selectedAddressId === address.addressId && (
                        <div style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", color: "#7c5cf0" }}>
                          <CheckCircle size={20} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Truck size={18} style={{ color: "#7c5cf0" }} /> Shipping Method
              </h2>
              <div style={{ background: "rgba(124,92,240,0.05)", border: "1px solid rgba(124,92,240,0.2)", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Standard Delivery</p>
                  <p style={{ fontSize: 12, color: "#888" }}>Arrival in 2-4 business days</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>FREE</p>
              </div>
            </section>
          </div>

          <aside style={{ position: "sticky", top: 100 }}>
            <div style={{ background: "#141414", border: "1px solid #1e1e1e", borderRadius: 20, padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 24 }}>Order Summary</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                {cart?.items?.map((item) => (
                  <div key={item.cartItemId ?? item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#888" }}>{item.productName} <small>x{item.quantity}</small></span>
                    <span style={{ color: "#fff" }}>${getItemTotal(item).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/6 flex flex-col gap-4" style={{ marginBottom: 24 }}>
                <div>
                  <label className="block text-[12px] text-[#555] mb-2 tracking-wide">Coupon code</label>
                  <CouponInput applied={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} />
                </div>

                {coupon && (
                  <p className="text-[13px] text-[#a78bfa]">
                    Discount applied: {coupon.kind === "PERCENT" ? `${coupon.value}% off` : `$${parseFloat(coupon.value).toFixed(2)} off`}
                  </p>
                )}
              </div>

              <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 20, marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: "#888" }}>Subtotal</span>
                  <span style={{ color: "#fff" }}>${subtotal.toFixed(2)}</span>
                </div>
                {safeDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "#888" }}>Discount</span>
                    <span style={{ color: "#a78bfa" }}>-${safeDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800 }}>
                  <span style={{ color: "#fff" }}>Total</span>
                  <span style={{ color: "#f59e0b" }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <p style={{ fontSize: "12px", color: "#555", marginBottom: 16 }}>Payment will be handled at delivery (COD).</p>

              <button onClick={handlePlaceOrder} disabled={loading || cart?.items?.length === 0} className="noir-btn-primary shine" style={{ width: "100%", padding: "16px", fontSize: 16 }}>
                {loading ? "Processing..." : "Confirm & Place Order"}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginTop: 20, color: "#444" }}>
                <ShieldCheck size={14} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>SECURE CHECKOUT</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
