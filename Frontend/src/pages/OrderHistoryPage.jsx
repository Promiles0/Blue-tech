import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import apiService from "../api/service";

const STATUS_STYLES = {
  PENDING:    "text-yellow-400/70 bg-yellow-400/10 border-yellow-400/20",
  PROCESSING: "text-blue-400/70 bg-blue-400/10 border-blue-400/20",
  SHIPPED:    "text-purple-400/70 bg-purple-400/10 border-purple-400/20",
  DELIVERED:  "text-green-400/70 bg-green-400/10 border-green-400/20",
  CANCELLED:  "text-red-400/70 bg-red-400/10 border-red-400/20",
};

function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-display font-semibold tracking-widest uppercase border ${styles}`}>
      {status}
    </span>
  );
}

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => setLoading(true));
    
    apiService.orders.getUserOrders()
      .then(({ data }) => {
        if (!cancelled) setOrders(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-20 flex justify-center">
        <div className="w-5 h-5 border border-primary/40 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-16 max-w-3xl">
      <div className="mb-12">
        <p className="text-[11px] font-display font-semibold tracking-[0.2em] text-[#444] uppercase mb-3">
          History
        </p>
        <h1 className="font-display font-bold text-3xl text-white/90">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center gap-4">
          <Package className="w-12 h-12 text-white/10" />
          <p className="text-[#555]">No orders yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="glass-card rounded-2xl overflow-hidden">
              {/* Order header */}
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-[12px] text-[#555] mb-1">
                      Order #{order.id}
                    </p>
                    <p className="text-[13px] font-semibold text-white/80">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={order.status} />
                  <span className="font-display font-bold text-[15px] text-white">
                    ${order.total?.toFixed(2)}
                  </span>
                </div>
              </button>

              {/* Expanded items */}
              {expanded === order.id && order.items?.length > 0 && (
                <div className="border-t border-white/5 px-6 py-4 flex flex-col gap-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-[13px]">
                      <span className="text-[#888]">{item.product?.name}</span>
                      <span className="text-[#555]">
                        {item.quantity} × ${item.price?.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {order.shippingAddress && (
                    <p className="text-[12px] text-[#444] mt-2 pt-3 border-t border-white/4">
                      Ships to: {order.shippingAddress}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistoryPage;