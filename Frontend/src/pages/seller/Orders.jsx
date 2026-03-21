import { useState, useEffect } from "react";
import { getSellerOrders, updateSellerOrderStatus } from "../../api/seller.api";
import { Package, Clock, CheckCircle, XCircle } from "lucide-react";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getSellerOrders();
      setOrders(response.data || []);
      setMessage("");
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await updateSellerOrderStatus(orderId, status);
      fetchOrders();
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Failed to update order status");
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
        return "bg-emerald-300/20 text-emerald-200";
      case "cancelled":
        return "bg-red-500/20 text-red-200";
      case "packed":
      case "shipped":
        return "bg-sky-300/20 text-sky-200";
      case "placed":
      default:
        return "bg-amber-300/20 text-amber-200";
    }
  };

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(o => o.status?.toLowerCase() === filter);

  if (loading) {
    return (
      <RoleDashboardLayout role="seller" title="Order Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-300"></div>
        </div>
      </RoleDashboardLayout>
    );
  }

  return (
    <RoleDashboardLayout role="seller" title="Order Management">

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {["all", "placed", "packed", "shipped", "delivered", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === status 
                  ? "bg-emerald-300 text-black" 
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        {message && <p className="text-sm text-red-300 mb-3">{message}</p>}

        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-white/30 mb-4" />
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

                <div className="border-t border-white/10 pt-4 mt-4">
                  <p className="text-xl font-bold text-right text-white">₹{order.total_amount || order.total}</p>
                </div>
                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <div className="border-t border-white/10 pt-3 mt-3 flex gap-2 justify-end">
                    {order.status === "placed" && (
                      <button
                        onClick={() => updateStatus(order.id, "packed")}
                        className="px-3 py-1 text-sm rounded bg-emerald-300 text-black"
                      >
                        Mark Packed
                      </button>
                    )}
                    {(order.status === "placed" || order.status === "packed") && (
                      <button
                        onClick={() => updateStatus(order.id, "shipped")}
                        className="px-3 py-1 text-sm rounded border border-emerald-300/40 text-emerald-200 hover:bg-emerald-300/10"
                      >
                        Mark Shipped
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </RoleDashboardLayout>
  );
}
