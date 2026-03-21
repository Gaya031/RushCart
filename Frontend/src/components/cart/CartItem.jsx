// import React from "react";
// import { Button } from "@/components/ui/button";
// import { useCartStore } from "../../store/cart.store";

// const CartItem = () => {
//   const updateQuantity = useCartStore((s) => s.updateQuantity);

//   return (
//     <div className="bg-white p-4 rounded-xl flex gap-4">
//       <img
//         src={item.image}
//         alt={item.title}
//         className="w-20 h-20 object-cover rounded"
//       />

//       <div className="flex-1">
//         <h3 className="font-semibold">{item.title}</h3>
//         <p className="text-sm text-gray-500">₹{item.price}</p>

//         <div className="flex gap-4 mt-2 text-sm text-gray-600">
//           <button
//             className="text-red-500"
//             onClick={() => updateQuantity(item.productId, 0)}
//           >
//             Remove
//           </button>
//           <button className="text-green-600">Save for later</button>
//         </div>
//       </div>

//       <div className="flex items-center gap-2">
//         <Button
//           size="sm"
//           onClick={() => updateQuantity(item.productId, item.quantity - 1)}
//         >
//           -
//         </Button>
//         <span>{item.quantity}</span>
//         <Button
//           size="sm"
//           onClick={() => updateQuantity(item.productId, item.quantity + 1)}
//         >
//           +
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default CartItem;


import React from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "../../store/cart.store";

const CartItem = ({ item }) => {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const saveForLater = useCartStore((s) => s.saveForLater);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex gap-4">
      <img
        src={item.image}
        alt={item.title}
        className="w-20 h-20 object-cover rounded"
      />

      <div className="flex-1">
        <h3 className="font-semibold text-white">{item.title}</h3>
        <p className="text-sm text-white/50">₹{item.price}</p>

        <div className="flex gap-4 mt-2 text-sm text-white/60">
          <button
            className="text-red-300 hover:text-red-200"
            onClick={() => updateQuantity(item.productId, 0)}
          >
            Remove
          </button>
          <button
            className="text-amber-200 hover:text-amber-100"
            onClick={() => saveForLater(item.productId)}
          >
            Save for later
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-white/10 text-white hover:bg-white/20"
          onClick={() =>
            updateQuantity(item.productId, Math.max(1, item.quantity - 1))
          }
        >
          -
        </Button>

        <span className="text-white">{item.quantity}</span>

        <Button
          size="sm"
          className="bg-white/10 text-white hover:bg-white/20"
          onClick={() =>
            updateQuantity(item.productId, item.quantity + 1)
          }
        >
          +
        </Button>
      </div>
    </div>
  );
};

export default CartItem;
