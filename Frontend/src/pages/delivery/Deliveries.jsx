import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { Truck, Package, CheckCircle, Clock, ArrowRight } from "lucide-react";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";
import { getAssignedDeliveries } from "../../api/delivery.api";

export default function DeliveryDeliveries() {
  const user = useAuthStore((s) => s.user);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await getAssignedDeliveries(true);
        if (!mounted) return;
        setDeliveries(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.detail || "Failed to fetch deliveries");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const pending = deliveries.filter((d) => d.status === "assigned").length;
    const inTransit = deliveries.filter((d) => d.status === "picked").length;
    const delivered = deliveries.filter((d) => d.status === "delivered").length;
    return { pending, inTransit, delivered };
  }, [deliveries]);

  return (
    <RoleDashboardLayout role="delivery" title="Delivery Dashboard">
      <div className="mb-8">
        <p className="text-white/60">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-sky-200" />
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : stats.pending}</p>
          <p className="text-white/50 text-sm">Assigned</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
            <Truck className="w-6 h-6 text-sky-200" />
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : stats.inTransit}</p>
          <p className="text-white/50 text-sm">Picked</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-sky-200" />
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : stats.delivered}</p>
          <p className="text-white/50 text-sm">Delivered</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4 text-white">Latest Deliveries</h2>

      {error && <p className="text-sm text-red-300 mb-3">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-300"></div>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <Package className="w-16 h-16 mx-auto text-white/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-white">No deliveries assigned</h2>
          <p className="text-white/60">Check back later for new deliveries.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.slice(0, 6).map((delivery) => (
            <div key={delivery.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Delivery #{delivery.id}</p>
                <p className="text-sm text-white/50">Order #{delivery.order_id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/70 capitalize">{delivery.status}</span>
                <Link
                  to={`/delivery/map?deliveryId=${delivery.id}`}
                  className="text-sm text-sky-200 hover:text-sky-100 flex items-center gap-1"
                >
                  Open Map <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </RoleDashboardLayout>
  );
}
