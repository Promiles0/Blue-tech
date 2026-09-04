import { createClient, type User } from "npm:@supabase/supabase-js@2";
import { Ratelimit } from "npm:@upstash/ratelimit@2";
import { Redis } from "npm:@upstash/redis@1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceRoleKey);
const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID") ?? "71259894069-n4mnjohm3rjtvj36rn5apq18qie2945q.apps.googleusercontent.com";
const jwtSecret = Deno.env.get("JWT_SECRET") ?? serviceRoleKey;

// ── Rate limiting (Upstash Redis) ───────────────────────────────────────────
// Edge functions are stateless between invocations — an in-memory counter would
// reset on every cold start and wouldn't be shared across concurrent instances,
// so counters live in Upstash's REST-based Redis instead.
//
// Set these in the Supabase dashboard: Project Settings → Edge Functions → Secrets
// (or `supabase secrets set UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=...`)
// Get the values from an Upstash Redis database (free tier): upstash.com → Create
// Database → REST API section → copy "UPSTASH_REDIS_REST_URL" and
// "UPSTASH_REDIS_REST_TOKEN" verbatim (same names).
//
// Until those secrets are set, rate limiting is skipped entirely (fails open) —
// this lets the function keep working before Upstash is configured, rather than
// hard-failing every request.
const upstashUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
const upstashToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
const redis = upstashUrl && upstashToken ? new Redis({ url: upstashUrl, token: upstashToken }) : null;
if (!redis) console.warn("Rate limiting disabled: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set.");

const rateLimiters = redis ? {
  authLogin: new Ratelimit({ redis, prefix: "rl:auth-login", limiter: Ratelimit.slidingWindow(5, "15 m") }),
  authRegister: new Ratelimit({ redis, prefix: "rl:auth-register", limiter: Ratelimit.slidingWindow(3, "1 h") }),
  authGoogle: new Ratelimit({ redis, prefix: "rl:auth-google", limiter: Ratelimit.slidingWindow(5, "15 m") }),
  coupon: new Ratelimit({ redis, prefix: "rl:coupon", limiter: Ratelimit.slidingWindow(10, "1 h") }),
  checkout: new Ratelimit({ redis, prefix: "rl:checkout", limiter: Ratelimit.slidingWindow(20, "1 h") }),
  quoteRequest: new Ratelimit({ redis, prefix: "rl:quote-request", limiter: Ratelimit.slidingWindow(5, "1 h") }),
  global: new Ratelimit({ redis, prefix: "rl:global", limiter: Ratelimit.slidingWindow(100, "1 m") }),
} : null;

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Reusable guard — call at the top of any handler that needs a limit. Throws a
// Response (caught by the top-level Deno.serve handler) on rejection, same
// pattern as requireUser/requireAdmin.
async function enforceRateLimit(limiter: Ratelimit | undefined, identifier: string, request?: Request) {
  if (!limiter) return; // Upstash not configured — fail open
  const { success, reset } = await limiter.limit(identifier);
  if (!success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    throw new Response(JSON.stringify({ success: false, message: "Too many attempts, try again later" }), {
      status: 429,
      headers: { ...corsHeaders(request), "Content-Type": "application/json", "Retry-After": String(retryAfterSeconds) },
    });
  }
}

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://blue-tech.onrender.com",
];

const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...configuredOrigins,
]);

function corsHeaders(request?: Request) {
  const origin = request?.headers.get("Origin") ?? "";
  const allowedOrigin = allowedOrigins.has(origin) ? origin : DEFAULT_ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Vary": "Origin",
  };
}

function withCors(response: Response, request: Request) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request)).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const response = (body: unknown, status = 200, request?: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });

const success = (message: string, data: unknown, request?: Request) => response({ success: true, message, data }, 200, request);
const failure = (message: string, status = 400, request?: Request) => response({ success: false, message }, status, request);
const categoryResult = (category: Record<string, unknown>) => ({ ...category, categoryId: category.id, categoryName: category.name });
const variantResult = (variant: Record<string, unknown>) => ({ ...variant, variantId: variant.id, skuCode: variant.sku_code, sizeOrColor: variant.size_or_color, priceAdjustment: variant.price_adjustment, stockQuantity: variant.stock_quantity });
const imageResult = (image: Record<string, unknown>) => ({ ...image, imageId: image.id, imageUrl: image.image_url, isPrimary: image.is_primary });
// Whitelists public.users columns for client responses — never spread the raw row (it carries
// password_hash, provider_id and other fields that must never leave the server).
const userResult = (row: Record<string, unknown> | null | undefined) => row ? ({
  id: row.id,
  userId: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  picture: row.picture,
  role: row.role,
  isSuspended: row.is_suspended,
  createdAt: row.created_at,
}) : null;

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlJson(data: Record<string, unknown>) {
  return base64Url(new TextEncoder().encode(JSON.stringify(data)));
}

function decodeBase64UrlJson(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))));
}

async function signAppToken(user: Record<string, unknown>) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({
    sub: user.id,
    email: user.email,
    role: user.role ?? "user",
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
    iss: "blue-tech-edge",
  });
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

