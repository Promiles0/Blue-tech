import { createClient, type User } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceRoleKey);

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
