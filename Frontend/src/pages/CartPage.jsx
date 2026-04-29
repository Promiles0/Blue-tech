import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import cartService from "../services/cartService";

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // useCallback so it's stable and can be called from multiple places
  const fetchCart = useCallback(async () => {
    setError("");
    try {
      const data = await cartService.getCart();
      setCart(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQty = async (itemId, qty) => {
    if (qty < 1) {
      await handleRemove(itemId);
      return;
    }
    try {
      await cartService.updateItem(itemId, qty);
      await fetchCart();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update quantity.");
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      await fetchCart();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove item.");
    }
  };

  const items = cart?.items || [];
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-20 flex items-center justify-center">
        <div className="w-5 h-5 border border-primary/40 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-16 max-w-3xl">
      <div className="mb-12">
        <p className="text-[11px] font-display font-semibold tracking-[0.2em] text-[#444] uppercase mb-3">
          Review
        </p>
        <h1 className="font-display font-bold text-3xl text-white/90">Your Cart</h1>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center gap-6">
          <ShoppingBag className="w-12 h-12 text-white/10" />
          <p className="text-[#555]">Your cart is empty.</p>
          <Link
            to="/products"
            className="px-6 py-3 bg-white text-black font-display font-semibold text-[13px] rounded-full hover:bg-white/90 transition-colors"
          >
            Shop now
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-white/[0.05]">
            {items.map((item) => (
              <div key={item.id} className="py-6 flex items-center gap-5">
                <div className="w-20 h-20 rounded-xl bg-[#111] border border-white/[0.06] shrink-0 flex items-center justify-center overflow-hidden">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-7 h-7 text-white/10" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-[14px] text-white/80 truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-[12px] text-[#555] mt-0.5">${item.product.price}</p>
                </div>

                <div className="flex items-center gap-2 border border-white/[0.07] rounded-full px-3 py-1.5">
                  <button
                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                    className="text-[#666] hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[13px] w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                    className="text-[#666] hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="text-[14px] font-semibold text-white w-20 text-right">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>

                <button
                  onClick={() => handleRemove(item.id)}
                  className="text-[#444] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-[12px] text-[#555] mb-1">Total</p>
              <p className="font-display font-bold text-2xl text-white">${total.toFixed(2)}</p>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="px-8 py-3.5 bg-white text-black font-display font-semibold text-[14px] rounded-full hover:bg-white/90 transition-colors"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;