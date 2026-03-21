import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { claimDelivery, getAvailableDeliveries, postDeliveryLocation } from "../../api/delivery.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";
import { pushToast } from "../../store/toast.store";

export default function AvailableDeliveries() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [claimingOrderId, setClaimingOrderId] = useState(null);

  const loadRows = () => {
    setLoading(true);
    setError("");
    getAvailableDeliveries()
      .then((res) => setRows(res.data || []))
      .catch((err) => setError(err?.response?.data?.detail || "Failed to fetch available deliveries"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRows();
  }, []);

  const updateMyLocation = async (delivery) => {
    if (!delivery?.id) {
      pushToast({ type: "warning", message: "Claim this order first to update location." });
      return;
    }
    if (!("geolocation" in navigator)) {
      pushToast({ type: "error", message: "Geolocation not supported in this browser." });
      return;
    }
    setUpdatingId(delivery.id);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const payload = {
          delivery_id: String(delivery.id),
          order_id: String(delivery.order_id),
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          heading: Number(position.coords.heading || 0),
          speed: Number(position.coords.speed || 0),
          status: delivery.status || "assigned",
        };
        try {
          await postDeliveryLocation(payload);
          pushToast({ type: "success", message: `Location updated for delivery #${delivery.id}.` });
        } catch {
          pushToast({ type: "error", message: "Failed to update location. Try again." });
        } finally {
          setUpdatingId(null);
        }
      },
      () => {
        setUpdatingId(null);
        pushToast({ type: "error", message: "Unable to get current location." });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClaim = async (orderId) => {
    setClaimingOrderId(orderId);
    try {
      await claimDelivery(orderId);
      pushToast({ type: "success", message: `Order #${orderId} claimed successfully.` });
      loadRows();
    } catch (err) {
      pushToast({
        type: "error",
        message: err?.response?.data?.detail || "Failed to claim delivery.",
      });
    } finally {
      setClaimingOrderId(null);
    }
  };

  return (
    <RoleDashboardLayout role="delivery" title="Available Deliveries">
      <div className="max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={loadRows}
              className="text-xs px-3 py-1 border border-white/10 rounded text-white/70 hover:bg-white/5"
            >
              Refresh
            </button>
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {loading && <p className="text-white/60">Loading...</p>}
          {rows.map((r) => (
            <div key={r.id ?? `order-${r.order_id}`} className="border border-white/10 rounded p-3 text-white/70">
              <p className="text-white">{r?.id ? `Delivery #${r.id}` : "Open Delivery Request"}</p>
              <p className="text-sm">Order #{r.order_id} • {r.status}</p>
              <p className="text-xs text-white/50 mt-1">
                Pickup: {r?.pickup?.address || r?.pickup?.name || "Not available"}
              </p>
              <p className="text-xs text-white/50">
                Drop: {r?.drop?.address || r?.drop?.city || r?.drop?.name || "Not available"}
              </p>
              <div className="flex gap-3 text-sm mt-2">
                {r?.id ? (
                  <>
                    <Link to={`/delivery/map?deliveryId=${r.id}`} className="text-sky-200 hover:text-sky-100">
                      Open Navigation
                    </Link>
                    <button
                      type="button"
                      onClick={() => updateMyLocation(r)}
                      disabled={updatingId === r.id}
                      className="text-sky-200 hover:text-sky-100 disabled:opacity-60"
                    >
                      {updatingId === r.id ? "Updating..." : "Update My Location"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleClaim(r.order_id)}
                    disabled={claimingOrderId === r.order_id}
                    className="text-sky-200 hover:text-sky-100 disabled:opacity-60"
                  >
                    {claimingOrderId === r.order_id ? "Claiming..." : "Claim Delivery"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {!loading && !rows.length && <p className="text-white/60">No available deliveries.</p>}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
