import { createClient, type User } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceRoleKey);
const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID") ?? "71259894069-n4mnjohm3rjtvj36rn5apq18qie2945q.apps.googleusercontent.com";
const jwtSecret = Deno.env.get("JWT_SECRET") ?? serviceRoleKey;

const DEFAULT_ALLOWED_ORIGINS = [
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
    variants: (variants ?? []).map(variantResult),
    images: imageRows.map(imageResult),
    imageUrl: primaryImage?.image_url ?? null,
    primaryImageUrl: primaryImage?.image_url ?? null,
  };
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

  if (method === "POST" && path === "/auth/register") {
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
    const { email, password } = await readJson(request);
    const { data, error } = await adminClient.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) return failure(error?.message ?? "Login failed", 401);
    const { data: profile } = await adminClient.from("users").select("*").eq("id", data.user.id).maybeSingle();
    if (profile?.is_suspended) return failure("Account suspended", 403);
    return success("Login successful!", { token: data.session.access_token, user: profile ?? { id: data.user.id, email: data.user.email } });
  }

  if (method === "POST" && path === "/auth/google") {
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

    await adminClient.from("profiles").upsert({
      id: user.id,
      email: user.email,
      role: user.role?.toUpperCase() === "ADMIN" ? "ADMIN" : "USER",
    }, { onConflict: "id" });

    return success("Google login successful!", authResult(user, await signAppToken(user)), request);
  }

  if (method === "GET" && path === "/products") {
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
    const { data, count, error } = await query.range(page * size, page * size + size - 1).order("created_at", { ascending: false });
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
    const { data, error } = await adminClient.from("reviews").select("*, products(*), users(name)").order("created_at", { ascending: false }).limit(limit);
    if (error) return failure(error.message, 500);
    return success("Recent reviews fetched successfully", data ?? []);
  }

  if (method === "GET" && /^\/products\/[^/]+\/reviews$/.test(path)) {
    const productId = path.split("/")[2];
    const { data, error } = await adminClient.from("reviews").select("*, users(name)").eq("product_id", productId).order("created_at", { ascending: false });
    if (error) return failure(error.message, 500);
    return success("Product reviews fetched successfully", data ?? []);
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
    const productValues = {
      name: body.name,
      description: body.description ?? null,
      price: Number(body.price),
      category_id: body.categoryId ?? body.category_id ?? null,
      stock: body.stock ?? variants.reduce((total: number, variant: Record<string, unknown>) => total + Number(variant.stockQuantity ?? variant.stock_quantity ?? 0), 0),
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
    if (method === "GET") {
      const { data, error } = await adminClient.from("cart").select("*, products(*)").eq("user_id", user.id);
      if (error) return failure(error.message, 500);
      return success("Cart fetched successfully", data ?? []);
    }
    if (method === "POST") {
      const body = await readJson(request);
      const { data, error } = await adminClient.from("cart").upsert({ user_id: user.id, product_id: body.product_id ?? body.productId, quantity: body.quantity ?? 1 }, { onConflict: "user_id,product_id" }).select().single();
      if (error) return failure(error.message, 400);
      return success("Cart item added successfully", data);
    }
  }

  if (/^\/cart\/[^/]+$/.test(path)) {
    const id = path.split("/").pop();
    if (method === "PATCH") {
      const body = await readJson(request);
      const quantity = Number(url.searchParams.get("quantity") ?? body.quantity);
      const { data, error } = await adminClient.from("cart").update({ quantity }).eq("id", id).eq("user_id", user.id).select().single();
      if (error) return failure(error.message, 400);
      return success("Cart updated successfully", data);
    }
    if (method === "DELETE") {
      const { error } = await adminClient.from("cart").delete().eq("id", id).eq("user_id", user.id);
      if (error) return failure(error.message, 400);
      return success("Cart item removed successfully", null);
    }
  }

  if (path === "/wishlist" || /^\/wishlist\/[^/]+$/.test(path)) {
    if (method === "GET") {
      const { data, error } = await adminClient.from("wishlist").select("*, products(*)").eq("user_id", user.id);
      if (error) return failure(error.message, 500);
      return success("Wishlist fetched successfully", data ?? []);
    }
    if (method === "POST") {
      const productId = path.split("/").pop();
      const { data, error } = await adminClient.from("wishlist").upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id" }).select().single();
      if (error) return failure(error.message, 400);
      return success("Wishlist updated successfully", data);
    }
    if (method === "DELETE") {
      const productId = path.split("/").pop();
      const { error } = await adminClient.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
      if (error) return failure(error.message, 400);
      return success("Wishlist updated successfully", null);
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
    const { data, error } = await adminClient.from("reviews").select("*, products(*), users(name)").order("created_at", { ascending: false }).limit(limit);
    if (error) return failure(error.message, 500);
    return success("Recent reviews fetched successfully", data ?? []);
  }

  if (/^\/products\/[^/]+\/reviews$/.test(path)) {
    const productId = path.split("/")[2];
    if (method === "GET") {
      const { data, error } = await adminClient.from("reviews").select("*, users(name)").eq("product_id", productId).order("created_at", { ascending: false });
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
    return success("Profile fetched successfully", data ?? { id: user.id, email: user.email });
  }

  if (method === "GET" && path === "/orders/my") {
    const { data, error } = await adminClient.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) return failure(error.message, 500);
    return success("Orders fetched successfully", data ?? []);
  }

  if (method === "GET" && path === "/admin/dashboard/stats") {
    await requireAdmin(request, user);
    try {
      return success("Dashboard stats fetched", await getAdminDashboardStats(), request);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Failed to load dashboard stats", 500, request);
    }
  }

  if (method === "GET" && path === "/admin/analytics") {
    await requireAdmin(request, user);
    try {
      return success("Analytics fetched", await getAdminAnalytics(), request);
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Failed to load analytics", 500, request);
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
