import { useState, useEffect } from "react";
import { track } from "../lib/analytics";
import { useT } from '../lib/i18n'
import { useStoreSettings, deliveryWindow, formatWindow } from "../lib/delivery";
import { usePrograms, useRewards } from "../lib/programs";
import RwandaAddressFields from "../components/site/RwandaAddressFields";
import { EMPTY_RW_ADDRESS, addressStreet } from "../lib/rwandaAddress";
import { useNavigate, Link } from "react-router-dom";
import { Clock, ArrowLeft, MapPin, Truck, Wallet } from "lucide-react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import apiService from "../api/service";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import CouponInput from "../components/site/CouponInput";
import { useCurrency } from "../context/CurrencyContext";
import PayForOrder from "../components/site/PayForOrder";
import OrderPlaced from "../components/site/OrderPlaced";
import { loadCheckoutMemory, saveCheckoutMemory } from "../lib/checkoutMemory";
import { clearReferral, storedReferral } from "../lib/referral";
import { useQuery } from "@tanstack/react-query";
import { CARD_ELEMENT_OPTIONS, MOMO_POLL_INTERVAL_MS, MOMO_POLL_TIMEOUT_MS, getStripe, momoProviderFor, normalizeRwandaPhone } from "../lib/payments";

const EXPRESS_SHIPPING_FEE_RWF = 7500;

// Card element styling, phone rules and polling timings: lib/payments.js (shared with PayForOrder).

