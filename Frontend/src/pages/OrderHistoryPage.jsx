import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";
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

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => setLoading(true));
    
    apiService.orders.getUserOrders()
      .then(({ data }) => {
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
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
            <Link
              key={order.orderId ?? order.id}
              to={`/orders/${order.orderId ?? order.id}`}
              style={{ display: 'block', background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px' }}>
                <div>
                  <p style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Order #{order.orderId ?? order.id}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                    {new Date(order.createdAt ?? order.orderedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <StatusBadge status={order.status} />
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>
                    ${parseFloat(order.totalAmount ?? order.total ?? 0).toFixed(2)}
                  </span>
                  <ChevronRight size={16} color="#555" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistoryPage;
