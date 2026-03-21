import { useState } from "react";
import { exportReports } from "../../api/admin.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function AdminReportsExports() {
  const [csv, setCsv] = useState("");

  const load = async () => {
    const res = await exportReports();
    setCsv(res.data || "");
  };

  return (
    <RoleDashboardLayout role="admin" title="Reports & Exports">
      <div className="max-w-5xl">
        <button onClick={load} className="px-4 py-2 bg-violet-300 text-black rounded mb-4">
          Generate CSV
        </button>
        <textarea
          value={csv}
          readOnly
          className="w-full min-h-[400px] border border-white/10 rounded p-3 bg-white/5 text-white"
          placeholder="CSV data will appear here"
        />
      </div>
    </RoleDashboardLayout>
  );
}
