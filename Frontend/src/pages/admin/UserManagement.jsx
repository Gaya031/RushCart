import { useEffect, useState } from "react";
import { blockUser, getAdminUsers } from "../../api/admin.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);

  const load = async () => {
    const res = await getAdminUsers();
    setUsers(res.data || []);
  };

  useEffect(() => {
    let active = true;
    getAdminUsers().then((res) => {
      if (active) setUsers(res.data || []);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleBlock = async (user) => {
    await blockUser(user.id, { blocked: !user.is_blocked });
    await load();
  };

  return (
    <RoleDashboardLayout role="admin" title="User Management">
      <div className="max-w-6xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex justify-between border border-white/10 rounded p-3 text-white/70">
              <div>
                <p className="font-medium text-white">{u.name} ({u.role})</p>
                <p className="text-sm text-white/50">{u.email}</p>
              </div>
              <button onClick={() => toggleBlock(u)} className="px-3 py-1 rounded bg-violet-300 text-black">
                {u.is_blocked ? "Unblock" : "Block"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
