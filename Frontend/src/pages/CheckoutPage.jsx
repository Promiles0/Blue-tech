import { useState, useEffect } from "react";
import { track } from "../lib/analytics";
import { useT } from '../lib/i18n'
import { useStoreSettings, deliveryWindow, formatWindow } from "../lib/delivery";
import { usePrograms, useRewards } from "../lib/programs";
import RwandaAddressFields from "../components/site/RwandaAddressFields";
import { EMPTY_RW_ADDRESS, addressStreet } from "../lib/rwandaAddress";
import { useNavigate, Link } from "react-router-dom";
import { Clock, ArrowLeft, MapPin, Truck, Wallet, CreditCard, Banknote, Lock, Check } from "lucide-react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import apiService from "../api/service";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import CouponInput from "../components/site/CouponInput";
import { useCurrency } from "../context/CurrencyContext";
import PayForOrder from "../components/site/PayForOrder";
import OrderPlaced from "../components/site/OrderPlaced";
import { GuestCheckoutGate } from "../components/site/GuestCheckout";
import { loadCheckoutMemory, saveCheckoutMemory } from "../lib/checkoutMemory";
import { clearReferral, storedReferral } from "../lib/referral";
import { useQuery } from "@tanstack/react-query";
import { getProductThumb, handleProductImageError } from "../lib/productImage";
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
  const [paymentMethod, setPaymentMethod] = useState("MOMO");
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
    if (!user) return;
    // Returning customers start with what they chose last time (1d).
    const memory = loadCheckoutMemory(user.id);
    if (["CARD", "MOMO", "AIRTEL_MONEY"].includes(memory.paymentMethod)) setPaymentMethod(memory.paymentMethod);
    if (["STANDARD", "EXPRESS"].includes(memory.shippingMethod)) setShippingMethod(memory.shippingMethod);
    setMomoPhone(memory.momoPhone || user.phone || "");
    if (user.phone) setNewAddress((a) => (a.phone ? a : { ...a, phone: user.phone }));
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

  // Spot a mistyped or wrong-network number while typing, not after the order is placed.
  const momoDigits = momoPhone.replace(/\D/g, "");
  const momoNormalized = normalizeRwandaPhone(momoPhone);
  const momoHint = !momoPhone.trim() || momoDigits.length < 10
    ? ""
    : !momoNormalized
      ? t("Enter a valid Rwandan number, e.g. 0788123456")
      : momoProviderFor(momoNormalized) !== paymentMethod
        ? (paymentMethod === "MOMO" ? t("This looks like an Airtel number. Choose Airtel Money above, or use an MTN number.") : t("This looks like an MTN number. Choose MTN Mobile Money above, or use an Airtel number."))
        : "";

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

            {/* Delivery address */}
            <section style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <h2 className="checkout-h2"><MapPin size={18} /> {t("Delivery address")}</h2>
                {addresses.length > 0 && (
                  <button type="button" onClick={() => setShowNewAddressForm((v) => !v)} className="link-btn">
                    {showNewAddressForm ? t("Use saved address") : `+ ${t("Use new address")}`}
                  </button>
                )}
              </div>

              {showNewAddressForm ? (
                <div className="fade-in checkout-panel">
                  <RwandaAddressFields value={newAddress} onChange={setNewAddress} />
                </div>
              ) : (
                <ChoiceGroup
                  label={t("Delivery address")}
                  value={selectedAddressId}
                  onChange={setSelectedAddressId}
                  options={addresses.map((a) => ({
                    value: a.addressId,
                    title: a.streetAddress,
                    sub: [a.city, a.state, a.phoneNumber].filter(Boolean).join(" · "),
                  }))}
                />
              )}
            </section>

            {/* Delivery method */}
            <section style={{ marginBottom: 40 }}>
              <h2 className="checkout-h2" style={{ marginBottom: 16 }}><Truck size={18} /> {t("Delivery method")}</h2>
              <ChoiceGroup
                label={t("Delivery method")}
                value={shippingMethod}
                onChange={(val) => {
                  setShippingMethod(val);
                  if (val !== "PICKUP" && paymentMethod === "CASH") setPaymentMethod("MOMO");
                }}
                options={[
                  { value: "STANDARD", title: t("Standard delivery"), sub: deliveryConfig ? formatWindow(deliveryWindow(deliveryConfig, deliveryDistrict, "STANDARD"), intlLocale) : null, right: t("Free") },
                  { value: "EXPRESS", title: t("Express delivery"), sub: deliveryConfig ? formatWindow(deliveryWindow(deliveryConfig, deliveryDistrict, "EXPRESS"), intlLocale) : null, right: `+${formatPrice(EXPRESS_SHIPPING_FEE_RWF)}` },
                  ...(deliveryConfig?.pickupEnabled ? [{ value: "PICKUP", title: t("Pick up at our shop"), sub: formatWindow(deliveryWindow(deliveryConfig, deliveryDistrict, "PICKUP"), intlLocale), right: t("Free") }] : []),
                ]}
              />
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 10 }}>
                {shippingMethod === "PICKUP" && deliveryConfig
                  ? t("Pick up at {address}. We'll call you when it's ready.", { address: deliveryConfig.pickupAddress })
                  : deliveryDistrict
                    ? t("Estimated for {district}. Orders after {time} are handled the next day.", { district: deliveryDistrict, time: `${String(deliveryConfig?.cutoffHour ?? 15).padStart(2, '0')}:00` })
                    : t("Choose your district above to see the delivery date.")}
              </p>
            </section>

            {/* Payment method: mobile money first, it's how most customers pay */}
            <section style={{ marginBottom: 32 }}>
              <h2 className="checkout-h2" style={{ marginBottom: 16 }}><Wallet size={18} /> {t("Payment method")}</h2>
              <ChoiceGroup
                label={t("Payment method")}
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  { value: "MOMO", title: "MTN Mobile Money", sub: t("Approve the payment on your phone"), logo: <PayLogo bg="#ffcb05" fg="#111">MTN</PayLogo> },
                  { value: "AIRTEL_MONEY", title: "Airtel Money", sub: t("Approve the payment on your phone"), logo: <PayLogo bg="#e40000" fg="#fff">airtel</PayLogo> },
                  { value: "CARD", title: t("Credit / debit card"), sub: "Visa · Mastercard", logo: <PayLogo bg="var(--accent)" fg="#fff"><CreditCard size={16} /></PayLogo> },
                  ...(shippingMethod === "PICKUP" ? [{ value: "CASH", title: t("Cash / cheque on pickup"), sub: t("Pay when you collect your order"), logo: <PayLogo bg="var(--success)" fg="#fff"><Banknote size={16} /></PayLogo> }] : []),
                ]}
              />

              {paymentMethod === "CARD" && (
                <div className="checkout-panel" style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Card details")}</h3>
                  <div style={{ padding: "12px 16px", border: "1px solid var(--input-border)", borderRadius: 10, background: "var(--input-bg)" }}>
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <Lock size={12} /> {t("Secured by Stripe. Your card details never touch our servers.")}
                  </p>
                </div>
              )}

              {(paymentMethod === "MOMO" || paymentMethod === "AIRTEL_MONEY") && (
                <div className="checkout-panel" style={{ marginTop: 16 }}>
                  <label htmlFor="momo-phone" className="field-label" style={{ marginTop: 0 }}>
                    {paymentMethod === "MOMO" ? t("MTN MoMo number") : t("Airtel Money number")}
                  </label>
                  <input id="momo-phone" className="noir-input" type="tel" inputMode="tel" autoComplete="tel"
                    value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)}
                    placeholder={paymentMethod === "MOMO" ? "0788 123 456" : "0732 123 456"}
                    aria-invalid={momoHint ? true : undefined} aria-describedby="momo-help" />
                  <p id="momo-help" style={{ fontSize: 12, color: momoHint ? "var(--warning)" : "var(--text-secondary)", marginTop: 8 }}>
                    {momoHint || t("A payment prompt will be sent to this number. Approve it with your PIN.")}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Order Summary */}
          <aside>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", borderRadius: 20, padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>{t("Order summary")}</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                {cart?.items?.map((item) => (
                  <div key={item.cartItemId ?? item.id} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
                    <span style={{ position: "relative", flexShrink: 0, width: 52, height: 52, borderRadius: 10, background: "#fff", border: "1px solid var(--card-border)" }}>
                      <img src={getProductThumb(item.product ?? item)} alt="" onError={handleProductImageError} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4, borderRadius: 10 }} />
                      <span className="checkout-qty" aria-label={t("Quantity {n}", { n: item.quantity })}>{item.quantity}</span>
                    </span>
                    <span style={{ flex: 1, minWidth: 0, color: "var(--text-secondary)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.productName}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap" }}>{formatPrice(getItemTotal(item))}</span>
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
                  {t("Card payments are charged in USD:")} <strong style={{ color: "var(--text-primary)" }}>{formatUsd(total)}</strong>{t(", converted from the RWF total at today's exchange rate.")}
                </p>
              )}

              <button onClick={handlePlaceOrder} disabled={loading || !cart?.items?.length || (paymentMethod === "CARD" && !stripe)}
                className="noir-btn-cta shine"
                style={{ width: "100%", padding: "14px", fontSize: 15, opacity: loading ? 0.7 : 1 }}>
                {loading ? t("Processing…") : t("Confirm & pay")}
              </button>
            </div>
          </aside>

          {/* Phones: the total and the pay button stay in reach while filling the form (UX audit B7) */}
          <div className="checkout-paybar">
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{t("Total")}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: "var(--price-color)", whiteSpace: "nowrap" }}>{formatPrice(total)}</p>
            </div>
            <button onClick={handlePlaceOrder} disabled={loading || !cart?.items?.length || (paymentMethod === "CARD" && !stripe)}
              className="noir-btn-cta" style={{ flex: 1, maxWidth: 240, minHeight: 48, fontSize: 15 }}>
              {loading ? t("Processing…") : t("Confirm & pay")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  // Guests give a name and phone first (UX audit A2); the form below needs a session.
  if (!user) return <GuestCheckoutGate />;
  return (
    <Elements stripe={getStripe()}>
      <CheckoutForm />
    </Elements>
  );
}

// Radio options shown as cards: everything visible at once, one tap to choose (UX audit A3).
function ChoiceGroup({ label, value, onChange, options }) {
  return (
    <div role="radiogroup" aria-label={label} className="choice-group">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <label key={o.value} className={`choice-card${on ? " on" : ""}`}>
            <input type="radio" checked={on} onChange={() => onChange(o.value)} />
            {o.logo}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="choice-title">{o.title}</span>
              {o.sub && <span className="choice-sub">{o.sub}</span>}
            </span>
            {o.right && <span className="choice-right">{o.right}</span>}
            <span className="choice-dot" aria-hidden>{on && <Check size={12} strokeWidth={3} />}</span>
          </label>
        );
      })}
    </div>
  );
}

function PayLogo({ bg, fg, children }) {
  return (
    <span aria-hidden style={{ flexShrink: 0, width: 44, height: 30, borderRadius: 7, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, letterSpacing: "-0.01em" }}>
      {children}
    </span>
  );
}
