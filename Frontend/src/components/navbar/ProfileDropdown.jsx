import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingBag, Wallet, LogOut, Package } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { logout } from "../../api/auth.api";

export default function ProfileDropdown() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const isBuyer = user?.role === "buyer" || !user?.role;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // noop
    }
    clearAuth();
    navigate("/login");
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case "seller":
        return "/seller";
      case "admin":
        return "/admin";
      case "delivery":
        return "/delivery";
      default:
        return "/buyer";
    }
  };

  const getOrdersPath = () => {
    switch (user?.role) {
      case "seller":
        return "/seller/orders";
      case "admin":
        return "/admin/orders";
      case "delivery":
        return "/delivery/assigned";
      default:
        return "/buyer/orders";
    }
  };

  const getWalletPath = () => {
    if (user?.role === "delivery") return "/delivery/earnings";
    return "/buyer/wallet";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
          isBuyer ? "hover:bg-white/10" : "hover:bg-gray-100"
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
          isBuyer ? "bg-amber-300 text-black" : "bg-green-600"
        }`}>
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={`w-56 ${isBuyer ? "bg-[#121212] border-white/10 text-white" : ""}`}
      >
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{user?.name || "User"}</span>
            <span className={`text-xs ${isBuyer ? "text-white/60" : "text-gray-500"}`}>{user?.email}</span>
            <span className={`text-xs capitalize ${isBuyer ? "text-amber-200" : "text-green-600"}`}>{user?.role}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate(getDashboardPath())} className={isBuyer ? "focus:bg-white/10" : ""}>
          <Package className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate(getOrdersPath())} className={isBuyer ? "focus:bg-white/10" : ""}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          {user?.role === "delivery" ? "My Deliveries" : "My Orders"}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate(getWalletPath())} className={isBuyer ? "focus:bg-white/10" : ""}>
          <Wallet className="mr-2 h-4 w-4" />
          {user?.role === "delivery" ? "Earnings" : "Wallet"}
          {user?.wallet_balance !== undefined && (
            <span className="ml-auto font-medium">₹{user.wallet_balance}</span>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
