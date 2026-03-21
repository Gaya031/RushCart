import React from 'react'
import { useCartStore } from "../../store/cart.store";
import CartItem from "./CartItem";

const CartList = () => {
  const items = useCartStore(s => s.items);
  const savedItems = useCartStore(s => s.savedItems);
  const moveSavedToCart = useCartStore(s => s.moveSavedToCart);
  const removeSavedItem = useCartStore(s => s.removeSavedItem);

  if (!items.length) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
          Your cart is empty
        </div>
        {!!savedItems.length && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold mb-4 text-white">Saved for later ({savedItems.length})</h3>
            <div className="space-y-3">
              {savedItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 border border-white/10 rounded-lg p-3">
                  <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-sm text-white/50">₹{item.price} • Qty {item.quantity}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveSavedToCart(item.productId)}
                      className="text-sm px-3 py-1 rounded bg-amber-300 text-black hover:bg-amber-200"
                    >
                      Move to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSavedItem(item.productId)}
                      className="text-sm px-3 py-1 rounded border border-white/10 text-white/70 hover:bg-white/5"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <CartItem key={item.productId} item={item} />
      ))}
      {!!savedItems.length && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="font-semibold mb-4 text-white">Saved for later ({savedItems.length})</h3>
          <div className="space-y-3">
            {savedItems.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 border border-white/10 rounded-lg p-3">
                <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-sm text-white/50">₹{item.price} • Qty {item.quantity}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveSavedToCart(item.productId)}
                    className="text-sm px-3 py-1 rounded bg-amber-300 text-black hover:bg-amber-200"
                  >
                    Move to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSavedItem(item.productId)}
                    className="text-sm px-3 py-1 rounded border border-white/10 text-white/70 hover:bg-white/5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CartList
