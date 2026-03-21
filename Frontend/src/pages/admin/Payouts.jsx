import { useState } from "react";
import { payoutSeller, payoutDeliveryPartner } from "../../api/admin.api";
import { DollarSign, CheckCircle, Truck } from "lucide-react";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";
import { pushToast } from "../../store/toast.store";

export default function AdminPayouts() {
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (err) =>
    err?.response?.data?.error?.message ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    "Failed to initiate payout.";

  const handlePayout = async (type, id) => {
    setLoading(true);
    try {
      let res;
      if (type === "seller") {
        res = await payoutSeller(id);
      } else {
        res = await payoutDeliveryPartner(id);
      }
      const payload = res?.data || {};
      if (payload.processed === false) {
        pushToast({ type: "warning", message: payload.reason || "No pending payouts found." });
      } else {
        pushToast({
          type: "success",
          message: `Payout initiated successfully${payload.amount ? ` (₹${payload.amount})` : ""}.`,
        });
      }
    } catch (err) {
      console.error("Error initiating payout:", err);
      pushToast({ type: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleDashboardLayout role="admin" title="Payout Management">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-8 h-8 text-violet-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seller Payouts */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-200" />
              <h2 className="text-lg font-semibold text-white">Seller Payouts</h2>
            </div>
            <p className="text-white/60 mb-4">
              Process payouts to sellers after deducting platform commission.
            </p>
            <button 
              onClick={() => handlePayout("seller", 1)}
              disabled={loading}
              className="w-full bg-emerald-300 text-black py-2 rounded-lg hover:bg-emerald-200 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Process Seller Payouts"}
            </button>
          </div>

          {/* Delivery Partner Payouts */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-6 h-6 text-sky-200" />
              <h2 className="text-lg font-semibold text-white">Delivery Partner Payouts</h2>
            </div>
            <p className="text-white/60 mb-4">
              Process payouts to delivery partners for completed deliveries.
            </p>
            <button 
              onClick={() => handlePayout("delivery", 1)}
              disabled={loading}
              className="w-full bg-sky-300 text-black py-2 rounded-lg hover:bg-sky-200 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Process Delivery Payouts"}
            </button>
          </div>
        </div>
    </RoleDashboardLayout>
  );
}
