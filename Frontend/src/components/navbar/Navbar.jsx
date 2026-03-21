import { Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../store/auth.store";
import { useCartStore } from "../../store/cart.store";
import { ShoppingCart } from "lucide-react";

const LocationSelector = lazy(() => import("./LocationsSelector"));
const SearchBar = lazy(() => import("./SearchBar"));

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const cartItemsCount = useCartStore((s) => s.items.length);
  const navigate = useNavigate();
  const isBuyerContext = !user || user.role === "buyer";
  const headerClass = "bg-[#0b0b0b]/90 border-b border-white/10 text-white backdrop-blur";
  const brandClass = "text-amber-300 hover:text-amber-200";
  const ghostButtonClass = "text-white/80 hover:text-white";
  const outlineButtonClass = "border-white/20 text-white/80 hover:text-white hover:bg-white/10";

  return (
    <header className={`sticky top-0 z-50 ${headerClass}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className={`text-xl font-bold tracking-tight font-display ${brandClass}`}>
          RushCart
        </Link>

        {isBuyerContext && (
          <Suspense fallback={null}>
            <LocationSelector variant="dark" />
            <SearchBar variant="dark" />
          </Suspense>
        )}

        <div className="ml-auto flex items-center gap-3">
          {!user && (
            <Button
              variant="outline"
              className={outlineButtonClass}
              onClick={() => navigate("/seller")}
            >
              Become a Seller
            </Button>
          )}

          {!user ? (
            <>
              <Link
                to="/cart"
                className={`relative p-2 rounded-full ${isBuyerContext ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              <Button 
                variant="ghost" 
                className={ghostButtonClass}
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                className={isBuyerContext ? "bg-amber-300 text-black hover:bg-amber-200" : ""}
                onClick={() => navigate("/register")}
              >
                Register
              </Button>
            </>
          ) : (
            <>
              {user.role === "buyer" && (
                <Link
                  to="/cart"
                  className={`relative p-2 rounded-full ${isBuyerContext ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
              )}
              <ProfileDropdown />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
