import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Wallet, Clock3, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { getOrderSummary } from "../../api/order.api";
import { getWallet } from "../../api/wallet.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function BuyerDashboard() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState({
    total_orders: 0,
    active_orders: 0,
    delivered_orders: 0,
    recent_orders: [],
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [summaryRes, walletRes] = await Promise.allSettled([getOrderSummary(), getWallet()]);

        if (!mounted) return;

        if (summaryRes.status === "fulfilled") {
          setSummary({
            total_orders: Number(summaryRes.value?.data?.total_orders ?? 0),
            active_orders: Number(summaryRes.value?.data?.active_orders ?? 0),
            delivered_orders: Number(summaryRes.value?.data?.delivered_orders ?? 0),
            recent_orders: Array.isArray(summaryRes.value?.data?.recent_orders) ? summaryRes.value.data.recent_orders : [],
          });
        }

        if (walletRes.status === "fulfilled") {
          const nextBalance = Number(walletRes.value?.data?.balance ?? walletRes.value?.data?.wallet_balance ?? 0);
          setWalletBalance(Number.isFinite(nextBalance) ? nextBalance : 0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      totalOrders: Number(summary.total_orders || 0),
      activeOrders: Number(summary.active_orders || 0),
      deliveredOrders: Number(summary.delivered_orders || 0),
    }),
    [summary]
  );

  return (
    <RoleDashboardLayout role="buyer" title="Buyer Dashboard">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">Buyer Dashboard</h1>
        <p className="text-white/60">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
            <ShoppingBag className="w-6 h-6 text-amber-200" />
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : stats.totalOrders}</p>
          <p className="text-white/50 text-sm">Total Orders</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
            <Clock3 className="w-6 h-6 text-amber-200" />
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : stats.activeOrders}</p>
          <p className="text-white/50 text-sm">Active Orders</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-amber-200" />
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : stats.deliveredOrders}</p>
          <p className="text-white/50 text-sm">Delivered Orders</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-amber-200" />
          </div>
          <p className="text-2xl font-bold text-white">₹{loading ? "..." : walletBalance}</p>
          <p className="text-white/50 text-sm">Wallet Balance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/buyer/orders"
              className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:bg-white/5 text-white/70"
            >
              <span className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-amber-200" />
                View My Orders
              </span>
              <ArrowRight className="w-4 h-4 text-white/40" />
            </Link>
            <Link
              to="/buyer/wallet"
              className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:bg-white/5 text-white/70"
            >
              <span className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-amber-200" />
                Open Wallet
              </span>
              <ArrowRight className="w-4 h-4 text-white/40" />
            </Link>
            <Link
              to="/products"
              className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:bg-white/5 text-white/70"
            >
              <span className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-amber-200" />
                Continue Shopping
              </span>
              <ArrowRight className="w-4 h-4 text-white/40" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Recent Order Snapshot</h2>
          {loading ? (
            <p className="text-white/60">Loading orders...</p>
          ) : summary.recent_orders.length === 0 ? (
            <p className="text-white/60">No orders yet. Place your first order from nearby stores.</p>
          ) : (
            <div className="space-y-2">
              {summary.recent_orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between text-sm border border-white/10 rounded-lg px-3 py-2 text-white/70"
                >
                  <span>Order #{order.id}</span>
                  <span className="capitalize text-white/50">{order.status || "placed"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
