import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCartStore } from "../../store/cart.store";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";

const OrderSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clearCart);

  const orderId = params.get("orderId");

  // Clear cart ONCE when page loads
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  if (!orderId) {
    return (
      <div className="min-h-screen rc-shell">
        <Navbar />
        <div className="max-w-3xl mx-auto p-8 text-center">
          <h1 className="text-xl font-semibold text-white">Invalid Order</h1>
          <Button className="mt-4 bg-amber-300 text-black hover:bg-amber-200" onClick={() => navigate("/")}>
          Go Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen rc-shell">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-300/20 flex items-center justify-center text-amber-200 text-3xl">
          ✓
        </div>

        <h1 className="font-display text-3xl text-white mt-6">
          Order Placed Successfully
        </h1>

        <p className="text-white/60 mt-2">
          Thank you for shopping with RushCart. Your order has been confirmed.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mt-8 text-left">
          <div className="flex justify-between mb-2 text-white/70">
            <span>Order ID</span>
            <span className="font-medium text-white">#{orderId}</span>
          </div>

          <div className="flex justify-between mb-2 text-white/70">
            <span>Delivery</span>
            <span className="font-medium text-white">30-45 minutes</span>
          </div>

          <div className="flex justify-between text-white/70">
            <span>Payment</span>
            <span className="font-medium text-white">Confirmed</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-10">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => navigate("/buyer/orders")}
          >
            View Orders
          </Button>

          <Button className="bg-amber-300 text-black hover:bg-amber-200" onClick={() => navigate("/")}>
            Continue Shopping
          </Button>
        </div>

        <p className="text-sm text-white/50 mt-6">
          You will receive order updates via notification.
        </p>
      </div>
      <Footer />
    </div>
  );
}

export default OrderSuccess
