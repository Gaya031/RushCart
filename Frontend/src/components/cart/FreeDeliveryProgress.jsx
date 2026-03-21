import React from 'react'
import { useCartStore } from "../../store/cart.store";

const FREE_DELIVERY_THRESHOLD = 200;

const FreeDeliveryProgress = () => {
  const total = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  );
  const remaining = Math.max(FREE_DELIVERY_THRESHOLD - total, 0);
  const percent = Math.min((total / FREE_DELIVERY_THRESHOLD) * 100, 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-white/70 mb-2">
        {remaining > 0
          ? `Spend ₹${remaining} more for free delivery`
          : "You have unlocked free delivery"}
      </p>

      <div className="w-full bg-white/10 h-2 rounded">
        <div
          className="bg-amber-300 h-2 rounded"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default FreeDeliveryProgress
