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

  const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount ?? order.total ?? 0), 0);
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

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
    <div className="container mx-auto px-6 py-16 max-w-5xl">
      <div className="section-heading" style={{ marginBottom: 28 }}>
        <div>
          <p className="label-muted">Order history</p>
          <h1 className="font-display font-bold text-4xl text-white/90">My Orders</h1>
          <p style={{ color: '#999', marginTop: 10, lineHeight: 1.8 }}>Track your latest purchases and quickly access order details from one polished dashboard.</p>
        </div>
      </div>

      <div className="order-summary-meta" style={{ marginBottom: 32 }}>
        <div className="dashboard-card-secondary">
          <span className="label-muted">Orders placed</span>
          <p style={{ fontSize: 22, fontWeight: 900, marginTop: 10 }}>{orders.length}</p>
        </div>
        <div className="dashboard-card-secondary">
          <span className="label-muted">Total spent</span>
          <p style={{ fontSize: 22, fontWeight: 900, marginTop: 10 }}>${totalSpent.toFixed(2)}</p>
        </div>
        <div className="dashboard-card-secondary">
          <span className="label-muted">Delivered</span>
          <p style={{ fontSize: 22, fontWeight: 900, marginTop: 10 }}>{deliveredCount}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="dashboard-panel text-center py-24">
          <Package className="w-12 h-12 text-white/10 mx-auto mb-6" />
          <p className="text-white text-xl font-semibold mb-2">No orders found</p>
          <p className="text-[#999] max-w-md mx-auto">Once you place an order, it will appear here with real-time tracking and status updates.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          {orders.map((order) => (
            <Link
              key={order.orderId ?? order.id}
              to={`/orders/${order.orderId ?? order.id}`}
              className="order-card"
              style={{ textDecoration: 'none' }}
            >
              <div className="order-card-head">
                <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 18, background: 'rgba(124,92,240,0.12)', display: 'grid', placeItems: 'center', color: '#7c5cf0' }}>
                    <Package size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Order #{order.orderId ?? order.id}</p>
                    <p style={{ fontSize: 13, color: '#888' }}>{new Date(order.createdAt ?? order.orderedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', textAlign: 'right' }}>
                  <StatusBadge status={order.status} />
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>${parseFloat(order.totalAmount ?? order.total ?? 0).toFixed(2)}</p>
                  <ChevronRight size={18} color="#7c5cf0" />
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