async function verifyAppToken(token: string) {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expected = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`));
    if (base64Url(new Uint8Array(expected)) !== signature) return null;
    const claims = decodeBase64UrlJson(payload);
    if (!claims.sub || Number(claims.exp ?? 0) < Math.floor(Date.now() / 1000)) return null;
    const { data: user } = await adminClient.from("users").select("*").eq("id", claims.sub).maybeSingle();
    return user ?? null;
  } catch {
    return null;
  }
}

async function findAuthUserByEmail(email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function authUserIdForGoogleUser(email: string, name: string | null, picture: string | null) {
  const existing = await findAuthUserByEmail(email);
  if (existing) return existing.id;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    password: crypto.randomUUID(),
    user_metadata: { name, picture, provider: "google" },
  });
  if (error || !data.user) throw error ?? new Error("Unable to create user");
  return data.user.id;
}

function authResult(user: Record<string, unknown>, token: string) {
  return {
    token,
    user: {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      picture: user.picture,
      role: user.role,
    },
  };
}

function toNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && typeof (error as Record<string, unknown>).message === "string") {
    return (error as Record<string, unknown>).message as string;
  }
  return fallback;
}

function statusKey(value: unknown) {
  return String(value ?? "PENDING").toUpperCase();
}

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function ym(date: Date) {
  return date.toISOString().slice(0, 7);
}

function isCancelled(order: Record<string, unknown>) {
  return statusKey(order.status) === "CANCELLED";
}

async function tableCount(table: string, filters?: (query: any) => unknown) {
  let query = adminClient.from(table).select("id", { count: "exact", head: true });
  if (filters) query = filters(query) as typeof query;
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function getOrderRows() {
  const { data, error } = await adminClient
    .from("orders")
    .select("id,total_amount,status,created_at,ordered_at,user_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

async function getLowStockAlerts(limit = 8) {
  const { data, error } = await adminClient
    .from("product_variants")
    .select("sku_code,stock_quantity,products(name)")
    .lt("stock_quantity", 5)
    .order("stock_quantity", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    productName: (row.products as Record<string, unknown> | null)?.name ?? "Product",
    skuCode: row.sku_code,
    currentStock: toNumber(row.stock_quantity),
  }));
}

async function getRecentOrders(orderRows: Record<string, unknown>[]) {
  const recent = orderRows.slice(0, 5);
  const userIds = [...new Set(recent.map((order) => order.user_id).filter(Boolean))];
  const usersById = new Map<string, Record<string, unknown>>();

  if (userIds.length) {
    const { data } = await adminClient
      .from("users")
      .select("id,name,email")
      .in("id", userIds);
    ((data ?? []) as Record<string, unknown>[]).forEach((user) => usersById.set(String(user.id), user));
  }

  return recent.map((order) => {
    const customer = usersById.get(String(order.user_id));
    return {
      orderId: order.id,
      customerName: customer?.name ?? customer?.email ?? "Guest",
      totalAmount: toNumber(order.total_amount),
      status: statusKey(order.status),
      orderedAt: order.ordered_at ?? order.created_at,
    };
  });
}

function buildRevenueSeries(orderRows: Record<string, unknown>[]) {
  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    buckets.set(ymd(date), 0);
  }

  const oldest = new Date();
  oldest.setDate(oldest.getDate() - 13);
  oldest.setHours(0, 0, 0, 0);

  orderRows
    .filter((order) => !isCancelled(order))
    .forEach((order) => {
      const createdAt = order.created_at ? new Date(String(order.created_at)) : null;
      if (!createdAt || createdAt < oldest) return;
      const key = ymd(createdAt);
      buckets.set(key, (buckets.get(key) ?? 0) + toNumber(order.total_amount));
    });

  return [...buckets.entries()].map(([date, revenue]) => ({ date, revenue }));
}

async function getAdminDashboardStats() {
  const now = Date.now();
  const minus24h = new Date(now - 24 * 60 * 60 * 1000);
  const minus7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const minus30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [orderRows, totalCustomers, totalVariants, lowStockAlerts, newCustomers24h] = await Promise.all([
    getOrderRows(),
    tableCount("users"),
    tableCount("product_variants"),
    getLowStockAlerts(),
    tableCount("users", (query) => query.gte("created_at", isoDaysAgo(1))),
  ]);

  const activeOrders = orderRows.filter((order) => !isCancelled(order));
  const sumAfter = (date: Date) => activeOrders
    .filter((order) => order.created_at && new Date(String(order.created_at)) >= date)
    .reduce((sum, order) => sum + toNumber(order.total_amount), 0);

  const orders30dRows = activeOrders.filter((order) => order.created_at && new Date(String(order.created_at)) >= minus30d);
  const ordersByStatus = activeOrders.reduce((acc, order) => {
    const key = statusKey(order.status);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const revenue30d = sumAfter(minus30d);

  return {
    revenue24h: sumAfter(minus24h),
    revenue7d: sumAfter(minus7d),
    revenue30d,
    totalRevenue: activeOrders.reduce((sum, order) => sum + toNumber(order.total_amount), 0),
    aov: orders30dRows.length ? Number((revenue30d / orders30dRows.length).toFixed(2)) : 0,
    orders30d: orders30dRows.length,
    totalOrders: orderRows.length,
    totalCustomers,
    totalVariants,
    ordersToday: activeOrders.filter((order) => order.created_at && new Date(String(order.created_at)) >= new Date(startOfTodayIso())).length,
    lowStockCount: lowStockAlerts.length,
    pendingOrders: ordersByStatus.PENDING ?? 0,
    newCustomers24h,
    ordersByStatus,
    lowStockAlerts,
    topSellers: await getTopSellers(),
    revenueSeries: buildRevenueSeries(orderRows),
    recentOrders: await getRecentOrders(orderRows),
  };
}

async function getOrderItemRows() {
  const { data, error } = await adminClient
    .from("order_items")
    .select("quantity,unit_price,product_variants(products(name,categories(name)))");
  if (error) return [];
  return (data ?? []) as Record<string, unknown>[];
}

function orderItemProduct(item: Record<string, unknown>) {
  return ((item.product_variants as Record<string, unknown> | null)?.products ?? {}) as Record<string, unknown>;
}

async function getTopSellers() {
  const totals = new Map<string, { productName: string; totalSold: number; revenue: number }>();
  const items = await getOrderItemRows();

  items.forEach((item) => {
    const product = orderItemProduct(item);
    const productName = String(product.name ?? "Product");
    const totalSold = toNumber(item.quantity);
    const revenue = totalSold * toNumber(item.unit_price);
    const current = totals.get(productName) ?? { productName, totalSold: 0, revenue: 0 };
    current.totalSold += totalSold;
    current.revenue += revenue;
    totals.set(productName, current);
  });

  return [...totals.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

async function getAdminAnalytics() {
  const [topSellers, users] = await Promise.all([
    getTopSellers(),
    adminClient.from("users").select("created_at").order("created_at", { ascending: true }),
  ]);

  const categoryTotals = new Map<string, number>();
  const items = await getOrderItemRows();
  items.forEach((item) => {
    const product = orderItemProduct(item);
    const category = ((product.categories as Record<string, unknown> | null)?.name ?? "Uncategorized") as string;
    const revenue = toNumber(item.quantity) * toNumber(item.unit_price);
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + revenue);
  });

  const growthBuckets = new Map<string, number>();
  (((users.data ?? []) as Record<string, unknown>[])).forEach((user) => {
    if (!user.created_at) return;
    const key = ym(new Date(String(user.created_at)));
    growthBuckets.set(key, (growthBuckets.get(key) ?? 0) + 1);
  });

  return {
    topProducts: topSellers.map((seller) => ({ name: seller.productName, revenue: seller.revenue })),
    byCategory: [...categoryTotals.entries()].map(([name, value]) => ({ name, value })),
    growth: [...growthBuckets.entries()].map(([month, count]) => ({ month, count })),
  };
}

async function productResult(product: Record<string, unknown>) {
  const [{ data: variants }, { data: images }] = await Promise.all([
    adminClient.from("product_variants").select("*").eq("product_id", product.id),
    adminClient.from("product_images").select("*").eq("product_id", product.id),
  ]);
  const imageRows = (images ?? []) as Record<string, unknown>[];
  const primaryImage = imageRows.find((image) => image.is_primary) ?? imageRows[0];
  return {
    ...product,
    productId: product.id,
    categoryId: product.category_id,
    screenSize: product.screen_size,
    resolution: product.resolution,
    touchPoints: product.touch_points,
    os: product.os,
    connectivity: product.connectivity,
    warranty: product.warranty,
    variants: (variants ?? []).map(variantResult),
    images: imageRows.map(imageResult),
    imageUrl: primaryImage?.image_url ?? null,
    primaryImageUrl: primaryImage?.image_url ?? null,
  };
}

async function getOrCreateCartId(userId: string) {
  const { data: existing, error: existingError } = await adminClient.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing.id as number;
  const { data, error } = await adminClient.from("carts").insert({ user_id: userId }).select("id").single();
  if (error) throw error;
  return data.id as number;
}

async function getCartDetails(cartId: number) {
  const { data, error } = await adminClient
    .from("cart_items")
    .select("id,variant_id,quantity,product_variants(id,sku_code,size_or_color,price_adjustment,products(id,name,price,product_images(image_url,is_primary)))")
    .eq("cart_id", cartId);
  if (error) throw error;

  const items = ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const variant = (row.product_variants ?? {}) as Record<string, unknown>;
    const product = (variant.products ?? {}) as Record<string, unknown>;
    const images = (product.product_images ?? []) as Record<string, unknown>[];
    const primary = images.find((image) => image.is_primary) ?? images[0];
    const unitPrice = toNumber(product.price) + toNumber(variant.price_adjustment);
    return {
      cartItemId: row.id,
      variantId: variant.id,
      quantity: toNumber(row.quantity),
      unitPrice,
      sizeOrColor: variant.size_or_color ?? null,
      skuCode: variant.sku_code ?? null,
      productName: product.name ?? "Product",
      product: {
        productId: product.id,
        name: product.name,
        imageUrl: primary?.image_url ?? null,
        primaryImageUrl: primary?.image_url ?? null,
      },
    };
  });

  const cartTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return { items, cartTotal: Number(cartTotal.toFixed(2)) };
}

function addressResult(address: Record<string, unknown>) {
  return {
    id: address.id,
    addressId: address.id,
    recipientName: address.recipient_name,
    phoneNumber: address.phone_number,
    phone: address.phone_number,
    streetAddress: address.street_address,
    street: address.street_address,
    city: address.city,
    state: address.state,
    zipCode: address.zip_code,
    landmarks: address.landmarks,
    country: address.country,
    isDefault: address.is_default,
  };
}

async function unsetDefaultAddresses(userId: string) {
  const { error } = await adminClient.from("addresses").update({ is_default: false }).eq("user_id", userId).eq("is_default", true);
  if (error) throw error;
}

async function findOrCreateOrderAddress(userId: string, fields: { street: string; city: string; state?: string | null; zipCode?: string | null; country: string; phone: string; recipientName: string }) {
  const { data: existingAddresses, error } = await adminClient.from("addresses").select("*").eq("user_id", userId);
  if (error) throw error;
  const match = ((existingAddresses ?? []) as Record<string, unknown>[]).find((address) =>
    String(address.street_address ?? "").toLowerCase() === fields.street.toLowerCase() &&
    String(address.city ?? "").toLowerCase() === fields.city.toLowerCase() &&
    String(address.country ?? "").toLowerCase() === fields.country.toLowerCase() &&
    (!fields.zipCode || String(address.zip_code ?? "").toLowerCase() === fields.zipCode.toLowerCase())
  );
  if (match) return match;

  const isFirst = (existingAddresses ?? []).length === 0;
  const { data: created, error: insertError } = await adminClient.from("addresses").insert({
    user_id: userId,
    recipient_name: fields.recipientName,
    phone_number: fields.phone,
    street_address: fields.street,
    city: fields.city,
    state: fields.state ?? null,
    zip_code: fields.zipCode ?? null,
    country: fields.country,
    is_default: isFirst,
  }).select().single();
  if (insertError) throw insertError;
  return created;
}

async function reduceVariantStock(variantId: number, quantity: number) {
  const { data: variant, error } = await adminClient.from("product_variants").select("stock_quantity").eq("id", variantId).single();
  if (error) throw error;
  const current = toNumber(variant.stock_quantity);
  if (current < quantity) return false;
  const { data, error: updateError } = await adminClient
    .from("product_variants")
    .update({ stock_quantity: current - quantity })
    .eq("id", variantId)
    .eq("stock_quantity", current)
    .select("id")
    .maybeSingle();
  if (updateError) throw updateError;
  return Boolean(data);
}

async function restoreVariantStock(variantId: number, quantity: number) {
  const { data: variant } = await adminClient.from("product_variants").select("stock_quantity").eq("id", variantId).maybeSingle();
  const current = toNumber(variant?.stock_quantity);
  await adminClient.from("product_variants").update({ stock_quantity: current + quantity }).eq("id", variantId);
}

async function notifyUser(userId: string, message: string) {
  await adminClient.from("notifications").insert({ user_id: userId, message });
}

async function checkoutOrder(user: User, body: Record<string, unknown>, request: Request) {
  const cartId = await getOrCreateCartId(user.id);
  const { data: cartItems, error: cartItemsError } = await adminClient
    .from("cart_items")
    .select("id,variant_id,quantity,product_variants(id,stock_quantity,price_adjustment,size_or_color,products(id,name,price))")
    .eq("cart_id", cartId);
  if (cartItemsError) throw cartItemsError;
  if (!cartItems || cartItems.length === 0) throw new Error("Cannot checkout with an empty cart");

  const street = String(body.street ?? "").trim();
  const city = String(body.city ?? "").trim();
  const country = String(body.country ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  if (!street || !city || !country || !phone) throw new Error("A complete shipping address is required");

  const { data: profile } = await adminClient.from("users").select("name,email,phone").eq("id", user.id).maybeSingle();
  const recipientName = profile?.name ?? profile?.email ?? user.email ?? "Customer";

  const address = await findOrCreateOrderAddress(user.id, {
    street, city, country, phone,
    state: body.state ? String(body.state) : null,
    zipCode: body.zipCode ? String(body.zipCode) : null,
    recipientName,
  });

  const shippingMethod = ["STANDARD", "EXPRESS", "PICKUP"].includes(String(body.shippingMethod ?? "").toUpperCase())
    ? String(body.shippingMethod).toUpperCase()
    : "STANDARD";
  const shippingFee = shippingMethod === "EXPRESS" ? 5 : 0;

  const paymentMethod = ["CARD", "MOMO", "AIRTEL_MONEY", "CASH", "CHEQUE"].includes(String(body.paymentMethod ?? "").toUpperCase())
    ? String(body.paymentMethod).toUpperCase()
    : "CARD";
  if ((paymentMethod === "CASH" || paymentMethod === "CHEQUE") && shippingMethod !== "PICKUP") {
    throw new Error("Cash and Cheque payments are only available for Pickup orders.");
  }

  const { data: order, error: orderError } = await adminClient.from("orders").insert({
    user_id: user.id,
    address_id: address.id,
    status: "pending",
    shipping_method: shippingMethod,
    payment_method: paymentMethod,
    shipping_fee: shippingFee,
    order_address_street: street,
    order_address_city: city,
    order_address_country: country,
    order_address_phone_number: phone,
    order_address_recipient: recipientName,
    total_amount: 0,
  }).select().single();
  if (orderError) throw orderError;

  const reduced: { variantId: number; quantity: number }[] = [];
  let itemsTotal = 0;

  try {
    for (const cartItem of cartItems as Record<string, unknown>[]) {
      const variant = (cartItem.product_variants ?? {}) as Record<string, unknown>;
      const product = (variant.products ?? {}) as Record<string, unknown>;
      const quantity = toNumber(cartItem.quantity);
      const variantId = variant.id as number;

      const ok = await reduceVariantStock(variantId, quantity);
      if (!ok) throw new Error(`Out of stock: ${product.name ?? "item"} (${variant.size_or_color ?? ""})`);
      reduced.push({ variantId, quantity });

      const unitPrice = toNumber(product.price) + toNumber(variant.price_adjustment);
      itemsTotal += unitPrice * quantity;

      const { error: itemError } = await adminClient.from("order_items").insert({
        order_id: order.id,
        variant_id: variantId,
        quantity,
        unit_price: unitPrice,
      });
      if (itemError) throw itemError;
    }

    let totalAmount = itemsTotal;
    const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim() : "";
    if (couponCode) {
      // Coupon codes are short strings — guard against brute-forcing valid ones.
      await enforceRateLimit(rateLimiters?.coupon, `ip:${clientIp(request)}`, request);
      const { data: coupon, error: couponError } = await adminClient.from("coupons").select("*").ilike("code", couponCode).maybeSingle();
      if (couponError) throw couponError;
      if (!coupon) throw new Error("Invalid coupon code");
      if (!coupon.is_active) throw new Error("Coupon is no longer active");
      const now = new Date();
      if (coupon.ends_at && new Date(coupon.ends_at) < now) throw new Error("Coupon has expired");
      if (coupon.starts_at && new Date(coupon.starts_at) > now) throw new Error("Coupon is not yet valid");
      if (coupon.max_uses != null && toNumber(coupon.uses) >= toNumber(coupon.max_uses)) throw new Error("Coupon usage limit reached");
      if (coupon.min_subtotal != null && itemsTotal < toNumber(coupon.min_subtotal)) throw new Error("Order subtotal does not meet the minimum required for this coupon");

      const discount = coupon.kind === "PERCENT" ? itemsTotal * (toNumber(coupon.coupon_value) / 100) : toNumber(coupon.coupon_value);
      totalAmount = Math.max(0, itemsTotal - discount);

      // Compare-and-swap on the current `uses` value (same pattern as reduceVariantStock) so two
      // concurrent checkouts can't both read uses=N and both redeem a single-use coupon before
      // either write lands — a plain read-then-write here would lose one of the increments.
      const { data: couponUpdated, error: couponUpdateError } = await adminClient
        .from("coupons")
        .update({ uses: toNumber(coupon.uses) + 1 })
        .eq("id", coupon.id)
        .eq("uses", coupon.uses)
        .select("id")
        .maybeSingle();
      if (couponUpdateError) throw couponUpdateError;
      if (!couponUpdated) throw new Error("Coupon could not be applied — please try again");
    }

    totalAmount = Number((totalAmount + shippingFee).toFixed(2));

    const { error: updateError } = await adminClient.from("orders").update({ total_amount: totalAmount, ordered_at: new Date().toISOString() }).eq("id", order.id);
    if (updateError) throw updateError;

    const { error: clearCartError } = await adminClient.from("cart_items").delete().eq("cart_id", cartId);
    if (clearCartError) throw clearCartError;

    await notifyUser(user.id, `Your order #${order.id} has been placed for $${totalAmount.toFixed(2)}.`);

    return { orderId: order.id, totalAmount, status: "PENDING" };
  } catch (error) {
    for (const item of reduced) await restoreVariantStock(item.variantId, item.quantity);
    await adminClient.from("order_items").delete().eq("order_id", order.id);
    await adminClient.from("orders").delete().eq("id", order.id);
    throw error;
  }
}

