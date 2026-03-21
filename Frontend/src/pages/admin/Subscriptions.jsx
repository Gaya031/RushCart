import { useEffect, useState } from "react";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";
import { createSubscriptionPlan, getSubscriptionPlans } from "../../api/subscription.api";

const emptyForm = {
  plan_name: "",
  price: "",
  duration_days: "",
  commission_percent: "",
  active: true,
};

const toNumber = (value) => (value === "" ? "" : Number(value));

export default function AdminSubscriptions() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const loadPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSubscriptionPlans();
      setPlans(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createSubscriptionPlan({
        plan_name: form.plan_name.trim(),
        price: Number(form.price),
        duration_days: Number(form.duration_days),
        commission_percent: Number(form.commission_percent),
        active: Boolean(form.active),
      });
      setForm(emptyForm);
      await loadPlans();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to create plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleDashboardLayout role="admin" title="Subscription Plans">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Active Plans</h2>
          {loading ? (
            <p className="text-white/60">Loading plans...</p>
          ) : plans.length === 0 ? (
            <p className="text-white/60">No active plans yet.</p>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-white font-semibold">{plan.plan_name}</p>
                    <p className="text-xs text-white/50">
                      {plan.duration_days} days · {plan.commission_percent}% commission
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">₹{plan.price}</p>
                    <p className={`text-xs ${plan.active ? "text-emerald-200" : "text-red-300"}`}>
                      {plan.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create Plan</h2>
          {error && <p className="text-sm text-red-300 mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Plan name</label>
              <input
                type="text"
                value={form.plan_name}
                onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: toNumber(e.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Duration (days)</label>
                <input
                  type="number"
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: toNumber(e.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                  min="1"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Commission (%)</label>
              <input
                type="number"
                value={form.commission_percent}
                onChange={(e) => setForm({ ...form, commission_percent: toNumber(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                min="0"
                max="100"
                step="0.1"
                required
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5"
              />
              Active plan
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-violet-300 text-black py-2 font-medium hover:bg-violet-200 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Plan"}
            </button>
          </form>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
