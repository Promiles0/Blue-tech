import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ShoppingBag } from "lucide-react";

// ─── Mock featured products (replace with API data later) ────────────────────
const FEATURED = [
  {
    id: 1,
    name: "Arc Headphones",
    category: "Audio",
    price: 349,
    badge: "New",
  },
  {
    id: 2,
    name: "Onyx Watch",
    category: "Wearables",
    price: 529,
    badge: "Bestseller",
  },
  {
    id: 3,
    name: "Lumix View",
    category: "Cameras",
    price: 799,
    badge: "Limited",
  },
];

const CATEGORIES = [
  { label: "Audio", desc: "Sound without distraction", slug: "audio" },
  { label: "Wearables", desc: "Worn with intention", slug: "wearables" },
  { label: "Cameras", desc: "Light captured carefully", slug: "cameras" },
];

function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Image area */}
        <div className="relative aspect-square bg-[#111] flex items-center justify-center overflow-hidden">
          <ShoppingBag className="w-16 h-16 text-white/10" />
          {product.badge && (
            <span className="absolute top-4 left-4 text-[10px] font-display font-semibold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/20">
              {product.badge}
            </span>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
            <span className="flex items-center gap-2 text-white text-sm font-medium">
              View Product <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-5">
          <p className="text-[11px] text-[#555] font-display tracking-widest uppercase mb-1.5">
            {product.category}
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-display font-semibold text-[#ddd] group-hover:text-white transition-colors">
              {product.name}
            </h3>
            <span className="text-[15px] font-semibold text-white">${product.price}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function HomePage() {
  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center">
        {/* Atmospheric glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-150 bg-primary/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            {/* Label */}
            <div className="inline-flex items-center gap-2.5 mb-10">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-display font-semibold tracking-[0.22em] text-[#555] uppercase">
                New Collection — 2026
              </span>
            </div>

            <h1 className="font-display font-extrabold leading-[0.92] tracking-tight mb-8">
              <span className="block text-[clamp(3.5rem,10vw,8rem)] text-white/90">Considered</span>
              <span className="block text-[clamp(3.5rem,10vw,8rem)] text-white/30">Objects.</span>
            </h1>

            <p className="text-[#666] text-lg md:text-xl max-w-md leading-relaxed mb-12">
              Carefully selected tools for a quieter, more deliberate digital life.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-3 px-7 py-3.5 bg-white text-black font-display font-semibold text-[14px] tracking-wide rounded-full hover:bg-white/90 transition-colors group"
              >
                Shop now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-3 px-7 py-3.5 border border-white/10 text-[#888] font-display font-semibold text-[14px] tracking-wide rounded-full hover:border-white/20 hover:text-white transition-all"
              >
                Browse categories
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[9px] uppercase tracking-[0.35em]">Scroll</span>
          <div className="w-px h-10 bg-linear-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────── */}
      <section className="border-t border-white/6 py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                className="group flex items-center justify-between px-8 py-10 hover:bg-white/2 transition-colors first:pl-0 last:pr-0"
              >
                <div>
                  <p className="font-display font-semibold text-lg text-white/80 group-hover:text-white transition-colors mb-1">
                    {cat.label}
                  </p>
                  <p className="text-[13px] text-[#555]">{cat.desc}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-[#444] group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-[11px] font-display font-semibold tracking-[0.2em] text-[#444] uppercase mb-3">
                Curated
              </p>
              <h2 className="font-display font-bold text-3xl text-white/90 tracking-tight">
                Featured Objects
              </h2>
            </div>
            <Link
              to="/products"
              className="hidden sm:flex items-center gap-2 text-[13px] text-[#555] hover:text-white transition-colors"
            >
              All products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURED.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND STATEMENT ───────────────────────────────────────────── */}
      <section className="border-t border-white/6 py-28">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <p className="font-display font-light text-3xl md:text-4xl text-white/40 leading-relaxed tracking-tight">
            "We make things that are{" "}
            <span className="text-white/80">worth owning</span> — built to last,
            designed to disappear into your life."
          </p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