async function orderItemsForOrder(orderId: number) {
  const { data, error } = await adminClient
    .from("order_items")
    .select("quantity,unit_price,product_variants(id,size_or_color,products(id,name,product_images(image_url,is_primary)))")
    .eq("order_id", orderId);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const variant = (row.product_variants ?? {}) as Record<string, unknown>;
    const product = (variant.products ?? {}) as Record<string, unknown>;
    const images = (product.product_images ?? []) as Record<string, unknown>[];
    const primary = images.find((image) => image.is_primary) ?? images[0];
    const quantity = toNumber(row.quantity);
    const unitPrice = toNumber(row.unit_price);
    return {
      productId: product.id,
      productName: product.name ?? "Product",
      variantInfo: variant.size_or_color ?? null,
      quantity,
      priceAtPurchase: unitPrice,
      subtotal: Number((unitPrice * quantity).toFixed(2)),
      product: { productId: product.id, imageUrl: primary?.image_url ?? null, primaryImageUrl: primary?.image_url ?? null },
    };
  });
}

function derivedPaymentStatus(status: unknown) {
  const key = statusKey(status);
  if (key === "CANCELLED") return "FAILED";
  if (key === "PENDING") return "PENDING";
  return "COMPLETED";
}

async function orderResult(order: Record<string, unknown>) {
  const items = await orderItemsForOrder(order.id as number);
  const { data: shipment } = await adminClient.from("shipments").select("*").eq("order_id", order.id).maybeSingle();
  return {
    orderId: order.id,
    totalAmount: toNumber(order.total_amount),
    shippingFee: toNumber(order.shipping_fee),
    shippingMethod: order.shipping_method,
    paymentMethod: order.payment_method,
    status: statusKey(order.status),
    paymentStatus: derivedPaymentStatus(order.status),
    createdAt: order.created_at,
    shippingStreet: order.order_address_street,
    shippingCity: order.order_address_city,
    shippingCountry: order.order_address_country,
    shippingPhoneNumber: order.order_address_phone_number,
    shippingLandmarks: order.order_address_landmarks,
    shippingRecipient: order.order_address_recipient,
    items,
    shipmentInfo: shipment ? {
      carrier: shipment.carrier,
      trackingNumber: shipment.tracking_number,
      status: shipment.status,
      shippedAt: shipment.shipped_at,
    } : null,
  };
}

async function markOrderPaid(orderId: number) {
  const { data: order } = await adminClient.from("orders").update({ status: "paid" }).eq("id", orderId).select("user_id,total_amount").maybeSingle();
  if (order?.user_id) {
    await notifyUser(order.user_id as string, `Payment for order #${orderId} was successful. Your order is now being processed.`);
  }
}

async function adminOrderCustomer(userId: unknown) {
  if (!userId) return {} as Record<string, unknown>;
  const { data } = await adminClient.from("users").select("name,email,phone").eq("id", userId).maybeSingle();
  return (data ?? {}) as Record<string, unknown>;
}

async function adminOrderListResult(order: Record<string, unknown>) {
  const customer = await adminOrderCustomer(order.user_id);
  const { count } = await adminClient.from("order_items").select("id", { count: "exact", head: true }).eq("order_id", order.id);
  return {
    orderId: order.id,
    customerName: customer.name ?? null,
    customerEmail: customer.email ?? null,
    itemCount: count ?? 0,
    totalAmount: toNumber(order.total_amount),
    status: statusKey(order.status),
    orderedAt: order.ordered_at ?? order.created_at,
  };
}

async function adminOrderDetailResult(order: Record<string, unknown>) {
  const customer = await adminOrderCustomer(order.user_id);
  const items = await orderItemsForOrder(order.id as number);
  const { data: payment } = await adminClient.from("payment_records").select("*").eq("order_id", order.id).maybeSingle();
  const { data: shipment } = await adminClient.from("shipments").select("*").eq("order_id", order.id).maybeSingle();

  return {
    orderId: order.id,
    totalAmount: toNumber(order.total_amount),
    status: statusKey(order.status),
    orderedAt: order.ordered_at ?? order.created_at,
    customerName: customer.name ?? null,
    customerEmail: customer.email ?? null,
    customerPhone: order.order_address_phone_number ?? customer.phone ?? null,
    addressStreet: order.order_address_street,
    addressCity: order.order_address_city,
    addressCountry: order.order_address_country,
    items,
    payment: payment ? {
      paymentId: payment.id,
      status: payment.status,
      amount: toNumber(payment.amount),
      paidAt: payment.updated_at,
      paymentMethod: payment.payment_method,
      transactionReference: payment.transaction_reference,
    } : null,
    shipment: shipment ? {
      shipmentId: shipment.id,
      carrier: shipment.carrier,
      trackingNumber: shipment.tracking_number,
      status: shipment.status,
      shippedAt: shipment.shipped_at,
    } : null,
  };
}

async function orderStatsForUser(userId: string) {
  const { data, error } = await adminClient.from("orders").select("total_amount").eq("user_id", userId);
  if (error) throw error;
  const rows = (data ?? []) as Record<string, unknown>[];
  return { orderCount: rows.length, totalSpent: Number(rows.reduce((sum, o) => sum + toNumber(o.total_amount), 0).toFixed(2)) };
}

function adminUserRow(row: Record<string, unknown>, stats: { orderCount: number; totalSpent: number }) {
  return {
    userId: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    suspended: Boolean(row.is_suspended),
    createdAt: row.created_at,
    lastLogin: row.last_login,
    orderCount: stats.orderCount,
    totalSpent: stats.totalSpent,
  };
}

async function adminUserResult(row: Record<string, unknown>) {
  return adminUserRow(row, await orderStatsForUser(row.id as string));
}

async function getAdminUsersList(search: string | null) {
  const { data, error } = await adminClient.from("users").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  let rows = (data ?? []) as Record<string, unknown>[];
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((u) => String(u.name ?? "").toLowerCase().includes(q) || String(u.email ?? "").toLowerCase().includes(q));
  }

  const { data: orders } = await adminClient.from("orders").select("user_id,total_amount");
  const statsByUser = new Map<string, { orderCount: number; totalSpent: number }>();
  ((orders ?? []) as Record<string, unknown>[]).forEach((order) => {
    const key = String(order.user_id);
    const current = statsByUser.get(key) ?? { orderCount: 0, totalSpent: 0 };
    current.orderCount += 1;
    current.totalSpent += toNumber(order.total_amount);
    statsByUser.set(key, current);
  });

  return rows.map((row) => adminUserRow(row, statsByUser.get(String(row.id)) ?? { orderCount: 0, totalSpent: 0 }));
}

