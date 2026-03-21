import React from 'react'
import { useCartStore } from "../../store/cart.store";

const CartHeader = () => {
  const items = useCartStore(s => s.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div>
      <p className="text-sm text-white/50">Home / Cart</p>
      <h1 className="font-display text-3xl text-white mt-2">
        Your Shopping Cart ({count} items)
      </h1>
    </div>
  );
}

export default CartHeader
