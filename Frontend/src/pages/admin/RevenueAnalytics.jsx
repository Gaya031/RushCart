import { useEffect, useState } from "react";
import { getRevenueAnalytics } from "../../api/admin.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function AdminRevenueAnalytics() {
  const [data, setData] = useState(null);
  useEffect(() => {
    getRevenueAnalytics().then((res) => setData(res.data));
  }, []);

  return (
    <RoleDashboardLayout role="admin" title="Revenue Analytics">
      <div className="max-w-4xl">
        {!data ? (
          <p className="text-white/60">Loading analytics...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">Total Orders: <b className="text-white">{data.total_orders}</b></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">Delivered Orders: <b className="text-white">{data.delivered_orders}</b></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">Gross Revenue: <b className="text-white">₹{data.gross_revenue}</b></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">Platform Commission: <b className="text-white">₹{data.platform_commission}</b></div>
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
}
