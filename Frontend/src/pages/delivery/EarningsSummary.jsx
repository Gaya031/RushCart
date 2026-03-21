import { useEffect, useState } from "react";
import { getDeliveryEarningsSummary } from "../../api/delivery.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function DeliveryEarningsSummary() {
  const [data, setData] = useState(null);
  useEffect(() => {
    getDeliveryEarningsSummary().then((res) => setData(res.data));
  }, []);

  return (
    <RoleDashboardLayout role="delivery" title="Delivery Earnings Summary">
      <div className="max-w-3xl">
        {!data ? (
          <p className="text-white/60">Loading...</p>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            <p>Completed Deliveries: <b className="text-white">{data.completed_deliveries}</b></p>
            <p>Total Earnings: <b className="text-white">₹{data.total_earnings}</b></p>
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
}
