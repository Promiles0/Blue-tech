import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowLeft, Plus, Minus } from "lucide-react";
import productService from "../services/productService";
import cartService from "../services/cartService";
import { useAuth } from "../contexts/AuthContext";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await productService.getById(id);
        setProduct(data);
      } catch {
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      await cartService.addItem(product.id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // handle error
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 animate-pulse">
        <div className="aspect-square bg-white/[0.03] rounded-2xl" />
        <div className="space-y-4 pt-4">
          <div className="h-3 bg-white/[0.04] rounded w-24" />
          <div className="h-8 bg-white/[0.04] rounded w-64" />
          <div className="h-4 bg-white/[0.03] rounded w-full" />
          <div className="h-4 bg-white/[0.03] rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-6 py-20 text-center text-[#555]">
        {error || "Product not found."}
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="container mx-auto px-6 py-16">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[13px] text-[#555] hover:text-white transition-colors mb-12"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-16 items-start">
        {/* Image */}
        <div className="aspect-square rounded-2xl bg-[#111] border border-white/[0.06] flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ShoppingBag className="w-24 h-24 text-white/10" />
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[11px] font-display font-semibold tracking-[0.2em] text-[#444] uppercase mb-3">
              {product.category?.name || "General"}
            </p>
            <h1 className="font-display font-bold text-3xl text-white/90 mb-4">{product.name}</h1>
            <p className="text-[#666] leading-relaxed">{product.description}</p>
          </div>

          {/* Price */}
          <div className="border-t border-white/[0.06] pt-6">
            <span className="font-display font-bold text-3xl text-white">${product.price}</span>
          </div>

          {/* Stock */}
          <p className={`text-[13px] ${inStock ? "text-green-500/70" : "text-red-500/70"}`}>
            {inStock ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {/* Quantity */}
          {inStock && (
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-[#555]">Quantity</span>
              <div className="flex items-center gap-3 border border-white/[0.07] rounded-full px-4 py-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="text-[#666] hover:text-white transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[14px] font-medium w-5 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="text-[#666] hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock || adding}
            className="py-4 bg-white text-black font-display font-semibold text-[14px] rounded-full hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {adding ? (
              <span className="w-4 h-4 border border-black/30 border-t-black/80 rounded-full animate-spin" />
            ) : added ? (
              "Added to cart ✓"
            ) : inStock ? (
              "Add to cart"
            ) : (
              "Out of stock"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;