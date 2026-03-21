import { Link, useLocation } from "react-router-dom";
import Navbar from "../navbar/Navbar";

const navByRole = {
  buyer: [
    ["/buyer", "Dashboard"],
    ["/buyer/orders", "My Orders"],
    ["/buyer/wallet", "Wallet"],
    ["/products", "Browse Products"],
  ],
  seller: [
    ["/seller", "Dashboard"],
    ["/seller/onboarding", "Onboarding"],
    ["/seller/kyc", "KYC Upload"],
    ["/seller/approval-status", "Approval Status"],
    ["/seller/products", "Product Management"],
    ["/seller/orders", "Order Management"],
    ["/seller/earnings", "Earnings Summary"],
    ["/seller/commission", "Commission Details"],
    ["/seller/subscription", "Subscription Status"],
  ],
  admin: [
    ["/admin", "Dashboard"],
    ["/admin/sellers", "Seller Approval & KYC"],
    ["/admin/users", "User Management"],
    ["/admin/orders", "Order Monitoring"],
    ["/admin/returns", "Return Approval"],
    ["/admin/refunds", "Refund Control"],
    ["/admin/commission-config", "Commission Config"],
    ["/admin/revenue-analytics", "Revenue Analytics"],
    ["/admin/reports", "Reports & Exports"],
    ["/admin/banners", "Homepage Banners"],
    ["/admin/payouts", "Payouts"],
  ],
  delivery: [
    ["/delivery", "Dashboard"],
    ["/delivery/available", "Available Deliveries"],
    ["/delivery/assigned", "Assigned Delivery"],
    ["/delivery/map", "Navigation Map"],
    ["/delivery/earnings", "Earnings Summary"],
  ],
};

const roleTheme = {
  buyer: {
    accentText: "text-amber-200",
    accentBorder: "border-amber-300/50",
  },
  seller: {
    accentText: "text-emerald-200",
    accentBorder: "border-emerald-300/50",
  },
  admin: {
    accentText: "text-violet-200",
    accentBorder: "border-violet-300/50",
  },
  delivery: {
    accentText: "text-sky-200",
    accentBorder: "border-sky-300/50",
  },
};

export default function RoleDashboardLayout({ role, title, children }) {
  const location = useLocation();
  const links = navByRole[role] || [];
  const theme = roleTheme[role] || roleTheme.buyer;
  const activeClass = `bg-white/10 text-white border-l-2 ${theme.accentBorder}`;

  return (
    <div className="min-h-screen rc-shell">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-2xl p-4 sticky top-24 border border-white/10 bg-white/5">
            <h2 className={`font-semibold mb-3 capitalize text-white ${theme.accentText}`}>
              {role} Panel
            </h2>
            <div className="space-y-1">
              {links.map(([to, label]) => {
                const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`block px-3 py-2 rounded-lg text-sm transition ${
                      active
                        ? `${activeClass} font-medium`
                        : "text-white/60 hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
        <main className="col-span-12 lg:col-span-9">
          {title && <h1 className="text-2xl font-bold mb-4 text-white">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
