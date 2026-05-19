import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle, ArrowLeft, MapPin, Truck } from "lucide-react";
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
  const shippingMethod = "STANDARD";
  const paymentMethod = "COD";

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
        shippingMethod,
        paymentMethod,
        couponCode: coupon?.code ?? null,
      };
    } else {
      const addr = addresses.find((address) => address.addressId === selectedAddressId)
      if (!addr) {
        toast.error("Select a shipping address");
        return;
      }
      payload = {
        street: addr.streetAddress, city: addr.city,
        state: addr.state ?? '', zipCode: addr.zipCode ?? '',
        country: addr.country, phone: addr.phoneNumber,
        shippingMethod,
        paymentMethod,
        couponCode: coupon?.code ?? null,
      }
    }
    setLoading(true)
    try {
      await apiService.orders.checkout(payload)
      await clearCart()
      setStep("success")
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div style={{ padding: '44px 0 100px' }}>
      <div className="container-noir">
        <Link to="/cart" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
          <ArrowLeft size={14} /> Back to cart
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 64, alignItems: "start" }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", marginBottom: 40, letterSpacing: "-0.02em" }}>Checkout</h1>

            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={18} style={{ color: "var(--brand)" }} /> Shipping Address
                </h2>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setShowNewAddressForm((value) => !value)}
                    style={{ background: "none", border: "none", color: "var(--brand)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
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
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8 }}>Used only for delivery updates.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {addresses.map((address) => (
                    <div
                      key={address.addressId}
                      onClick={() => setSelectedAddressId(address.addressId)}
                      style={{ background: selectedAddressId === address.addressId ? "var(--brand-tint)" : "var(--bg-surface)", border: `1px solid ${selectedAddressId === address.addressId ? "var(--brand)" : "var(--card-border)"}`, borderRadius: 16, padding: "20px 24px", cursor: "pointer", transition: "all 0.2s", position: "relative" }}
                    >
                      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{address.streetAddress}</p>
                      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{address.city}, {address.country}</p>
                      {selectedAddressId === address.addressId && (
                        <div style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", color: "var(--brand)" }}>
                          <CheckCircle size={20} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Shipping Method */}
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Truck size={18} style={{ color: "var(--brand)" }} /> Shipping Method
              </h2>
              <div style={{ background: "var(--brand-tint)", border: "1px solid var(--brand-border)", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Standard Delivery</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Arrival in 2-4 business days</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>FREE</p>
              </div>
            </section>
          </div>

          <aside style={{ position: "sticky", top: 100 }}>
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

              <div className="mt-8 pt-6 border-t border-white/6 flex flex-col gap-4" style={{ marginBottom: 24 }}>
                <div>
                  <label className="block text-[12px] mb-2 tracking-wide" style={{ color: 'var(--text-muted)' }}>Coupon code</label>
                  <CouponInput applied={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} />
                </div>

                {coupon && (
                  <p className="text-[13px]" style={{ color: 'var(--brand)' }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800 }}>
                  <span style={{ color: "var(--text-primary)" }}>Total</span>
                  <span style={{ color: "var(--price-color)" }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handlePlaceOrder} disabled={loading || !cart?.items?.length}
                className="noir-btn-primary shine"
                style={{ width: '100%', padding: '14px', fontSize: 15, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Placing order…' : 'Confirm & Place Order'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
