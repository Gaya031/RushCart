import { useEffect, useState } from "react";
import { getRefundQueue, refundOrder } from "../../api/admin.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function AdminRefundControl() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const res = await getRefundQueue();
    setRows(res.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    getRefundQueue().then((res) => {
      if (!cancelled) {
        setRows(res.data || []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refund = async (orderId) => {
    await refundOrder(orderId);
    load();
  };

  return (
    <RoleDashboardLayout role="admin" title="Refund Control">
      <div className="max-w-5xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="border border-white/10 rounded p-3 flex justify-between items-center text-white/70">
              <p>Order #{r.id}</p>
              <button className="px-3 py-1 bg-violet-300 text-black rounded" onClick={() => refund(r.id)}>
                Initiate Refund
              </button>
            </div>
          ))}
          {!rows.length && <p className="text-white/60">No refunds pending.</p>}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
