import React, { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Banknote } from 'lucide-react';

const PaymentMethod = ({ onMethodSelect }) => {
  const [method, setMethod] = useState("prepaid");

  useEffect(() => {
    onMethodSelect?.(method);
  }, [method, onMethodSelect]);

  const paymentOptions = [
    { 
      id: "prepaid", 
      label: "Prepaid (UPI/Card/Wallet)", 
      icon: CreditCard,
      desc: "Pay now and get exclusive discounts"
    },
    { 
      id: "cod", 
      label: "Cash on Delivery", 
      icon: Banknote,
      desc: "Pay when you receive the order"
    },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="font-semibold text-white mb-4">3. Payment Method</h2>

      <div className="space-y-3">
        {paymentOptions.map(opt => {
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              onClick={() => setMethod(opt.id)}
              className={`border p-4 rounded-xl cursor-pointer transition-all ${
                method === opt.id
                  ? "border-amber-300/60 bg-amber-300/10"
                  : "border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${method === opt.id ? "text-amber-200" : "text-white/40"}`} />
                <div>
                  <b className={method === opt.id ? "text-white" : "text-white/80"}>{opt.label}</b>
                  <p className="text-sm text-white/50">{opt.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {method === "prepaid" && (
        <div className="mt-4 p-4 bg-amber-300/10 border border-amber-300/30 rounded-lg">
          <div className="flex items-center gap-2 text-amber-200">
            <Smartphone className="w-5 h-5" />
            <span className="font-medium">Save ₹25 on this order!</span>
          </div>
          <p className="text-sm text-amber-100/80 mt-1">
            Prepaid orders get free delivery + exclusive discounts
          </p>
        </div>
      )}
    </div>
  );
}

export default PaymentMethod
