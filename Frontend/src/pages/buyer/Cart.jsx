import React from 'react'
import { useCartStore } from "../../store/cart.store";
import { Button } from "@/components/ui/button";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";

const Cart = () => {
  const items = useCartStore(s => s.items);
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const total = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  );

  if (!items.length)
    return (
      <div className="min-h-screen rc-shell">
        <Navbar />
        <p className="p-6 text-white/60">Cart is empty</p>
        <Footer />
      </div>
    );

  return (
    <div className="min-h-screen rc-shell">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="font-display text-2xl text-white mb-6">Your Cart</h2>

        {items.map(i => (
          <div
            key={i.productId}
            className="flex justify-between items-center mb-4 border-b border-white/10 pb-4"
          >
            <div>
              <p className="text-white">{i.title}</p>
              <p className="text-sm text-white/50">
                ₹{i.price}
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                onClick={() =>
                  updateQuantity(i.productId, i.quantity - 1)
                }
              >
                -
              </Button>
              <span>{i.quantity}</span>
              <Button
                size="sm"
                onClick={() =>
                  updateQuantity(i.productId, i.quantity + 1)
                }
              >
                +
              </Button>
            </div>
          </div>
        ))}

        <div className="mt-6 font-semibold text-white">
          Total: ₹{total}
        </div>

        <Button className="mt-4 w-full bg-amber-300 text-black hover:bg-amber-200">
          Proceed to Checkout
        </Button>
      </div>
      <Footer />
    </div>
  );
}

export default Cart
