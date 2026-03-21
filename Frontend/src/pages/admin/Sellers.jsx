import { useState, useEffect } from "react";
import { getSellers, approveSeller, blockUser } from "../../api/admin.api";
import { Users, CheckCircle, XCircle, Shield } from "lucide-react";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function AdminSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const response = await getSellers();
      setSellers(response.data || []);
    } catch (err) {
      console.error("Error fetching sellers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId, approved) => {
    try {
      await approveSeller(sellerId, { approved, commission_percent: 10 });
      fetchSellers();
    } catch (err) {
      console.error("Error approving seller:", err);
    }
  };

  const handleBlock = async (userId, blocked) => {
    try {
      await blockUser(userId, { blocked });
      fetchSellers();
    } catch (err) {
      console.error("Error blocking user:", err);
    }
  };

  if (loading) {
    return (
      <RoleDashboardLayout role="admin" title="Seller Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-300"></div>
        </div>
      </RoleDashboardLayout>
    );
  }

  return (
    <RoleDashboardLayout role="admin" title="Seller Management">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-8 h-8 text-violet-200" />
        </div>

        {sellers.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <Users className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">No sellers yet</h2>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Store Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{seller.user?.name}</p>
                        <p className="text-sm text-white/50">{seller.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{seller.store_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        seller.is_approved 
                          ? "bg-emerald-300/20 text-emerald-200" 
                          : "bg-amber-300/20 text-amber-200"
                      }`}>
                        {seller.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{seller.commission_percent || 0}%</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {!seller.is_approved && (
                          <>
                            <button
                              onClick={() => handleApprove(seller.id, true)}
                              className="p-2 text-emerald-200 hover:bg-white/10 rounded"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleApprove(seller.id, false)}
                              className="p-2 text-red-300 hover:bg-white/10 rounded"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {seller.user && (
                          <button
                            onClick={() => handleBlock(seller.user.id, !seller.user.is_blocked)}
                            className={`p-2 rounded ${
                              seller.user.is_blocked 
                                ? "text-emerald-200 hover:bg-white/10" 
                                : "text-red-300 hover:bg-white/10"
                            }`}
                            title={seller.user.is_blocked ? "Unblock" : "Block"}
                          >
                            <Shield className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </RoleDashboardLayout>
  );
}
