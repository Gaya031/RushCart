import { useEffect, useState } from "react";
import { getSellerCommissionDetails } from "../../api/seller.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function SellerCommission() {
  const [data, setData] = useState(null);
  useEffect(() => {
    getSellerCommissionDetails().then((res) => setData(res.data));
  }, []);

  return (
    <RoleDashboardLayout role="seller" title="Commission Details">
      <div className="max-w-4xl">
        {!data ? (
          <p className="text-white/60">Loading...</p>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2 text-white/70">
            <p>Current Commission %: <b className="text-white">{data.current_commission_percent}</b></p>
            <p>Total Platform Commission: <b className="text-white">₹{data.total_platform_commission}</b></p>
            <p>Total Seller Earnings: <b className="text-white">₹{data.total_seller_earnings}</b></p>
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
}
