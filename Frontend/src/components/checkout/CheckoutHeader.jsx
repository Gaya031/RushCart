import React from 'react'

const CheckoutHeader = () => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-white/50">
          Cart &gt; <span className="text-amber-200">Checkout</span> &gt; Confirmation
        </p>
        <h1 className="font-display text-3xl text-white mt-2">Secure Checkout</h1>
        <p className="text-white/60">
          Complete your order details below to get your fresh goods.
        </p>
      </div>

      <div className="text-amber-200 font-medium flex items-center gap-2">
        100% secure checkout
      </div>
    </div>
  );
}

export default CheckoutHeader
