import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import productService from "../services/productService";

const CATEGORIES = ["All", "Audio", "Wearables", "Cameras"];

function FilterPanel({ onClose }) {
  return (
    <div className="mb-8 p-6 glass-card rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-display font-semibold text-white">Filters</h3>
        <button onClick={onClose} className="text-[#666] hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[13px] text-[#555]">Filter options coming soon.</p>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="relative aspect-square bg-[#111] flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <ShoppingBag className="w-14 h-14 text-white/10" />
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-[11px] font-display tracking-widest text-white/50 uppercase">
                Sold out
              </span>
            </div>
          )}
        </div>
        <div className="p-5">
          <p className="text-[10px] text-[#444] font-display tracking-[0.15em] uppercase mb-1.5">
            {product.category?.name || "General"}
          </p>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[14px] font-display font-semibold text-[#bbb] group-hover:text-white transition-colors truncate">
              {product.name}
            </h3>
            <span className="text-[14px] font-semibold text-white shrink-0">
              ${product.price}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await productService.getAll({ search: searchQuery, category: categoryFilter });
        setProducts(data);
      } catch {
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [searchQuery, categoryFilter]);

  const setCategory = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat === "All") {
      params.delete("category");
    } else {
      params.set("category", cat.toLowerCase());
    }
    setSearchParams(params);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    setSearchParams(params);
  };

  const activeCategory =
    CATEGORIES.find((c) => c.toLowerCase() === categoryFilter) || "All";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 sm:mb-12">
        <div>
          <p className="text-[11px] font-display font-semibold tracking-[0.2em] text-[#444] uppercase mb-3">
            Catalogue
          </p>
          <h1 className="font-display font-bold text-3xl text-white/90">All Products</h1>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 text-[13px] text-[#666] hover:text-white transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && <FilterPanel onClose={() => setShowFilters(false)} />}

      {/* Active search badge */}
      {searchQuery && (
        <div className="mb-8 flex items-center gap-3">
          <span className="text-[13px] text-[#555]">Results for</span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/[0.07] rounded-full text-[13px] text-white">
            "{searchQuery}"
            <button onClick={clearSearch} className="text-[#555] hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex items-center gap-2 mb-8 sm:mb-12 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-5 py-2 rounded-full text-[12px] font-display font-medium tracking-wide transition-all ${
              activeCategory === cat
                ? "bg-white text-black"
                : "border border-white/[0.07] text-[#666] hover:border-white/20 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-white/3" />
              <div className="p-5 space-y-2">
                <div className="h-2 bg-white/5 rounded w-16" />
                <div className="h-3 bg-white/5 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-[#555]">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#555] text-[15px]">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;