import { useEffect, useState } from "react";
import { getSellerSubscriptionStatus } from "../../api/seller.api";
import { activateSubscriptionPlan, getSubscriptionPlans } from "../../api/subscription.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function SellerSubscriptionStatus() {
  const [status, setStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [activatingPlanId, setActivatingPlanId] = useState(null);

  const loadAll = async () => {
    setError("");
    try {
      const [statusRes, plansRes] = await Promise.all([getSellerSubscriptionStatus(), getSubscriptionPlans()]);
      setStatus(statusRes.data);
      setPlans(plansRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load subscription data.");
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const onActivate = async (planId) => {
    setActivatingPlanId(planId);
    setError("");
    try {
      await activateSubscriptionPlan(planId);
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to activate plan.");
    } finally {
      setActivatingPlanId(null);
    }
  };

  return (
    <RoleDashboardLayout role="seller" title="Subscription Status">
      <div className="max-w-4xl">
        {error && <p className="text-sm text-red-300 mb-3">{error}</p>}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            {!status ? (
              <p className="text-white/60">Loading status...</p>
            ) : (
              <>
                <p>Plan ID: <b className="text-white">{status.subscription_plan_id || "None"}</b></p>
                <p>Expiry: <b className="text-white">{status.subscription_expiry || "N/A"}</b></p>
                <p>Approved: <b className="text-white">{String(status.approved)}</b></p>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-semibold mb-2 text-white">Available Plans</h2>
            {plans.length ? plans.map((p) => (
              <div key={p.id} className="border-b border-white/10 py-2">
                <p className="font-medium text-white">{p.plan_name}</p>
                <p className="text-sm text-white/60">₹{p.price}</p>
                <p className="text-xs text-white/50">
                  {p.duration_days} days | Commission {p.commission_percent}%
                </p>
                <button
                  className="mt-2 text-sm bg-emerald-300 text-black px-3 py-1 rounded disabled:opacity-50"
                  onClick={() => onActivate(p.id)}
                  disabled={activatingPlanId === p.id}
                >
                  {activatingPlanId === p.id ? "Activating..." : "Activate Plan"}
                </button>
              </div>
            )) : <p className="text-white/60">No plans available</p>}
          </div>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
