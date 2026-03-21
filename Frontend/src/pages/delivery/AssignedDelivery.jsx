import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedDeliveries } from "../../api/delivery.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function AssignedDelivery() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getAssignedDeliveries()
      .then((res) => setRows(res.data || []))
      .catch((err) => setError(err?.response?.data?.detail || "Failed to fetch assigned deliveries"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleDashboardLayout role="delivery" title="Assigned Deliveries">
      <div className="max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          {error && <p className="text-sm text-red-300">{error}</p>}
          {loading && <p className="text-white/60">Loading...</p>}
          {rows.map((r) => (
            <div key={r.id} className="border border-white/10 rounded p-3 text-white/70">
              <p className="text-white">Delivery #{r.id}</p>
              <p className="text-sm">Order #{r.order_id} • {r.status}</p>
              <div className="flex gap-3 text-sm mt-1">
                <Link to={`/delivery/map?deliveryId=${r.id}`} className="text-sky-200 hover:text-sky-100">
                  Open Navigation
                </Link>
                <Link to={`/delivery/${r.id}/pickup`} className="text-sky-200 hover:text-sky-100">
                  Pickup
                </Link>
                <Link to={`/delivery/${r.id}/confirm`} className="text-sky-200 hover:text-sky-100">
                  Confirm Delivery
                </Link>
              </div>
            </div>
          ))}
          {!loading && !rows.length && <p className="text-white/60">No assigned deliveries.</p>}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