function adminShipmentResult(row: Record<string, unknown>) {
  const order = (row.orders ?? {}) as Record<string, unknown>;
  const customer = (order.users ?? {}) as Record<string, unknown>;
  return {
    shipmentId: row.id,
    orderId: row.order_id,
    customerEmail: customer.email ?? null,
    carrier: row.carrier,
    trackingNumber: row.tracking_number,
    status: row.status,
    shippedAt: row.shipped_at,
  };
}

function adminReviewResult(row: Record<string, unknown>) {
  const product = (row.products ?? {}) as Record<string, unknown>;
  const author = (row.users ?? {}) as Record<string, unknown>;
  return {
    reviewId: row.id,
    productName: product.name ?? null,
    authorName: author.name ?? null,
    authorEmail: author.email ?? null,
    rating: row.rating,
    comment: row.comment,
    hidden: Boolean(row.hidden),
    createdAt: row.created_at,
  };
}

function couponResult(row: Record<string, unknown>) {
  return {
    couponId: row.id,
    code: row.code,
    kind: row.kind,
    value: toNumber(row.coupon_value),
    minSubtotal: row.min_subtotal != null ? toNumber(row.min_subtotal) : null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    maxUses: row.max_uses,
    uses: toNumber(row.uses),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

function quoteRequestResult(row: Record<string, unknown>) {
  return {
    quoteRequestId: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    organization: row.organization,
    intendedUse: row.intended_use,
    screenSize: row.screen_size,
    quantity: toNumber(row.quantity),
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ── Resend (transactional email) ────────────────────────────────────────────
// TODO: set RESEND_API_KEY once you've created a free Resend account (resend.com)
// and generated an API key — Supabase dashboard: Project Settings → Edge Functions
// → Secrets (or `supabase secrets set RESEND_API_KEY=...`). Until it's set, email
// sending is skipped (logged, not thrown) so quote requests still save successfully.
//
// TODO: verify a sending domain in Resend and swap this "from" address for a real
// one on that domain (e.g. quotes@blue-tech.com). While developing, you can leave
// this as Resend's built-in test/onboarding domain instead: "onboarding@resend.dev".
const RESEND_FROM_EMAIL = "Blue-Tech <quotes@blue-tech.com>"; // TODO: verify domain, or use onboarding@resend.dev for now

// Where internal "new quote request" notifications land. Falls back to the site's
// public support inbox (kept in sync manually with Frontend/src/lib/helpLinks.js's
// SUPPORT_EMAIL — separate runtime/build, so it can't be shared directly). Override
// by setting a QUOTE_NOTIFICATION_EMAIL secret if you want a dedicated inbox.
const QUOTE_NOTIFICATION_EMAIL = Deno.env.get("QUOTE_NOTIFICATION_EMAIL") ?? "bluetech2020@gmail.com";

async function sendResendEmail(payload: { from: string; to: string; subject: string; html: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email send. See the TODO above RESEND_FROM_EMAIL.");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Resend send failed (${res.status}): ${body}`);
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[char] ?? char);
}

function internalQuoteEmailHtml(fields: {
  name: string; email: string; phone: string; organization: string | null;
  intendedUse: string; screenSize: string; quantity: number; notes: string | null;
}) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:13px;color:#111;">${escapeHtml(value)}</td></tr>`;
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="color:#354380;margin:0 0 16px;">New interactive screen quote request</h2>
      <table style="border-collapse:collapse;width:100%;">
        ${row("Name", fields.name)}
        ${row("Email", fields.email)}
        ${row("Phone", fields.phone)}
        ${row("Organization", fields.organization || "—")}
        ${row("Intended use", fields.intendedUse === "classroom" ? "Classroom" : "Office / Business")}
        ${row("Screen size", fields.screenSize)}
        ${row("Quantity", String(fields.quantity))}
        ${row("Notes", fields.notes || "—")}
      </table>
    </div>
  `;
}

// Deliberately no pricing details here — this is a "we got it" confirmation, not a quote.
function customerQuoteEmailHtml(fields: { name: string; screenSize: string; quantity: number }) {
  const qtyNote = fields.quantity > 1 ? ` (×${fields.quantity})` : "";
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
      <p style="color:#354380;font-weight:700;font-size:18px;margin:0 0 20px;">Blue-Tech</p>
      <p>Hi ${escapeHtml(fields.name)},</p>
      <p>Thanks for reaching out about the ${escapeHtml(fields.screenSize)} interactive screen${qtyNote}. We've received your
      request and someone from our team will follow up shortly to help with next steps.</p>
      <p>If anything changes in the meantime, just reply to this email.</p>
      <p style="margin-top:24px;color:#666;font-size:13px;">— The Blue-Tech team</p>
    </div>
  `;
}

async function createStripePaymentIntent(amountUsd: number, metadata: Record<string, string>) {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) throw new Error("Stripe is not configured on the server");
  const params = new URLSearchParams();
  params.set("amount", String(Math.round(amountUsd * 100)));
  params.set("currency", "usd");
  Object.entries(metadata).forEach(([key, value]) => params.set(`metadata[${key}]`, value));
  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: { "Authorization": `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Stripe payment intent creation failed");
  return data as { id: string; client_secret: string };
}

async function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=")));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const computed = Array.from(new Uint8Array(sigBytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

async function getPaypackToken() {
  const appId = Deno.env.get("PAYPACK_APP_ID");
  const appSecret = Deno.env.get("PAYPACK_APP_SECRET");
  const baseUrl = Deno.env.get("PAYPACK_BASE_URL") ?? "https://payments.paypack.rw/api";
  if (!appId || !appSecret) throw new Error("Paypack is not configured on the server");
  const res = await fetch(`${baseUrl}/auth/agents/authorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: appId, client_secret: appSecret }),
  });
  const data = await res.json();
  if (!res.ok || !data?.access) throw new Error("Paypack authentication failed");
  return { token: data.access as string, baseUrl };
}

