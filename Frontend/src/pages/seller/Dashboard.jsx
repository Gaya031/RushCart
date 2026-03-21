import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, DollarSign, Package, ShoppingBag, TrendingUp } from "lucide-react";

import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";
import { getSellerDashboardStats } from "../../api/seller.api";
import { useAuthStore } from "../../store/auth.store";

export default function SellerDashboard() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSellerDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load dashboard stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleDashboardLayout role="seller" title="Seller Dashboard">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white">Seller Dashboard</h1>
          <p className="text-white/60">Welcome back, {user?.name}</p>
        </div>
        <Link
          to="/seller/products"
          className="bg-emerald-300 text-black px-4 py-2 rounded-lg hover:bg-emerald-200 flex items-center gap-2"
        >
          Add Product <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}
      {loading ? (
        <p className="text-white/60">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-emerald-200" />
              </div>
              <p className="text-2xl font-bold text-white">{stats?.total_items_sold || 0}</p>
              <p className="text-white/50 text-sm">Items Sold</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6 text-emerald-200" />
              </div>
              <p className="text-2xl font-bold text-white">{stats?.total_orders || 0}</p>
              <p className="text-white/50 text-sm">Total Orders</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-emerald-200" />
              </div>
              <p className="text-2xl font-bold text-white">₹{Number(stats?.total_revenue || 0).toLocaleString()}</p>
              <p className="text-white/50 text-sm">Total Revenue</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-200" />
              </div>
              <p className="text-2xl font-bold text-white">{stats?.pending_orders || 0}</p>
              <p className="text-white/50 text-sm">Pending Orders</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">Recent Orders</h2>
            {!stats?.latest_orders?.length ? (
              <p className="text-sm text-white/60">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {stats.latest_orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border border-white/10 rounded p-3">
                    <div>
                      <p className="font-medium text-white">Order #{order.id}</p>
                      <p className="text-sm text-white/50">
                        {order.items_count} items • {order.status}
                      </p>
                    </div>
                    <p className="font-semibold text-white">₹{order.total_amount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </RoleDashboardLayout>
  );
}
