import React from 'react'
import { Button } from "@/components/ui/button";
import { useCartStore } from "../../store/cart.store";
import { useNavigate } from "react-router-dom";

const DELIVERY_FEE = 20;
const TAX = 5;
const FREE_DELIVERY_THRESHOLD = 200;
const OrderSummary = () => {
  const total = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  );
  const navigate = useNavigate();
  const hasItems = total > 0;

  const delivery =
    hasItems ? (total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE) : 0;
  const taxes = hasItems ? TAX : 0;

  const finalTotal = total + delivery + taxes;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sticky top-28">
      <h3 className="font-semibold text-white mb-4">Order Summary</h3>

      <div className="space-y-2 text-sm text-white/70">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="text-white">₹{total}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Fee</span>
          <span className="text-white">₹{delivery}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxes & Fees</span>
          <span className="text-white">₹{taxes}</span>
        </div>
      </div>

      <div className="flex justify-between font-bold mt-4 text-white">
        <span>Total</span>
        <span>₹{finalTotal}</span>
      </div>

      <Button
        className="w-full mt-6 bg-amber-300 text-black hover:bg-amber-200"
        onClick={() => navigate("/checkout")}
        disabled={!hasItems}
      >
        Proceed to Checkout
      </Button>
    </div>
  );
}

export default OrderSummary
