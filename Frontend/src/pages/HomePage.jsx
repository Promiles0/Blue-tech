import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ShoppingBag, Headphones, Watch, Camera } from "lucide-react";

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
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* ── Background layers ── */}
        <div className="absolute inset-0 pointer-events-none">

          {/* SVG scene — studio backdrop + horizon + perspective floor */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              {/* Dark vertical gradient — ceiling to floor */}
              <linearGradient id="bg-vert" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0e0c14" />
                <stop offset="58%"  stopColor="#090909" />
                <stop offset="100%" stopColor="#030303" />
              </linearGradient>

              {/* Overhead studio spotlight on the backdrop */}
              <radialGradient id="studio-light" cx="50%" cy="30%" r="55%">
                <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.035" />
                <stop offset="55%"  stopColor="#8472f5" stopOpacity="0.025" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* Purple glow reflecting off the floor surface */}
              <linearGradient id="floor-refl" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%"   stopColor="#8472f5" stopOpacity="0.06" />
                <stop offset="70%"  stopColor="#8472f5" stopOpacity="0.01" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </linearGradient>

              {/* Horizon line — fades to transparent at both ends */}
              <linearGradient id="horizon-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="white" stopOpacity="0" />
                <stop offset="20%"  stopColor="white" stopOpacity="0.1" />
                <stop offset="50%"  stopColor="white" stopOpacity="0.18" />
                <stop offset="80%"  stopColor="white" stopOpacity="0.1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Base gradient */}
            <rect width="1440" height="900" fill="url(#bg-vert)" />

            {/* Studio light on backdrop */}
            <rect width="1440" height="900" fill="url(#studio-light)" />

            {/* Floor surface — slightly darker plane */}
            <rect x="0" y="590" width="1440" height="310" fill="#020202" fillOpacity="0.55" />

            {/* Floor purple reflection */}
            <rect x="0" y="590" width="1440" height="220" fill="url(#floor-refl)" />

            {/* Perspective grid — radial lines from vanishing point (720, 590) */}
            <g stroke="white" strokeWidth="0.6" opacity="0.055">
              {[0, 144, 288, 432, 576, 720, 864, 1008, 1152, 1296, 1440].map((x) => (
                <line key={x} x1="720" y1="590" x2={x} y2="900" />
              ))}
            </g>

            {/* Perspective grid — horizontal lines (widths computed from VP) */}
            <g stroke="white" strokeWidth="0.5" opacity="0.05">
              {/* y=596 */ }<line x1="698" y1="596" x2="742" y2="596" />
              {/* y=606 */ }<line x1="676" y1="606" x2="764" y2="606" />
              {/* y=622 */ }<line x1="637" y1="622" x2="803" y2="622" />
              {/* y=648 */ }<line x1="572" y1="648" x2="868" y2="648" />
              {/* y=692 */ }<line x1="462" y1="692" x2="978" y2="692" />
              {/* y=762 */ }<line x1="264" y1="762" x2="1176" y2="762" />
              {/* y=900 */ }<line x1="0"   y1="900" x2="1440" y2="900" />
            </g>

            {/* Horizon line */}
            <line
              x1="0" y1="590" x2="1440" y2="590"
              stroke="url(#horizon-line)"
              strokeWidth="0.8"
            />
          </svg>

          {/* Dot grid — backdrop area only */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.11) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
              opacity: 0.45,
              maskImage: "linear-gradient(to bottom, white 0%, white 55%, transparent 75%)",
              WebkitMaskImage: "linear-gradient(to bottom, white 0%, white 55%, transparent 75%)",
            }}
          />

          {/* Animated orbs */}
          <div className="orb-1 absolute top-[-8%] left-[10%] w-130 h-130 rounded-full bg-[#8472f5]/12 blur-[110px]" />
          <div className="orb-2 absolute top-[20%] right-[-8%] w-105 h-105 rounded-full bg-[#a78bfa]/7 blur-[130px]" />
          <div className="orb-3 absolute bottom-[-12%] left-[-4%] w-90 h-90 rounded-full bg-[#f0c060]/5 blur-[100px]" />

          {/* Grain */}
          <div className="bg-grain absolute inset-0 opacity-[0.04]" />

          {/* Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 85% 75% at 50% 38%, transparent 35%, #080808 95%)",
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 py-12 pb-20 sm:pb-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* ── Left: text ── */}
            <div>
              <div className="inline-flex items-center gap-2.5 mb-8 sm:mb-10">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-display font-semibold tracking-[0.22em] text-[#555] uppercase">
                  New Collection — 2026
                </span>
              </div>

              <h1 className="font-display font-extrabold leading-[0.92] tracking-tight mb-6 sm:mb-8">
                <span
                  className="block text-[clamp(2rem,9vw,6.5rem)] bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(100deg, #ffffff 25%, #c4b5fd 60%, #8472f5 100%)",
                  }}
                >
                  Considered
                </span>
                <span
                  className="block text-[clamp(2rem,9vw,6.5rem)]"
                  style={{
                    WebkitTextStroke: "1.5px rgba(132,114,245,0.45)",
                    color: "transparent",
                  }}
                >
                  Objects.
                </span>
              </h1>

              <p className="text-[#666] text-base sm:text-lg max-w-sm leading-relaxed mb-8 sm:mb-10">
                Carefully selected tools for a quieter, more deliberate digital life.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5">
                <Link
                  to="/products"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-white text-black font-display font-semibold text-[14px] tracking-wide rounded-full hover:bg-white/90 transition-colors group"
                >
                  Shop now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/products"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 border border-white/10 text-[#888] font-display font-semibold text-[14px] tracking-wide rounded-full hover:border-white/20 hover:text-white transition-all"
                >
                  Browse categories
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 sm:gap-10 mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-white/6">
                {[
                  { value: "2,400+", label: "Products" },
                  { value: "180+",   label: "Countries" },
                  { value: "4.9★",   label: "Rating" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="font-display font-bold text-lg sm:text-xl text-white">{s.value}</p>
                    <p className="text-[10px] sm:text-[11px] text-[#444] tracking-[0.14em] uppercase mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: product card showcase ── */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-105 h-120">

                {/* Back-left card — Cameras */}
                <div className="absolute top-10 left-0 w-56 h-72 rounded-2xl border border-white/6 bg-linear-to-br from-[#0e1828] to-[#080f1a] -rotate-6 shadow-2xl overflow-hidden">
                  <div className="p-5 h-full flex flex-col">
                    <p className="text-[10px] font-display tracking-[0.18em] text-[#334] uppercase">Cameras</p>
                    <div className="flex-1 flex items-center justify-center">
                      <Camera className="w-16 h-16 text-white/10" />
                    </div>
                    <div>
                      <p className="text-[13px] font-display font-semibold text-white/40">Lumix View</p>
                      <p className="text-[13px] font-semibold text-white/25 mt-0.5">$799</p>
                    </div>
                  </div>
                </div>

                {/* Back-right card — Wearables */}
                <div className="absolute top-4 right-0 w-56 h-72 rounded-2xl border border-white/6 bg-linear-to-br from-[#1a0e24] to-[#100812] rotate-5 shadow-2xl overflow-hidden">
                  <div className="p-5 h-full flex flex-col">
                    <p className="text-[10px] font-display tracking-[0.18em] text-[#443] uppercase">Wearables</p>
                    <div className="flex-1 flex items-center justify-center">
                      <Watch className="w-16 h-16 text-white/10" />
                    </div>
                    <div>
                      <p className="text-[13px] font-display font-semibold text-white/40">Onyx Watch</p>
                      <p className="text-[13px] font-semibold text-white/25 mt-0.5">$529</p>
                    </div>
                  </div>
                </div>

                {/* Front card — Audio (featured) */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-80 rounded-2xl border border-primary/25 bg-linear-to-br from-[#12102a] to-[#0a0816] shadow-2xl z-10 overflow-hidden">
                  {/* Glow inside card */}
                  <div className="absolute inset-0 bg-primary/5 rounded-2xl" />
                  <div className="p-6 h-full flex flex-col relative z-10">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-display tracking-[0.18em] text-primary/50 uppercase">Audio</p>
                      <span className="text-[9px] font-display font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                        New
                      </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-[2]" />
                        <Headphones className="w-24 h-24 text-primary/50 relative z-10" />
                      </div>
                    </div>

                    <div>
                      <p className="text-[15px] font-display font-bold text-white/85 mb-2">Arc Headphones</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[15px] font-semibold text-white">$349</p>
                        <Link
                          to="/products/1"
                          className="flex items-center gap-1.5 text-[11px] text-primary/60 hover:text-primary transition-colors"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-25">
          <span className="text-[9px] uppercase tracking-[0.35em]">Scroll</span>
          <div className="w-px h-10 bg-linear-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────── */}
      <section className="border-t border-white/6 py-14 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                className="group flex items-center justify-between px-4 md:px-8 py-7 sm:py-10 hover:bg-white/2 transition-colors first:pl-0 last:pr-0"
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
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10 sm:mb-14">
            <div>
              <p className="text-[11px] font-display font-semibold tracking-[0.2em] text-[#444] uppercase mb-3">
                Curated
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white/90 tracking-tight">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
            {FEATURED.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND STATEMENT ───────────────────────────────────────────── */}
      <section className="border-t border-white/6 py-16 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl">
          <p className="font-display font-light text-xl sm:text-3xl md:text-4xl text-white/40 leading-relaxed tracking-tight">
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
