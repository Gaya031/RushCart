import { useEffect, useState } from "react";
import { getSellerApprovalStatus } from "../../api/seller.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function SellerApprovalStatus() {
  const [data, setData] = useState(null);
  useEffect(() => {
    getSellerApprovalStatus().then((res) => setData(res.data));
  }, []);

  return (
    <RoleDashboardLayout role="seller" title="Approval Status">
      <div className="max-w-2xl">
        {!data ? (
          <p className="text-white/60">Loading status...</p>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            <p>Approved: <b className="text-white">{String(data.approved)}</b></p>
            <p>KYC Status: <b className="text-white">{String(data.kyc_status)}</b></p>
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
}
