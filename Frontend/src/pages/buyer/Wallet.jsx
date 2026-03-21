import { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { getWallet } from "../../api/wallet.api";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, CreditCard } from "lucide-react";

export default function BuyerWallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await getWallet();
      setWallet(response.data);
    } catch (err) {
      console.error("Error fetching wallet:", err);
      setError("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen rc-shell">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rc-shell">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-white mb-6">My Wallet</h1>

        {error && (
          <div className="border border-red-400/30 text-red-200 px-4 py-3 rounded-xl mb-4 bg-red-500/10">
            {error}
          </div>
        )}

        {/* Wallet Balance Card */}
        <div className="rounded-2xl p-6 text-white mb-6 border border-amber-300/20 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-white">₹{wallet?.balance || 0}</p>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <WalletIcon className="w-8 h-8" />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button className="flex-1 bg-amber-300 text-black py-2 rounded-lg font-medium hover:bg-amber-200">
              Add Money
            </button>
            <button className="flex-1 border border-white/20 text-white py-2 rounded-lg font-medium hover:bg-white/10">
              Send Money
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-2xl border border-white/10 bg-white/5">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Transaction History</h2>
          </div>

          {wallet?.transactions?.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-white/30" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {wallet?.transactions?.map((txn, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === "credit" ? "bg-emerald-500/20" : "bg-red-500/20"
                      }`}
                    >
                      {txn.type === "credit" ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-200" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-200" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{txn.description || txn.type}</p>
                      <p className="text-sm text-white/50">{formatDate(txn.created_at)}</p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      txn.type === "credit" ? "text-emerald-200" : "text-red-200"
                    }`}
                  >
                    {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
