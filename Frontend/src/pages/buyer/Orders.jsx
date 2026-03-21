import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { cancelOrder, getOrders } from "../../api/order.api";
import { Package, ArrowRight, Clock, CheckCircle, XCircle } from "lucide-react";
import { pushToast } from "../../store/toast.store";

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getOrders({ page: 1, size: 50, include_items: true });
      setOrders(response.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const canCancel = (status) => {
    const normalized = String(status || "").toLowerCase();
    return normalized === "placed" || normalized === "packed";
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    setCancellingOrderId(orderId);
    try {
      const response = await cancelOrder(orderId);
      const refundStatus = response?.data?.refund_status;
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "cancelled", can_cancel: false } : order
        )
      );
      const refundMessage =
        refundStatus === "initiated"
          ? " Refund has been initiated."
          : refundStatus === "failed"
            ? " Refund initiation failed and will be handled manually."
            : "";
      pushToast({ type: "success", message: `Order cancelled successfully.${refundMessage}` });
    } catch (err) {
      pushToast({ type: "error", message: err?.response?.data?.detail || "Failed to cancel order." });
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-emerald-500/20 text-emerald-200";
      case "cancelled":
        return "bg-red-500/20 text-red-200";
      case "processing":
        return "bg-blue-500/20 text-blue-200";
      default:
        return "bg-amber-500/20 text-amber-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen rc-shell">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rc-shell">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-white mb-6">My Orders</h1>

        {error && (
          <div className="border border-red-400/30 text-red-200 px-4 py-3 rounded-xl mb-4 bg-red-500/10">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-white/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">No orders yet</h2>
            <p className="text-white/60 mb-4">Start shopping to see your orders here.</p>
            <Link 
              to="/" 
              className="inline-block bg-amber-300 text-black px-6 py-2 rounded-lg hover:bg-amber-200"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-white/50">Order ID</p>
                    <p className="font-semibold text-white">#{order.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status || "Processing"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm text-white/50 mb-2">Items</p>
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-white/70">
                        <span>Product #{item.product_id} x {item.quantity}</span>
                        <span className="font-medium text-white">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-white/50">Total</p>
                    <p className="text-xl font-bold text-white">₹{order.total_amount || order.total}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canCancel(order.status) && (
                      <button
                        type="button"
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingOrderId === order.id}
                        className="px-3 py-2 rounded-lg border border-red-400/40 text-red-200 hover:bg-red-500/10 disabled:opacity-60"
                      >
                        {cancellingOrderId === order.id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                    <Link
                      to={`/order/${order.id}`}
                      className="flex items-center gap-2 text-amber-200 hover:text-amber-100"
                    >
                      View Details <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
