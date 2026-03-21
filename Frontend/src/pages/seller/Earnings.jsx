import { useEffect, useState } from "react";
import { getSellerEarningsSummary } from "../../api/seller.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function SellerEarnings() {
  const [data, setData] = useState(null);
  useEffect(() => {
    getSellerEarningsSummary().then((res) => setData(res.data));
  }, []);

  return (
    <RoleDashboardLayout role="seller" title="Seller Earnings Summary">
      <div className="max-w-3xl">
        {!data ? (
          <p className="text-white/60">Loading...</p>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            <p>Completed Orders: <b className="text-white">{data.completed_orders}</b></p>
            <p>Gross Revenue: <b className="text-white">₹{data.gross_revenue}</b></p>
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
}