function CheckoutForm() {
  const { t, intlLocale } = useT()
  const t_err = (msg) => toast.error(t(msg))
  const { user } = useAuth();
  const { cart, clearCart, savings } = useCart();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { formatPrice, formatUsd } = useCurrency();

  const [step, setStep] = useState("shipping"); // "shipping" | "success" | "momo-pending" | "pay-rescue"
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [momoPhone, setMomoPhone] = useState("");
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const { deliveryConfig } = useStoreSettings();
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [momoOutcome, setMomoOutcome] = useState("waiting"); // "waiting" | "timeout"

  const [newAddress, setNewAddress] = useState(EMPTY_RW_ADDRESS);
  const [checkoutTracked, setCheckoutTracked] = useState(false);
  useEffect(() => {
    if (checkoutTracked || !cart?.items?.length) return;
    setCheckoutTracked(true);
    track("begin_checkout", {
      value: cart.items.reduce((s, i) => s + parseFloat(i.unitPrice ?? i.price ?? 0) * (i.quantity ?? 1), 0),
      items: cart.items.map((i) => ({ id: i.product?.productId ?? i.variantId, name: i.productName, price: i.unitPrice, quantity: i.quantity })),
    });
  }, [cart, checkoutTracked]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    // Returning customers start with what they chose last time (1d).
    const memory = loadCheckoutMemory(user.id);
    if (["CARD", "MOMO", "AIRTEL_MONEY"].includes(memory.paymentMethod)) setPaymentMethod(memory.paymentMethod);
    if (["STANDARD", "EXPRESS"].includes(memory.shippingMethod)) setShippingMethod(memory.shippingMethod);
    setMomoPhone(memory.momoPhone || user.phone || "");
    apiService.addresses.list()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        const last = list.find((a) => a.addressId === memory.addressId);
        const def = last ?? list.find((a) => a.isDefault);
        if (def) setSelectedAddressId(def.addressId);
        else if (list.length > 0) setSelectedAddressId(list[0].addressId);
        else setShowNewAddressForm(true);
      })
      .catch(() => setShowNewAddressForm(true));
  }, [user, navigate]);

  const getItemTotal = (item) => parseFloat(item.unitPrice ?? item.price ?? 0) * (item.quantity ?? 1);
  const subtotal = cart?.items?.reduce((sum, item) => sum + getItemTotal(item), 0) || 0;
  // Same rules as the API: bundle savings first; coupons only count items that aren't on sale.
  const bundleDiscount = Math.min(savings?.bundleDiscount ?? 0, subtotal);
  const couponBase = Math.max(0, subtotal - (savings?.saleItemsTotal ?? 0) - bundleDiscount);
  const discount = coupon
    ? coupon.kind === "PERCENT" ? couponBase * (Number(coupon.value) / 100) : Number(coupon.value)
    : 0;
  const safeDiscount = Math.min(discount, couponBase);
  // RWF, like every price. Keep in sync with EXPRESS_SHIPPING_FEE_RWF in the API.
  const shippingFee = shippingMethod === "EXPRESS" ? EXPRESS_SHIPPING_FEE_RWF : 0;
  // District the estimate is for: the new-address form, else the chosen saved address.
  const deliveryDistrict = showNewAddressForm
    ? newAddress.city
    : addresses.find((a) => a.addressId === selectedAddressId)?.city ?? "";
  // Same order as the API: coupon, then student discount, then points (capped).
  const programs = usePrograms();
  const { data: rewards } = useRewards(Boolean(programs?.loyalty?.enabled || programs?.student?.enabled));
  const [usePoints, setUsePoints] = useState(false);
  // A friend's invite link (6d): first order, not together with a coupon. The API re-checks.
  const referralCode = programs?.referral?.enabled && !coupon ? storedReferral() : null;
  const { data: invite } = useQuery({
    queryKey: ["referral-check", referralCode],
    queryFn: () => apiService.rewards.referralCheck(referralCode).then((r) => r.data),
    enabled: Boolean(referralCode && user),
    staleTime: 60_000,
  });
  const referralDiscount = invite?.ok && subtotal >= invite.minOrder ? Math.min(invite.discount, Math.max(0, subtotal - bundleDiscount - safeDiscount)) : 0;
  const studentDiscount = programs?.student?.enabled && rewards?.studentActive ? Math.round(subtotal * programs.student.percent / 100) : 0;
  const pointValue = programs?.loyalty?.pointValue ?? 0;
  const pointsAvailable = programs?.loyalty?.enabled && pointValue > 0 ? (rewards?.points ?? 0) : 0;
  const pointsDiscount = usePoints && pointsAvailable > 0
    ? Math.floor(Math.min(pointsAvailable * pointValue, subtotal * programs.loyalty.maxRedeemPercent / 100, Math.max(0, subtotal - bundleDiscount - safeDiscount - referralDiscount - studentDiscount)) / pointValue) * pointValue
    : 0;
  const total = Math.max(0, subtotal - bundleDiscount - safeDiscount - referralDiscount - studentDiscount - pointsDiscount + shippingFee);

  const buildPayload = () => {
    if (showNewAddressForm) {
      if (!newAddress.city || !newAddress.street.trim() || !newAddress.phone.trim()) {
        t_err("Please choose your district and add your street and phone number");
        return null;
      }
      const { landmark, ...rest } = newAddress; // eslint-disable-line no-unused-vars
      return { ...rest, street: addressStreet(newAddress), shippingMethod, paymentMethod, couponCode: coupon?.code ?? null, usePoints, referralCode };
    }
    const addr = addresses.find((a) => a.addressId === selectedAddressId);
    if (!addr) { t_err("Select a delivery address"); return null; }
    return {
      street: addressStreet({ street: addr.streetAddress, landmark: addr.landmarks }), city: addr.city,
      state: addr.state ?? "", zipCode: addr.zipCode ?? "",
      country: addr.country, phone: addr.phoneNumber,
      shippingMethod, paymentMethod, couponCode: coupon?.code ?? null, usePoints, referralCode,
    };
  };

  // The mobile money prompt is approved on the handset, so nothing in this tab can tell
  // us the outcome — poll the backend, which reconciles against Paypack when the webhook
  // has not landed yet.
  useEffect(() => {
    if (step !== "momo-pending" || !pendingOrderId) return;

    let cancelled = false;
    let timer;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;
      try {
        const { data } = await apiService.payments.getStatus(pendingOrderId);
        if (cancelled) return;
        if (data?.paymentStatus === "SUCCESS") {
          setStep("success");
          return;
        }
        if (data?.paymentStatus === "FAILED") {
          // The order (and its reserved stock) is kept: retry on the same order, never a new one.
          setStep("pay-rescue");
          return;
        }
      } catch {
        // Transient failure — keep waiting rather than dropping the customer out.
      }
      if (Date.now() - startedAt >= MOMO_POLL_TIMEOUT_MS) {
        setMomoOutcome("timeout");
        return;
      }
      timer = setTimeout(tick, MOMO_POLL_INTERVAL_MS);
    };

    timer = setTimeout(tick, MOMO_POLL_INTERVAL_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [step, pendingOrderId]);

  const handlePlaceOrder = async () => {
    const isMomo = paymentMethod === "MOMO" || paymentMethod === "AIRTEL_MONEY";
    let normalizedPhone = null;

    if (isMomo) {
      if (!momoPhone) {
        t_err("Please provide your mobile money number");
        return;
      }
      normalizedPhone = normalizeRwandaPhone(momoPhone);
      if (!normalizedPhone) {
        t_err("Enter a valid Rwandan number, e.g. 0788123456 or +250788123456");
        return;
      }
      // Paypack routes on the prefix alone, so a mismatch would charge the other network.
      if (momoProviderFor(normalizedPhone) !== paymentMethod) {
        toast.error(
          paymentMethod === "MOMO"
            ? t("That is an Airtel number. Use an MTN number (078/079) or switch to Airtel Money.")
            : t("That is an MTN number. Use an Airtel number (072/073) or switch to MTN Mobile Money.")
        );
        return;
      }
    }

    const payload = buildPayload();
    if (!payload) return;

    setLoading(true);
    let createdOrderId = null;
    try {
      // 1. Create the order (PENDING) — backend clears cart internally
      const { data: orderData } = await apiService.orders.checkout(payload);
      const orderId = orderData?.orderId;

      if (!orderId) throw new Error("Order creation failed — no order ID returned");
      // An invite is for one first order: forget it once an order is placed.
      if (referralCode) clearReferral();
      // The server has moved the cart into this order; keep its id so a failed payment can be
      // retried on it instead of placing a duplicate order.
      createdOrderId = orderId;
      setPendingOrderId(orderId);
      saveCheckoutMemory(user.id, { paymentMethod, momoPhone: normalizedPhone ?? momoPhone, addressId: showNewAddressForm ? null : selectedAddressId, shippingMethod });
      setPendingTotal(orderData?.totalAmount ?? total);

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

        if (error) {
          toast.error(error.message || t("Card payment failed"));
          clearCart();
          setStep("pay-rescue");
          return;
        }
        if (paymentIntent.status === "succeeded") {
          clearCart();
          setStep("success");
          // Stripe told this tab the charge went through, but only the backend can mark
          // the order paid. Nudge it so the order settles even if the webhook is delayed.
          apiService.payments.getStatus(orderId).catch(() => {});
          return;
        }
      }

      // 3. MOMO / AIRTEL_MONEY: Paypack flow
      if (isMomo) {
        await apiService.payments.initiateMomo(orderId, normalizedPhone);
        clearCart();
        setPendingOrderId(orderId);
        setMomoOutcome("waiting");
        setStep("momo-pending");
        return;
      }

      // 4. CASH — order placed, payment on pickup
      clearCart();
      setStep("success");

    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t("Failed to place order"));
      // The order was created but paying failed (e.g. the MoMo request didn't go out): rescue it.
      if (createdOrderId) { clearCart(); setStep("pay-rescue"); }
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    const deliveryText = deliveryConfig ? formatWindow(deliveryWindow(deliveryConfig, deliveryDistrict, shippingMethod), intlLocale) : null;
    return <OrderPlaced orderId={pendingOrderId} deliveryText={deliveryText} cashOnPickup={paymentMethod === "CASH"} />;
  }

  if (step === "pay-rescue" && pendingOrderId) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div className="fade-in" style={{ width: "100%", maxWidth: 460 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--warning-soft, #fff8e1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "var(--warning, #f59e0b)" }}>
              <Wallet size={34} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>{t("Your order is saved")}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14.5, lineHeight: 1.7, marginBottom: 24 }}>
              {t("Order #{id} is reserved for you, but the payment didn't go through. Try again, use another number, or pay by card:", { id: pendingOrderId })}
            </p>
          </div>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", borderRadius: 16, padding: 22 }}>
            <PayForOrder orderId={pendingOrderId} total={pendingTotal} defaultMethod={paymentMethod} defaultPhone={momoPhone} onPaid={() => setStep("success")} />
          </div>
          <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-muted)", marginTop: 16 }}>
            {t("You can also finish paying later from")} <Link to={`/orders/${pendingOrderId}`}>{t("your order page")}</Link>.
          </p>
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
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", marginBottom: 12 }}>{t("Awaiting payment")}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, marginBottom: 12 }}>
            {t("A payment prompt has been sent to")} <strong>{momoPhone}</strong>.
          </p>
          {momoOutcome === "waiting" ? (
            <>
              <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                {t("Please check your phone and approve the payment to complete your order. This page updates on its own — keep it open.")}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 32 }}>
                {t("Waiting for confirmation…")}
              </p>
            </>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
              {t("We haven't received confirmation yet. If you approved the prompt, the payment may still be settling — your order is reserved and will update automatically. You can check its status on the orders page.")}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {momoOutcome !== "waiting" && (
              <button type="button" className="noir-btn-outline" style={{ padding: "14px 24px" }} onClick={() => setStep("pay-rescue")}>
                {t("Pay another way")}
              </button>
            )}
            <Link to="/orders" className="noir-btn-primary" style={{ padding: "14px 32px" }}>
              {t("View my orders")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "44px 0 100px" }}>
      <div className="container-noir">
        <Link to="/cart" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
          <ArrowLeft size={14} /> {t("Back to cart")}
        </Link>

        <div className="checkout-layout-grid">
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", marginBottom: 40, letterSpacing: "-0.02em" }}>{t("Checkout")}</h1>

            {/* Shipping Address */}
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={18} style={{ color: "var(--brand)" }} /> {t("Delivery address")}
                </h2>
                {addresses.length > 0 && (
                  <button onClick={() => setShowNewAddressForm((v) => !v)}
                    style={{ background: "none", border: "none", color: "var(--brand)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {showNewAddressForm ? t("Use saved address") : `+ ${t("Use new address")}`}
                  </button>
                )}
              </div>

              {showNewAddressForm ? (
                <div className="fade-in" style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", borderRadius: 16, padding: 32 }}>
                  <RwandaAddressFields value={newAddress} onChange={setNewAddress} />
                </div>
              ) : (
                <select value={selectedAddressId || ""} onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                  className="noir-input"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", color: "var(--text-primary)", borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%", cursor: "pointer", appearance: "none" }}>
                  {addresses.map((a) => (
                    <option key={a.addressId} value={a.addressId} style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>
                      {a.streetAddress}, {a.city}{a.state ? `, ${a.state}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </section>

            {/* Shipping Method */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Truck size={18} style={{ color: "var(--brand)" }} /> {t("Delivery method")}
              </h2>
              <select value={shippingMethod}
                onChange={(e) => {
                  const val = e.target.value;
                  setShippingMethod(val);
                  if (val !== "PICKUP" && paymentMethod === "CASH") setPaymentMethod("CARD");
                }}
                className="noir-input"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", color: "var(--text-primary)", borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%", cursor: "pointer", appearance: "none" }}>
                <option value="STANDARD">{t("Standard delivery — FREE")}{deliveryConfig ? ` · ${formatWindow(deliveryWindow(deliveryConfig, deliveryDistrict, 'STANDARD'), intlLocale)}` : ''}</option>
                <option value="EXPRESS">{t("Express")} — +{formatPrice(EXPRESS_SHIPPING_FEE_RWF)}{deliveryConfig ? ` · ${formatWindow(deliveryWindow(deliveryConfig, deliveryDistrict, 'EXPRESS'), intlLocale)}` : ''}</option>
                {deliveryConfig?.pickupEnabled && (
                  <option value="PICKUP">{t("Pick up at our shop — FREE")} · {formatWindow(deliveryWindow(deliveryConfig, deliveryDistrict, 'PICKUP'), intlLocale)}</option>
                )}
              </select>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>
                {shippingMethod === "PICKUP" && deliveryConfig
                  ? t("Pick up at {address}. We'll call you when it's ready.", { address: deliveryConfig.pickupAddress })
                  : deliveryDistrict
                    ? t("Estimated for {district}. Orders after {time} are handled the next day.", { district: deliveryDistrict, time: `${String(deliveryConfig?.cutoffHour ?? 15).padStart(2, '0')}:00` })
                    : t("Choose your district above to see the delivery date.")}
              </p>
            </section>

            {/* Payment Method */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Wallet size={18} style={{ color: "var(--brand)" }} /> {t("Payment method")}
              </h2>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="noir-input"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", color: "var(--text-primary)", borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", width: "100%", cursor: "pointer", appearance: "none" }}>
                <option value="CARD">{t("Credit / debit card")}</option>
                <option value="MOMO">MTN Mobile Money</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
                {shippingMethod === "PICKUP" && <option value="CASH">{t("Cash / cheque on pickup")}</option>}
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
                    {paymentMethod === "MOMO" ? t("MTN MoMo number") : t("Airtel Money number")}
                  </h3>
                  <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>MOBILE NUMBER</label>
                  <input className="noir-input" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} placeholder="0788123456" />
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
                    <span style={{ color: "var(--text-primary)" }}>{formatPrice(getItemTotal(item))}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 flex flex-col gap-4" style={{ borderTop: "1px solid var(--border)", marginBottom: 24 }}>
                <div>
                  <label className="block text-[12px] mb-2 tracking-wide" style={{ color: "var(--text-muted)" }}>{t("Coupon code")}</label>
                  <CouponInput applied={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} />
                </div>
                {coupon && (
                  <p className="text-[13px]" style={{ color: "var(--brand)" }}>
                    {t("Discount applied:")} {coupon.kind === "PERCENT" ? t("{v}% off", { v: coupon.value }) : t("{v} off", { v: formatPrice(coupon.value) })}
                  </p>
                )}
              </div>

              <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: 20, marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{t("Subtotal")}</span>
                  <span style={{ color: "var(--text-primary)" }}>{formatPrice(subtotal)}</span>
                </div>
                {bundleDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{t("Bundle savings")}</span>
                    <span style={{ color: "var(--brand)" }}>-{formatPrice(bundleDiscount)}</span>
                  </div>
                )}
                {coupon && couponBase <= 0 && (
                  <p style={{ fontSize: 12.5, color: "var(--warning, #f59e0b)", margin: "0 0 8px" }}>{t("Coupons don't apply to items that are already on sale.")}</p>
                )}
                {safeDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{t("Discount")}</span>
                    <span style={{ color: "var(--brand)" }}>-{formatPrice(safeDiscount)}</span>
                  </div>
                )}
                {referralDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{t("Friend's invite")}</span>
                    <span style={{ color: "var(--brand)" }}>-{formatPrice(referralDiscount)}</span>
                  </div>
                )}
                {invite?.ok && referralDiscount === 0 && subtotal < invite.minOrder && (
                  <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "0 0 8px" }}>{t("Your friend's invite gives {amount} off orders of {min} or more.", { amount: formatPrice(invite.discount), min: formatPrice(invite.minOrder) })}</p>
                )}
                {studentDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{t("Student discount")}</span>
                    <span style={{ color: "var(--brand)" }}>-{formatPrice(studentDiscount)}</span>
                  </div>
                )}
                {pointsAvailable > 0 && (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginBottom: 8, cursor: "pointer", color: "var(--text-secondary)" }}>
                    <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
                    {t("Use my points ({n} available)", { n: pointsAvailable })}
                    {pointsDiscount > 0 && <span style={{ marginLeft: "auto", color: "var(--brand)" }}>-{formatPrice(pointsDiscount)}</span>}
                  </label>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 12 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{t("Delivery")}</span>
                  <span style={{ color: "var(--text-primary)" }}>{shippingFee > 0 ? formatPrice(shippingFee) : t("Free")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, borderTop: "1px dashed var(--card-border)", paddingTop: 12 }}>
                  <span style={{ color: "var(--text-primary)" }}>{t("Total")}</span>
                  <span style={{ color: "var(--price-color)" }}>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Prices are RWF, but Stripe charges cards in USD — state the exact USD amount
                  here, at the point of payment, not on the shopper's statement. Mobile money
                  is charged the RWF total as shown. */}
              {paymentMethod === "CARD" && (
                <p style={{
                  fontSize: 12, lineHeight: 1.6, color: "var(--text-muted)",
                  background: "var(--bg-elevated, rgba(127,127,127,0.08))",
                  border: "1px solid var(--card-border)", borderRadius: 10,
                  padding: "10px 12px", marginBottom: 16,
                }}>
                  Card payments are charged in USD: <strong style={{ color: "var(--text-primary)" }}>{formatUsd(total)}</strong>, converted from the RWF total at today's exchange rate.
                </p>
              )}

              <button onClick={handlePlaceOrder} disabled={loading || !cart?.items?.length || (paymentMethod === "CARD" && !stripe)}
                className="noir-btn-cta shine"
                style={{ width: "100%", padding: "14px", fontSize: 15, opacity: loading ? 0.7 : 1 }}>
                {loading ? t("Processing…") : t("Confirm & pay")}
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
    <Elements stripe={getStripe()}>
      <CheckoutForm />
    </Elements>
  );
}
