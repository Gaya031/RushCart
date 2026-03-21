import { useEffect, useState } from "react";
import { decideReturn, getPendingReturns } from "../../api/admin.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function AdminReturnApproval() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const res = await getPendingReturns();
    setRows(res.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    getPendingReturns().then((res) => {
      if (!cancelled) {
        setRows(res.data || []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const decide = async (id, approved) => {
    await decideReturn(id, { approved });
    load();
  };

  return (
    <RoleDashboardLayout role="admin" title="Return Approval">
      <div className="max-w-5xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="border border-white/10 rounded p-3 flex justify-between items-center text-white/70">
              <p>Order #{r.id}</p>
              <div className="space-x-2">
                <button className="px-3 py-1 bg-emerald-300 text-black rounded" onClick={() => decide(r.id, true)}>Approve</button>
                <button className="px-3 py-1 bg-red-500/20 text-red-200 rounded" onClick={() => decide(r.id, false)}>Reject</button>
              </div>
            </div>
          ))}
          {!rows.length && <p className="text-white/60">No pending returns.</p>}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
