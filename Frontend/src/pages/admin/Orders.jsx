import { useState, useEffect } from "react";
import { getAllOrders, refundOrder } from "../../api/admin.api";
import { ShoppingBag, RefreshCw } from "lucide-react";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getAllOrders();
      setOrders(response.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (orderId) => {
    try {
      await refundOrder(orderId);
      fetchOrders();
    } catch (err) {
      console.error("Error refunding order:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-emerald-300/20 text-emerald-200";
      case "cancelled":
        return "bg-red-500/20 text-red-200";
      case "refunded":
        return "bg-white/10 text-white/70";
      default:
        return "bg-amber-300/20 text-amber-200";
    }
  };

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(o => o.status?.toLowerCase() === filter);

  if (loading) {
    return (
      <RoleDashboardLayout role="admin" title="Order Monitoring">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-300"></div>
        </div>
      </RoleDashboardLayout>
    );
  }

  return (
    <RoleDashboardLayout role="admin" title="Order Monitoring">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="w-8 h-8 text-violet-200" />
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {["all", "processing", "shipped", "delivered", "cancelled", "refunded"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === status 
                  ? "bg-violet-300 text-black" 
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">No orders found</h2>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-white/50">Order ID</p>
                    <p className="font-semibold text-white">#{order.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status || "Processing"}
                  </span>
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
                  <p className="text-xl font-bold text-white">₹{order.total_amount || order.total}</p>
                  <div className="flex gap-2">
                    {["delivered", "cancelled", "packed", "shipped"].includes((order.status || "").toLowerCase()) && (
                      <button 
                        onClick={() => handleRefund(order.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-200 rounded hover:bg-red-500/30"
                      >
                        <RefreshCw className="w-4 h-4" /> Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </RoleDashboardLayout>
  );
}