async function initiateMomoPayment(order: Record<string, unknown>, phone: string) {
  const { token, baseUrl } = await getPaypackToken();
  const rate = Number(Deno.env.get("USD_TO_RWF_RATE") ?? 1300);
  const amountRwf = Math.round(toNumber(order.total_amount) * rate);
  const res = await fetch(`${baseUrl}/transactions/cashin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ amount: amountRwf, number: phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Paypack cashin request failed");
  const ref = data?.ref;
  if (!ref) throw new Error("Paypack did not return a transaction ref");
  return ref as string;
}

async function verifyPaypackSignature(rawBody: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  return computed === signature;
}

async function getAuthUser(request: Request): Promise<User | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const appUser = await verifyAppToken(token);
  if (appUser) return {
    id: appUser.id as string,
    email: appUser.email as string,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: appUser.created_at as string ?? new Date().toISOString(),
  } as User;
  const { data: { user } } = await adminClient.auth.getUser(token);
  return user;
}

async function requireUser(request: Request) {
  const user = await getAuthUser(request);
  if (!user) throw new Response(JSON.stringify({ success: false, message: "Authentication required" }), {
    status: 401,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
  // Suspension was previously only checked at /auth/login — an already-issued token (Google
  // sign-in, or a session from before the suspension) kept working for every other endpoint.
  const { data: profile } = await adminClient.from("users").select("is_suspended").eq("id", user.id).maybeSingle();
  if (profile?.is_suspended) throw new Response(JSON.stringify({ success: false, message: "Account suspended" }), {
    status: 403,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
  return user;
}

async function requireAdmin(request: Request, user?: User) {
  const authenticated = user ?? await requireUser(request);
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", authenticated.id)
    .maybeSingle();
  const { data: userProfile, error: userError } = await adminClient
    .from("users")
    .select("role, is_suspended")
    .eq("id", authenticated.id)
    .maybeSingle();
  const profileRole = profile?.role?.toUpperCase();
  const userRole = userProfile?.role?.toUpperCase();
  const isAdmin = profileRole === "ADMIN" || userRole === "ADMIN";
  if ((error && userError) || userProfile?.is_suspended || !isAdmin) throw new Response(
    JSON.stringify({ success: false, message: "Administrator access required" }),
    { status: 403, headers: { ...corsHeaders(request), "Content-Type": "application/json" } },
  );
  return authenticated;
}

async function readJson(request: Request) {
  try { return await request.json(); } catch { return {}; }
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "").replace(/\/$/, "") || "/";
  const method = request.method;

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });

  // Conservative baseline DoS guard across every route — specific endpoints below layer
  // tighter limits on top of this one.
  await enforceRateLimit(rateLimiters?.global, `ip:${clientIp(request)}`, request);

  if (method === "POST" && path === "/auth/register") {
    await enforceRateLimit(rateLimiters?.authRegister, `ip:${clientIp(request)}`, request);
    const { name, email, password } = await readJson(request);
    if (!email || !password) return failure("Email and password are required");
    const { data, error } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name },
    });
    if (error || !data.user) return failure(error?.message ?? "Registration failed", 400);
    const { data: session, error: signInError } = await adminClient.auth.signInWithPassword({ email, password });
    if (signInError || !session.session) return failure(signInError?.message ?? "Registration succeeded; sign in required", 201);
    await adminClient.from("users").upsert({ id: data.user.id, email, role: "user" }, { onConflict: "id" });
    return success("User registered successfully!", { token: session.session.access_token, user: { id: data.user.id, name, email, role: "user" } });
  }

  if (method === "POST" && path === "/auth/login") {
    await enforceRateLimit(rateLimiters?.authLogin, `ip:${clientIp(request)}`, request);
    const { email, password } = await readJson(request);
    const { data, error } = await adminClient.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) return failure(error?.message ?? "Login failed", 401);
    const { data: profile } = await adminClient.from("users").select("*").eq("id", data.user.id).maybeSingle();
    if (profile?.is_suspended) return failure("Account suspended", 403);
    return success("Login successful!", { token: data.session.access_token, user: userResult(profile) ?? { id: data.user.id, email: data.user.email } });
  }

  if (method === "POST" && path === "/auth/google") {
    await enforceRateLimit(rateLimiters?.authGoogle, `ip:${clientIp(request)}`, request);
    const { token } = await readJson(request);
    if (!token) return failure("Google credential token is required", 400, request);

    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
    if (!verifyResponse.ok) return failure("Invalid or expired Google token", 401, request);

    const googleUser = await verifyResponse.json();
    if (!["https://accounts.google.com", "accounts.google.com"].includes(googleUser.iss)) {
      return failure("Invalid Google token issuer", 401, request);
    }
    if (googleUser.aud !== googleClientId) {
      return failure("Google token audience does not match this app", 401, request);
    }
    if (!googleUser.email || !googleUser.sub) {
      return failure("Google token is missing required profile fields", 400, request);
    }

    const userId = await authUserIdForGoogleUser(googleUser.email, googleUser.name ?? null, googleUser.picture ?? null);
    const userValues = {
      id: userId,
      email: googleUser.email,
      name: googleUser.name ?? googleUser.email,
      picture: googleUser.picture ?? null,
      provider: "google",
      provider_id: googleUser.sub,
      last_login: new Date().toISOString(),
    };
    const { data: user, error } = await adminClient
      .from("users")
      .upsert(userValues, { onConflict: "id" })
      .select("*")
      .single();
    if (error || !user) return failure(error?.message ?? "Unable to save Google user", 500, request);
    if (user.is_suspended) return failure("Account suspended", 403, request);

    await adminClient.from("profiles").upsert({
      id: user.id,
      email: user.email,
      role: user.role?.toUpperCase() === "ADMIN" ? "ADMIN" : "USER",
    }, { onConflict: "id" });

    return success("Google login successful!", authResult(user, await signAppToken(user)), request);
  }

  if (method === "GET" && (path === "/products" || path === "/products/search")) {
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Math.min(Number(url.searchParams.get("size") ?? 10), 100);
    let query = adminClient.from("products").select("*", { count: "exact" });
    const name = url.searchParams.get("name");
    if (name) query = query.ilike("name", `%${name}%`);
    const categoryId = url.searchParams.get("categoryId");
    if (categoryId) query = query.eq("category_id", categoryId);
    const minPrice = url.searchParams.get("minPrice");
    if (minPrice) query = query.gte("price", minPrice);
    const maxPrice = url.searchParams.get("maxPrice");
    if (maxPrice) query = query.lte("price", maxPrice);

    const sortColumns: Record<string, string> = { productId: "id", price: "price", name: "name", createdAt: "created_at" };
    const [sortField, sortDir] = (url.searchParams.get("sort") ?? "createdAt,desc").split(",");
    const orderColumn = sortColumns[sortField] ?? "created_at";
    const ascending = sortDir === "asc";

    const { data, count, error } = await query.range(page * size, page * size + size - 1).order(orderColumn, { ascending });
    if (error) return failure(error.message, 500, request);
    const products = await Promise.all((data ?? []).map(productResult));
    return success("Products fetched successfully", { content: products, totalElements: count ?? 0, number: page, size, totalPages: Math.ceil((count ?? 0) / size) });
  }

  if (method === "GET" && /^\/products\/[^/]+$/.test(path)) {
    const id = path.split("/").pop();
    const { data, error } = await adminClient.from("products").select("*").eq("id", id).maybeSingle();
    if (error) return failure(error.message, 500);
    if (!data) return failure("Product not found", 404);
    return success("Product fetched successfully", await productResult(data));
  }

  if (method === "GET" && path === "/categories") {
    const { data, error } = await adminClient.from("categories").select("*").order("name");
    if (error) return failure(error.message, 500);
    return success("Categories fetched successfully", (data ?? []).map(categoryResult));
  }

  if (method === "GET" && path === "/reviews/recent") {
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 8), 50);
    const { data, error } = await adminClient.from("reviews").select("*, products(*), users(name)").eq("hidden", false).order("created_at", { ascending: false }).limit(limit);
    if (error) return failure(error.message, 500);
    return success("Recent reviews fetched successfully", data ?? []);
  }

  if (method === "GET" && /^\/products\/[^/]+\/reviews$/.test(path)) {
    const productId = path.split("/")[2];
    const { data, error } = await adminClient.from("reviews").select("*, users(name)").eq("product_id", productId).eq("hidden", false).order("created_at", { ascending: false });
    if (error) return failure(error.message, 500);
    return success("Product reviews fetched successfully", data ?? []);
  }

  if (method === "POST" && path === "/payments/webhook/stripe") {
    const rawBody = await request.text();
    const sigHeader = request.headers.get("Stripe-Signature") ?? "";
    const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!secret || !(await verifyStripeSignature(rawBody, sigHeader, secret))) {
      return failure("Invalid Stripe webhook signature", 400, request);
    }
    const event = JSON.parse(rawBody);
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data?.object;
      const { data: record } = await adminClient.from("payment_records").select("id,order_id").eq("transaction_reference", intent?.id).maybeSingle();
      if (record) {
        await adminClient.from("payment_records").update({ status: "SUCCESS", updated_at: new Date().toISOString() }).eq("id", record.id);
        await markOrderPaid(record.order_id as number);
      }
    }
    return response({ received: true }, 200, request);
  }

  if (method === "POST" && path === "/payments/webhook/paypack") {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Paypack-Signature");
    const secret = Deno.env.get("PAYPACK_WEBHOOK_SECRET");
    if (!signature || !secret || !(await verifyPaypackSignature(rawBody, signature, secret))) {
      return failure("Invalid Paypack webhook signature", 400, request);
    }
    const payload = JSON.parse(rawBody);
    if (payload.kind === "transaction:processed") {
      const data = payload.data ?? {};
      const ref = data.ref;
      const status = String(data.status ?? "").toLowerCase();
      const { data: record } = await adminClient.from("payment_records").select("id,order_id").eq("transaction_reference", ref).maybeSingle();
      if (record) {
        if (status === "successful") {
          await adminClient.from("payment_records").update({ status: "SUCCESS", updated_at: new Date().toISOString() }).eq("id", record.id);
          await markOrderPaid(record.order_id as number);
        } else if (status === "failed") {
          await adminClient.from("payment_records").update({ status: "FAILED", updated_at: new Date().toISOString() }).eq("id", record.id);
          const { data: order } = await adminClient.from("orders").select("user_id").eq("id", record.order_id).maybeSingle();
          if (order?.user_id) {
            await notifyUser(order.user_id as string, `Your MoMo payment for order #${record.order_id} failed. Please try again.`);
          }
        }
      }
    }
    return response({ received: true }, 200, request);
  }

  if (method === "POST" && path === "/quote-requests") {
    await enforceRateLimit(rateLimiters?.quoteRequest, `ip:${clientIp(request)}`, request);
    const body = await readJson(request);

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const organization = body.organization ? String(body.organization).trim() : null;
    const intendedUse = String(body.intendedUse ?? "").toLowerCase();
    const screenSize = String(body.screenSize ?? "").trim();
    const quantity = Number(body.quantity ?? 1);
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!name || !email || !phone || !screenSize) {
      return failure("Name, email, phone, and screen size are required", 400, request);
    }
    if (!["classroom", "office"].includes(intendedUse)) {
      return failure("Intended use must be 'classroom' or 'office'", 400, request);
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return failure("Quantity must be at least 1", 400, request);
    }

    const { data: quote, error } = await adminClient.from("quote_requests").insert({
      name, email, phone, organization,
      intended_use: intendedUse, screen_size: screenSize, quantity, notes,
    }).select().single();
    if (error) return failure(error.message, 400, request);

    // Email delivery is best-effort — the quote is already saved above, so a Resend
    // hiccup (or RESEND_API_KEY not being configured yet) shouldn't turn a successful
    // submission into an error response for the customer.
    try {
      await Promise.all([
        sendResendEmail({
          from: RESEND_FROM_EMAIL,
          to: QUOTE_NOTIFICATION_EMAIL,
          subject: `New quote request — ${screenSize} (×${quantity}) from ${name}`,
          html: internalQuoteEmailHtml({ name, email, phone, organization, intendedUse, screenSize, quantity, notes }),
        }),
        sendResendEmail({
          from: RESEND_FROM_EMAIL,
          to: email,
          subject: "We've received your quote request",
          html: customerQuoteEmailHtml({ name, screenSize, quantity }),
        }),
      ]);
    } catch (emailError) {
      console.error("Quote request email dispatch failed:", emailError);
    }

    return response({ success: true, message: "Quote request received", data: quoteRequestResult(quote) }, 201, request);
  }

  const user = await requireUser(request);

  if ((path === "/products" || /^\/products\/[^/]+$/.test(path)) && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    await requireAdmin(request, user);
    const id = path === "/products" ? url.searchParams.get("id") : path.split("/").pop();
    if (method === "DELETE") {
      if (!id) return failure("Product id is required");
      const { error } = await adminClient.from("products").delete().eq("id", id);
      if (error) return failure(error.message, 400);
      return success("Product deleted successfully", null);
    }

    const body = await readJson(request);
    const variants = Array.isArray(body.variants) ? body.variants : [];
    const images = Array.isArray(body.images) ? body.images : [];
    const touchPointsInput = body.touchPoints ?? body.touch_points;
    const productValues = {
      name: body.name,
      description: body.description ?? null,
      price: Number(body.price),
      category_id: body.categoryId ?? body.category_id ?? null,
      stock: body.stock ?? variants.reduce((total: number, variant: Record<string, unknown>) => total + Number(variant.stockQuantity ?? variant.stock_quantity ?? 0), 0),
      screen_size: body.screenSize ?? body.screen_size ?? null,
      resolution: body.resolution ?? null,
      touch_points: touchPointsInput != null && touchPointsInput !== "" ? Number(touchPointsInput) : null,
      os: body.os ?? null,
      connectivity: body.connectivity ?? null,
      warranty: body.warranty ?? null,
    };
    if (!productValues.name || !Number.isFinite(productValues.price)) return failure("Name and a valid price are required");

    let product: Record<string, unknown> | null = null;
    if (method === "POST") {
      const { data, error } = await adminClient.from("products").insert(productValues).select().single();
      if (error) return failure(error.message, 400);
      product = data;
    } else {
      if (!id) return failure("Product id is required");
      const { data, error } = await adminClient.from("products").update(productValues).eq("id", id).select().single();
      if (error) return failure(error.message, 400);
      product = data;
      const { error: removeImagesError } = await adminClient.from("product_images").delete().eq("product_id", id);
      if (removeImagesError) return failure(removeImagesError.message, 400);
      const { error: removeVariantsError } = await adminClient.from("product_variants").delete().eq("product_id", id);
      if (removeVariantsError) return failure(removeVariantsError.message, 400);
    }

    const productId = product.id;
    if (variants.length) {
      const { error } = await adminClient.from("product_variants").insert(variants.map((variant: Record<string, unknown>) => ({
        product_id: productId,
        sku_code: variant.skuCode ?? variant.sku_code,
        size_or_color: variant.sizeOrColor ?? variant.size_or_color ?? "Default",
        price_adjustment: Number(variant.priceAdjustment ?? variant.price_adjustment ?? 0),
        stock_quantity: Number(variant.stockQuantity ?? variant.stock_quantity ?? 0),
      })));
      if (error) return failure(error.message, 400);
    }
    if (images.length) {
      const { error } = await adminClient.from("product_images").insert(images.map((image: Record<string, unknown>) => ({
        product_id: productId,
        image_url: image.imageUrl ?? image.image_url,
        is_primary: Boolean(image.isPrimary ?? image.is_primary),
      })));
      if (error) return failure(error.message, 400);
    }
    return success(method === "POST" ? "Product created successfully" : "Product updated successfully", await productResult(product));
  }

  if (method === "POST" && path === "/products/images/upload") {
    await requireAdmin(request, user);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return failure("A file is required", 400);
    if (!file.type.startsWith("image/")) return failure("Only image files are allowed", 400);
    if (file.size > 5 * 1024 * 1024) return failure("Image must be 5 MB or smaller", 400);

    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const filePath = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await adminClient.storage
      .from("product-images")
      .upload(filePath, file, { contentType: file.type, upsert: false });
    if (uploadError) return failure(uploadError.message, 500);
    const { data: publicUrl } = adminClient.storage.from("product-images").getPublicUrl(filePath);
    return success("Image uploaded successfully", publicUrl.publicUrl);
  }

  if ((path === "/categories" || /^\/categories\/[^/]+$/.test(path)) && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    await requireAdmin(request, user);
    if (method === "POST") {
      const body = await readJson(request);
      const { data, error } = await adminClient.from("categories").insert({ name: body.name ?? body.categoryName, description: body.description ?? null, parent_id: body.parentId ?? body.parent_id ?? null }).select().single();
      if (error) return failure(error.message, 400);
      return success("Category created successfully", categoryResult(data));
    }
    const id = path === "/categories" ? url.searchParams.get("id") : path.split("/").pop();
    if (!id) return failure("Category id is required");
    if (method === "DELETE") {
      const { error } = await adminClient.from("categories").delete().eq("id", id);
      if (error) return failure(error.message, 400);
      return success("Category deleted successfully", null);
    }
    const body = await readJson(request);
    const updates = {
      ...(body.name !== undefined || body.categoryName !== undefined ? { name: body.name ?? body.categoryName } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.parentId !== undefined || body.parent_id !== undefined ? { parent_id: body.parentId ?? body.parent_id } : {}),
    };
    const { data, error } = await adminClient.from("categories").update(updates).eq("id", id).select().single();
    if (error) return failure(error.message, 400);
    return success("Category updated successfully", categoryResult(data));
  }

  if (path === "/cart") {
    const cartId = await getOrCreateCartId(user.id);
    if (method === "GET") {
      try {
        return success("Cart fetched successfully", await getCartDetails(cartId), request);
      } catch (error) {
        return failure(errorMessage(error, "Failed to load cart"), 500, request);
      }
    }
    if (method === "POST") {
      const body = await readJson(request);
      const variantId = body.variantId ?? body.variant_id;
      const quantity = Math.max(1, Number(body.quantity ?? 1));
      if (!variantId) return failure("variantId is required", 400, request);

      const { data: existingItem, error: existingError } = await adminClient
        .from("cart_items")
        .select("id,quantity")
        .eq("cart_id", cartId)
        .eq("variant_id", variantId)
        .maybeSingle();
      if (existingError) return failure(existingError.message, 400, request);

      const nextQuantity = (existingItem?.quantity ?? 0) + quantity;
      const { error } = await adminClient
        .from("cart_items")
        .upsert({ ...(existingItem ? { id: existingItem.id } : {}), cart_id: cartId, variant_id: variantId, quantity: nextQuantity }, { onConflict: "cart_id,variant_id" });
      if (error) return failure(error.message, 400, request);

      return success("Cart item added successfully", await getCartDetails(cartId), request);
    }
  }

  if (/^\/cart\/[^/]+$/.test(path)) {
    const id = path.split("/").pop();
    const cartId = await getOrCreateCartId(user.id);
    if (method === "PATCH") {
      const body = await readJson(request);
      const quantity = Number(url.searchParams.get("quantity") ?? body.quantity);
      if (!Number.isFinite(quantity) || quantity < 1) return failure("A valid quantity is required", 400, request);
      const { data, error } = await adminClient.from("cart_items").update({ quantity }).eq("id", id).eq("cart_id", cartId).select().maybeSingle();
      if (error) return failure(error.message, 400, request);
      if (!data) return failure("Cart item not found", 404, request);
      return success("Cart updated successfully", await getCartDetails(cartId), request);
    }
    if (method === "DELETE") {
      const { error } = await adminClient.from("cart_items").delete().eq("id", id).eq("cart_id", cartId);
      if (error) return failure(error.message, 400, request);
      return success("Cart item removed successfully", await getCartDetails(cartId), request);
    }
  }

  if (path === "/wishlist" || /^\/wishlist\/[^/]+$/.test(path)) {
    if (method === "GET") {
      const { data, error } = await adminClient.from("wishlist").select("id,product_id,products(*)").eq("user_id", user.id);
      if (error) return failure(error.message, 500, request);
      const items = await Promise.all(((data ?? []) as Record<string, unknown>[]).map(async (row) => {
        const product = (row.products ?? {}) as Record<string, unknown>;
        const shaped = await productResult(product);
        return { wishlistItemId: row.id, productName: product.name, ...shaped };
      }));
      return success("Wishlist fetched successfully", { items }, request);
    }
    if (method === "POST") {
      const productId = path.split("/").pop();
      const { data: existing, error: existingError } = await adminClient
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (existingError) return failure(existingError.message, 400, request);

      if (existing) {
        const { error } = await adminClient.from("wishlist").delete().eq("id", existing.id);
        if (error) return failure(error.message, 400, request);
        return success("Removed from wishlist", { wishlisted: false }, request);
      }
      const { error } = await adminClient.from("wishlist").insert({ user_id: user.id, product_id: productId });
      if (error) return failure(error.message, 400, request);
      return success("Added to wishlist", { wishlisted: true }, request);
    }
    if (method === "DELETE") {
      const productId = path.split("/").pop();
      const { error } = await adminClient.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
      if (error) return failure(error.message, 400, request);
      return success("Wishlist updated successfully", null, request);
    }
  }

  if (method === "GET" && path === "/notifications/unread-count") {
    const { count, error } = await adminClient.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
    if (error) return failure(error.message, 500);
    return success("Unread notification count fetched", count ?? 0);
  }

  if (method === "GET" && path === "/notifications") {
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
    const { data, error } = await adminClient.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit);
    if (error) return failure(error.message, 500);
    return success("Notifications fetched successfully", data ?? []);
  }

  if (method === "POST" && path === "/notifications/mark-read") {
    const body = await readJson(request);
    const { error } = await adminClient.from("notifications").update({ read: true }).eq("user_id", user.id).in("id", body.ids ?? []);
    if (error) return failure(error.message, 400);
    return success("Notifications marked as read", null);
  }

  if (method === "POST" && path === "/notifications/mark-all-read") {
    const { error } = await adminClient.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    if (error) return failure(error.message, 400);
    return success("Notifications marked as read", null);
  }

  if (method === "GET" && path === "/notifications/admin/unread-count") {
    await requireAdmin(request, user);
    const { count, error } = await adminClient.from("notifications").select("id", { count: "exact", head: true }).eq("read", false);
    if (error) return failure(error.message, 500);
    return success("Admin unread notification count fetched", count ?? 0);
  }

  if (method === "GET" && path === "/notifications/admin") {
    await requireAdmin(request, user);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
    const { data, error } = await adminClient.from("notifications").select("*").order("created_at", { ascending: false }).limit(limit);
    if (error) return failure(error.message, 500);
    return success("Admin notifications fetched successfully", data ?? []);
  }

  if (method === "POST" && path === "/notifications/admin/mark-all-read") {
    await requireAdmin(request, user);
    const { error } = await adminClient.from("notifications").update({ read: true }).eq("read", false);
    if (error) return failure(error.message, 400);
    return success("Admin notifications marked as read", null);
  }

  if (method === "GET" && path === "/reviews/recent") {
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 8), 50);
    const { data, error } = await adminClient.from("reviews").select("*, products(*), users(name)").eq("hidden", false).order("created_at", { ascending: false }).limit(limit);
    if (error) return failure(error.message, 500);
    return success("Recent reviews fetched successfully", data ?? []);
  }

  if (/^\/products\/[^/]+\/reviews$/.test(path)) {
    const productId = path.split("/")[2];
    if (method === "GET") {
      const { data, error } = await adminClient.from("reviews").select("*, users(name)").eq("product_id", productId).eq("hidden", false).order("created_at", { ascending: false });
      if (error) return failure(error.message, 500);
      return success("Product reviews fetched successfully", data ?? []);
    }
    if (method === "POST") {
      const body = await readJson(request);
      const { data, error } = await adminClient.from("reviews").insert({ user_id: user.id, product_id: productId, rating: body.rating, comment: body.comment ?? null }).select().single();
      if (error) return failure(error.message, 400);
      return success("Review created successfully", data);
    }
  }

  if (method === "GET" && path === "/users/profile") {
    const { data, error } = await adminClient.from("users").select("*").eq("id", user.id).maybeSingle();
    if (error) return failure(error.message, 500);
    return success("Profile fetched successfully", userResult(data) ?? { id: user.id, email: user.email });
  }

  if (path === "/users/addresses" || /^\/users\/addresses\/[^/]+/.test(path)) {
    if (method === "GET" && path === "/users/addresses") {
      const { data, error } = await adminClient.from("addresses").select("*").eq("user_id", user.id).order("id");
      if (error) return failure(error.message, 500, request);
      return success("Addresses fetched", ((data ?? []) as Record<string, unknown>[]).map(addressResult), request);
    }
    if (method === "POST" && path === "/users/addresses") {
      const body = await readJson(request);
      const street = body.streetAddress ?? body.street;
      const city = body.city;
      const country = body.country ?? "Rwanda";
      if (!street || !city) return failure("Street and city are required", 400, request);

      const { data: profile } = await adminClient.from("users").select("name,email,phone").eq("id", user.id).maybeSingle();
      const recipientName = body.recipientName ?? profile?.name ?? profile?.email ?? user.email ?? "Customer";
      const phone = body.phoneNumber ?? body.phone ?? profile?.phone ?? "";

      const { count } = await adminClient.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      const shouldBeDefault = (count ?? 0) === 0 || Boolean(body.isDefault);
      if (shouldBeDefault) await unsetDefaultAddresses(user.id);

      const { data, error } = await adminClient.from("addresses").insert({
        user_id: user.id,
        recipient_name: recipientName,
        phone_number: phone,
        street_address: street,
        city,
        state: body.state ?? null,
        zip_code: body.zipCode ?? null,
        landmarks: body.landmarks ?? null,
        country,
        is_default: shouldBeDefault,
      }).select().single();
      if (error) return failure(error.message, 400, request);
      return response({ success: true, message: "Address added successfully", data: addressResult(data) }, 201, request);
    }
    if (method === "PUT" && /^\/users\/addresses\/[^/]+\/default$/.test(path)) {
      const addressId = path.split("/")[3];
      const { data: addr } = await adminClient.from("addresses").select("id,user_id").eq("id", addressId).maybeSingle();
      if (!addr || addr.user_id !== user.id) return failure("Address not found", 404, request);
      await unsetDefaultAddresses(user.id);
      const { error } = await adminClient.from("addresses").update({ is_default: true }).eq("id", addressId);
      if (error) return failure(error.message, 400, request);
      return success("Default address updated", null, request);
    }
    if (method === "DELETE" && /^\/users\/addresses\/[^/]+$/.test(path)) {
      const addressId = path.split("/").pop();
      const { error } = await adminClient.from("addresses").delete().eq("id", addressId).eq("user_id", user.id);
      if (error) return failure(error.message, 400, request);
      return success("Address deleted", null, request);
    }
  }

  if (method === "POST" && path === "/orders/checkout") {
    await enforceRateLimit(rateLimiters?.checkout, `user:${user.id}`, request);
    try {
      const body = await readJson(request);
      const result = await checkoutOrder(user, body, request);
      return response({ success: true, message: "Order placed successfully!", data: result }, 201, request);
    } catch (error) {
      if (error instanceof Response) return withCors(error, request);
      return failure(errorMessage(error, "Checkout failed"), 400, request);
    }
  }

  if (method === "GET" && path === "/orders/my") {
    const { data, error } = await adminClient.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) return failure(error.message, 500, request);
    const orders = await Promise.all((data ?? []).map(orderResult));
    return success("Orders fetched successfully", orders, request);
  }

  if (method === "GET" && /^\/orders\/[^/]+$/.test(path)) {
    const orderId = path.split("/").pop();
    const { data, error } = await adminClient.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (error) return failure(error.message, 500, request);
    if (!data) return failure("Order not found", 404, request);
    if (data.user_id !== user.id) {
      await requireAdmin(request, user);
    }
    return success("Order fetched", await orderResult(data), request);
  }

  if (method === "POST" && /^\/payments\/initialize\/[^/]+$/.test(path)) {
    const orderId = path.split("/").pop();
    const { data: order, error } = await adminClient.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
    if (error) return failure(error.message, 500, request);
    if (!order) return failure("Order not found", 404, request);
    try {
      const intent = await createStripePaymentIntent(toNumber(order.total_amount), { orderId: String(order.id), userEmail: String(user.email ?? "") });
      const { error: paymentError } = await adminClient.from("payment_records").upsert({
        order_id: order.id, amount: order.total_amount, transaction_reference: intent.id, status: "PENDING", payment_method: "card", updated_at: new Date().toISOString(),
      }, { onConflict: "order_id" });
      if (paymentError) return failure(paymentError.message, 400, request);
      return success("Payment initialized", { status: "success", message: "Payment initialized", paymentLink: intent.client_secret }, request);
    } catch (error) {
      return failure(errorMessage(error, "Stripe initialization failed"), 500, request);
    }
  }

  if (method === "POST" && /^\/payments\/momo\/[^/]+$/.test(path)) {
    const orderId = path.split("/").pop();
    const body = await readJson(request);
    const phone = body.phone;
    if (!phone) return failure("Phone number is required", 400, request);
    const { data: order, error } = await adminClient.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
    if (error) return failure(error.message, 500, request);
    if (!order) return failure("Order not found", 404, request);
    try {
      const ref = await initiateMomoPayment(order, phone);
      const { error: paymentError } = await adminClient.from("payment_records").upsert({
        order_id: order.id, amount: order.total_amount, transaction_reference: ref, status: "PENDING", payment_method: order.payment_method, updated_at: new Date().toISOString(),
      }, { onConflict: "order_id" });
      if (paymentError) return failure(paymentError.message, 400, request);
      return success("MoMo payment initiated", { status: "success", message: `Payment request sent to ${phone}. Please approve on your phone.`, paymentLink: ref }, request);
    } catch (error) {
      return failure(errorMessage(error, "Paypack initialization failed"), 500, request);
    }
  }

  if (path === "/admin/orders" || /^\/admin\/orders\/[^/]+/.test(path)) {
    await requireAdmin(request, user);

    if (method === "GET" && path === "/admin/orders") {
      const status = url.searchParams.get("status");
      let query = adminClient.from("orders").select("*").order("created_at", { ascending: false });
      if (status && status.toLowerCase() !== "all") query = query.eq("status", status.toLowerCase());
      const { data, error } = await query;
      if (error) return failure(error.message, 500, request);
      const orders = await Promise.all(((data ?? []) as Record<string, unknown>[]).map(adminOrderListResult));
      return success("Orders fetched", orders, request);
    }

    if (method === "GET" && /^\/admin\/orders\/[^/]+$/.test(path)) {
      const orderId = path.split("/").pop();
      const { data, error } = await adminClient.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (error) return failure(error.message, 500, request);
      if (!data) return failure("Order not found", 404, request);
      return success("Order detail fetched", await adminOrderDetailResult(data), request);
    }

    if (method === "PATCH" && /^\/admin\/orders\/[^/]+\/status$/.test(path)) {
      const orderId = path.split("/")[3];
      const body = await readJson(request);
      const status = String(body.status ?? "").toLowerCase();
      const validStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) return failure("Invalid status", 400, request);
      const { data, error } = await adminClient.from("orders").update({ status }).eq("id", orderId).select().maybeSingle();
      if (error) return failure(error.message, 400, request);
      if (!data) return failure("Order not found", 404, request);
      if (data.user_id) {
        await notifyUser(data.user_id as string, status === "delivered"
          ? `Your order #${orderId} has been marked as delivered! Click here to review your items.`
          : `Your order #${orderId} status is now ${statusKey(status)}`);
      }
      return success("Status updated", await adminOrderDetailResult(data), request);
    }

    if (method === "POST" && /^\/admin\/orders\/[^/]+\/payments$/.test(path)) {
      const orderId = path.split("/")[3];
      const { data: order, error } = await adminClient.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (error) return failure(error.message, 500, request);
      if (!order) return failure("Order not found", 404, request);
      const { error: paymentError } = await adminClient.from("payment_records").upsert({
        order_id: order.id, amount: order.total_amount, status: "SUCCESS", payment_method: "manual",
        transaction_reference: `MANUAL-${orderId}-${Date.now()}`, updated_at: new Date().toISOString(),
      }, { onConflict: "order_id" });
      if (paymentError) return failure(paymentError.message, 400, request);
      const { data: updated, error: updateError } = await adminClient.from("orders").update({ status: "paid" }).eq("id", orderId).select().maybeSingle();
      if (updateError) return failure(updateError.message, 400, request);
      if (order.user_id) {
        await notifyUser(order.user_id as string, `Payment for order #${orderId} was successful. Your order is now being processed.`);
      }
      return success("Order marked as paid", await adminOrderDetailResult(updated), request);
    }

    if (method === "POST" && /^\/admin\/orders\/[^/]+\/shipments$/.test(path)) {
      const orderId = path.split("/")[3];
      const body = await readJson(request);
      const { data: order, error } = await adminClient.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (error) return failure(error.message, 500, request);
      if (!order) return failure("Order not found", 404, request);
      const { error: shipmentError } = await adminClient.from("shipments").upsert({
        order_id: order.id, address_id: order.address_id, carrier: body.carrier ?? null,
        tracking_number: body.trackingNumber ?? null, status: "IN_TRANSIT", shipped_at: new Date().toISOString(),
      }, { onConflict: "order_id" });
      if (shipmentError) return failure(shipmentError.message, 400, request);
      const { data: updated, error: updateError } = await adminClient.from("orders").update({ status: "shipped" }).eq("id", orderId).select().maybeSingle();
      if (updateError) return failure(updateError.message, 400, request);
      if (order.user_id) {
        await notifyUser(order.user_id as string, `Your order #${orderId} status is now SHIPPED`);
      }
      return success("Shipment created", await adminOrderDetailResult(updated), request);
    }
  }

  if (path === "/admin/users" || /^\/admin\/users\/[^/]+\/(admin|suspend)$/.test(path)) {
    await requireAdmin(request, user);

    if (method === "GET" && path === "/admin/users") {
      const search = url.searchParams.get("search");
      const users = await getAdminUsersList(search);
      return success("Users fetched", users, request);
    }

    if (method === "PATCH" && /^\/admin\/users\/[^/]+\/admin$/.test(path)) {
      const targetId = path.split("/")[3];
      const body = await readJson(request);
      const role = body.make ? "admin" : "user";
      const { data, error } = await adminClient.from("users").update({ role }).eq("id", targetId).select().maybeSingle();
      if (error) return failure(error.message, 400, request);
      if (!data) return failure("User not found", 404, request);
      await adminClient.from("profiles").update({ role: role === "admin" ? "ADMIN" : "USER" }).eq("id", targetId);
      return success("Role updated", await adminUserResult(data), request);
    }

    if (method === "PATCH" && /^\/admin\/users\/[^/]+\/suspend$/.test(path)) {
      const targetId = path.split("/")[3];
      const body = await readJson(request);
      const { data, error } = await adminClient.from("users").update({ is_suspended: Boolean(body.suspend) }).eq("id", targetId).select().maybeSingle();
      if (error) return failure(error.message, 400, request);
      if (!data) return failure("User not found", 404, request);
      return success("Suspension updated", await adminUserResult(data), request);
    }
  }

  if (path === "/admin/shipments" || /^\/admin\/shipments\/[^/]+$/.test(path)) {
    await requireAdmin(request, user);

    if (method === "GET" && path === "/admin/shipments") {
      const { data, error } = await adminClient.from("shipments").select("*, orders(user_id, users(email))").order("id", { ascending: false });
      if (error) return failure(error.message, 500, request);
      return success("Shipments fetched", ((data ?? []) as Record<string, unknown>[]).map(adminShipmentResult), request);
    }

    if (method === "PATCH" && /^\/admin\/shipments\/[^/]+$/.test(path)) {
      const shipmentId = path.split("/").pop();
      const body = await readJson(request);
      const updates: Record<string, unknown> = {};
      if (body.carrier !== undefined) updates.carrier = body.carrier;
      if (body.trackingNumber !== undefined) updates.tracking_number = body.trackingNumber;
      if (body.status !== undefined) updates.status = String(body.status).toUpperCase();
      const { data, error } = await adminClient.from("shipments").update(updates).eq("id", shipmentId).select("*, orders(user_id, users(email))").maybeSingle();
      if (error) return failure(error.message, 400, request);
      if (!data) return failure("Shipment not found", 404, request);
      return success("Shipment updated", adminShipmentResult(data), request);
    }
  }

  if (path === "/admin/reviews" || /^\/admin\/reviews\/[^/]+$/.test(path)) {
    await requireAdmin(request, user);

    if (method === "GET" && path === "/admin/reviews") {
      const rating = url.searchParams.get("rating");
      let query = adminClient.from("reviews").select("*, products(name), users(name,email)").order("created_at", { ascending: false }).limit(200);
      if (rating) query = query.eq("rating", Number(rating));
      const { data, error } = await query;
      if (error) return failure(error.message, 500, request);
      return success("Reviews fetched", ((data ?? []) as Record<string, unknown>[]).map(adminReviewResult), request);
    }

    if (method === "PATCH" && /^\/admin\/reviews\/[^/]+$/.test(path)) {
      const reviewId = path.split("/").pop();
      const body = await readJson(request);
      const { data, error } = await adminClient.from("reviews").update({ hidden: Boolean(body.isHidden) }).eq("id", reviewId).select("*, products(name), users(name,email)").maybeSingle();
      if (error) return failure(error.message, 400, request);
      if (!data) return failure("Review not found", 404, request);
      return success("Review updated", adminReviewResult(data), request);
    }

    if (method === "DELETE" && /^\/admin\/reviews\/[^/]+$/.test(path)) {
      const reviewId = path.split("/").pop();
      const { error } = await adminClient.from("reviews").delete().eq("id", reviewId);
      if (error) return failure(error.message, 400, request);
      return success("Review deleted", null, request);
    }
  }

  if (path === "/admin/quote-requests" || /^\/admin\/quote-requests\/[^/]+$/.test(path)) {
    await requireAdmin(request, user);

    if (method === "GET" && path === "/admin/quote-requests") {
      const status = url.searchParams.get("status");
      let query = adminClient.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(200);
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) return failure(error.message, 500, request);
      return success("Quote requests fetched", ((data ?? []) as Record<string, unknown>[]).map(quoteRequestResult), request);
    }

    if (method === "PATCH" && /^\/admin\/quote-requests\/[^/]+$/.test(path)) {
      const quoteRequestId = path.split("/").pop();
      const body = await readJson(request);
      const status = String(body.status ?? "");
      if (!["new", "contacted", "closed"].includes(status)) return failure("Invalid status", 400, request);
      const { data, error } = await adminClient.from("quote_requests").update({ status }).eq("id", quoteRequestId).select().maybeSingle();
      if (error) return failure(error.message, 400, request);
      if (!data) return failure("Quote request not found", 404, request);
      return success("Quote request updated", quoteRequestResult(data), request);
    }
  }

  if (path === "/admin/coupons" || /^\/admin\/coupons\/[^/]+/.test(path)) {
    await requireAdmin(request, user);

    if (method === "GET" && path === "/admin/coupons") {
      const { data, error } = await adminClient.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) return failure(error.message, 500, request);
      return success("Coupons fetched", ((data ?? []) as Record<string, unknown>[]).map(couponResult), request);
    }

    if (method === "GET" && path === "/admin/coupons/validate") {
      const code = url.searchParams.get("code") ?? "";
      const { data: coupon, error } = await adminClient.from("coupons").select("*").ilike("code", code).maybeSingle();
      if (error) return failure(error.message, 500, request);
      if (!coupon) return failure("Coupon not found", 404, request);
      if (!coupon.is_active) return failure("Coupon is not active", 400, request);
      if (coupon.max_uses != null && toNumber(coupon.uses) >= toNumber(coupon.max_uses)) return failure("Coupon usage limit reached", 400, request);
      const now = new Date();
      if (coupon.starts_at && new Date(coupon.starts_at) > now) return failure("Coupon is not yet valid", 400, request);
      if (coupon.ends_at && new Date(coupon.ends_at) < now) return failure("Coupon has expired", 400, request);
      return success("Coupon valid", couponResult(coupon), request);
    }

    if (method === "POST" && path === "/admin/coupons") {
      const body = await readJson(request);
      const code = String(body.code ?? "").trim();
      const kind = String(body.kind ?? "").toUpperCase();
      const value = Number(body.value);
      if (!code || !["PERCENT", "FIXED"].includes(kind) || !Number.isFinite(value) || value <= 0) {
        return failure("A valid code, kind and positive value are required", 400, request);
      }
      const { data, error } = await adminClient.from("coupons").insert({
        code: code.toUpperCase(),
        kind,
        coupon_value: value,
        min_subtotal: body.minSubtotal != null && body.minSubtotal !== "" ? Number(body.minSubtotal) : null,
        starts_at: body.startsAt || null,
        ends_at: body.endsAt || null,
        max_uses: body.maxUses != null && body.maxUses !== "" ? Number(body.maxUses) : null,
        is_active: body.isActive !== undefined ? Boolean(body.isActive) : true,
      }).select().single();
      if (error) return failure(error.message, 400, request);
      return response({ success: true, message: "Coupon created", data: couponResult(data) }, 201, request);
    }

    if (method === "PUT" && /^\/admin\/coupons\/[^/]+$/.test(path)) {
      const id = path.split("/").pop();
      const body = await readJson(request);
      const code = String(body.code ?? "").trim();
      const kind = String(body.kind ?? "").toUpperCase();
      const value = Number(body.value);
      if (!code || !["PERCENT", "FIXED"].includes(kind) || !Number.isFinite(value) || value <= 0) {
        return failure("A valid code, kind and positive value are required", 400, request);
      }
      const { data, error } = await adminClient.from("coupons").update({
        code: code.toUpperCase(),
        kind,
        coupon_value: value,
        min_subtotal: body.minSubtotal != null && body.minSubtotal !== "" ? Number(body.minSubtotal) : null,
        starts_at: body.startsAt || null,
        ends_at: body.endsAt || null,
        max_uses: body.maxUses != null && body.maxUses !== "" ? Number(body.maxUses) : null,
        is_active: body.isActive !== undefined ? Boolean(body.isActive) : true,
      }).eq("id", id).select().maybeSingle();
      if (error) return failure(error.message, 400, request);
      if (!data) return failure("Coupon not found", 404, request);
      return success("Coupon updated", couponResult(data), request);
    }

    if (method === "PATCH" && /^\/admin\/coupons\/[^/]+\/toggle$/.test(path)) {
      const id = path.split("/")[3];
      const { data: existing, error: fetchError } = await adminClient.from("coupons").select("is_active").eq("id", id).maybeSingle();
      if (fetchError) return failure(fetchError.message, 500, request);
      if (!existing) return failure("Coupon not found", 404, request);
      const { data, error } = await adminClient.from("coupons").update({ is_active: !existing.is_active }).eq("id", id).select().maybeSingle();
      if (error) return failure(error.message, 400, request);
      return success("Coupon toggled", couponResult(data), request);
    }

    if (method === "DELETE" && /^\/admin\/coupons\/[^/]+$/.test(path)) {
      const id = path.split("/").pop();
      const { error } = await adminClient.from("coupons").delete().eq("id", id);
      if (error) return failure(error.message, 400, request);
      return success("Coupon deleted", null, request);
    }
  }

  if (method === "GET" && path === "/admin/dashboard/stats") {
    await requireAdmin(request, user);
    try {
      return success("Dashboard stats fetched", await getAdminDashboardStats(), request);
    } catch (error) {
      return failure(errorMessage(error, "Failed to load dashboard stats"), 500, request);
    }
  }

  if (method === "GET" && path === "/admin/analytics") {
    await requireAdmin(request, user);
    try {
      return success("Analytics fetched", await getAdminAnalytics(), request);
    } catch (error) {
      return failure(errorMessage(error, "Failed to load analytics"), 500, request);
    }
  }

  if (path.startsWith("/admin")) await requireAdmin(request, user);
  return failure(`Endpoint ${method} ${path} has not been migrated yet`, 501);
}

Deno.serve(async (request) => {
  try { return withCors(await handle(request), request); }
  catch (error) {
    if (error instanceof Response) return withCors(error, request);
    console.error(error);
    return failure("Unexpected server error", 500, request);
  }
});
