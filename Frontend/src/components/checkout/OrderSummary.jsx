import React from 'react'
import { useCartStore } from "../../store/cart.store";
import { Button } from "@/components/ui/button";
import { createOrder } from "../../api/order.api";
import { confirmPayment, initiatePayment } from "../../api/payment.api";
import { useNavigate } from "react-router-dom";
import { pushToast } from "../../store/toast.store";

const PLATFORM_FEE = 1;
const TAX = 0.5;

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const ensureRazorpayLoaded = async () => {
  if (window.Razorpay) return true;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src='${RAZORPAY_SCRIPT}']`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
  return Boolean(window.Razorpay);
};

const OrderSummary = ({ address, paymentMethod, deliveryMode, deliverySlot }) => {
  const items = useCartStore(s => s.items);
  const storeId = useCartStore(s => s.storeId);
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  );
  const clearCart = useCartStore(s => s.clearCart);
  const navigate = useNavigate();

  const total = subtotal + PLATFORM_FEE + TAX;

  const placeOrder = async () => {
    if (!address) {
      pushToast({ type: "warning", message: "Please select address first." });
      return;
    }
    if (deliveryMode === "scheduled" && !deliverySlot) {
      pushToast({ type: "warning", message: "Please select a delivery time slot." });
      return;
    }

    try {
      const payload = {
        seller_id: storeId,
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        payment_method: paymentMethod || "prepaid",
        address: {
          name: address.name || "Customer",
          phone: address.phone || "9999999999",
          house_no: address.address || "N/A",
          city: address.city || "N/A",
          state: address.state || "N/A",
          pincode: address.pincode || "000000",
          coordinates:
            address.latitude && address.longitude
              ? { lat: address.latitude, lng: address.longitude }
              : null,
          delivery_mode: deliveryMode || "instant",
          delivery_slot: deliveryMode === "scheduled" ? deliverySlot : null,
        },
      };

      const res = await createOrder(payload);
      const orderId = res?.data?.order_id;

      if ((paymentMethod || "prepaid") === "prepaid") {
        const paymentInit = await initiatePayment(orderId);
        const p = paymentInit?.data;

        if (p?.gateway === "razorpay") {
          const loaded = await ensureRazorpayLoaded();
          if (!loaded || !window.Razorpay) {
            throw new Error("Razorpay SDK failed to load");
          }

          await new Promise((resolve, reject) => {
            const rzp = new window.Razorpay({
              key: p.razorpay_key_id,
              amount: p.amount_paise,
              currency: p.currency || "INR",
              name: "RushCart",
              description: `Order #${orderId}`,
              order_id: p.razorpay_order_id,
              handler: async (response) => {
                try {
                  await confirmPayment({
                    payment_id: p.payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                  resolve(true);
                } catch (err) {
                  reject(err);
                }
              },
              modal: {
                ondismiss: () => reject(new Error("Payment cancelled")),
              },
            });
            rzp.open();
          });
        } else {
          await confirmPayment({ payment_id: p.payment_id });
        }
      }

      clearCart();
      navigate(`/order/success?orderId=${orderId}`);
    } catch (err) {
      pushToast({ type: "error", message: err?.response?.data?.detail || "Failed to place order." });
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sticky top-28">
      <h3 className="font-semibold text-white mb-4">Your Order</h3>

      <div className="space-y-3 text-sm text-white/70">
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between">
            <span>{i.title} × {i.quantity}</span>
            <span className="text-white">₹{i.price * i.quantity}</span>
          </div>
        ))}
      </div>

      <hr className="my-4 border-white/10" />

      <div className="text-sm space-y-2 text-white/70">
        <div className="flex justify-between">
          <span>Item Total</span>
          <span className="text-white">₹{subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Fee</span>
          <span className="text-amber-200">Free</span>
        </div>
        <div className="flex justify-between">
          <span>Platform Fee</span>
          <span className="text-white">₹{PLATFORM_FEE}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxes</span>
          <span className="text-white">₹{TAX}</span>
        </div>
      </div>

      <div className="flex justify-between font-bold text-lg mt-4 text-white">
        <span>To Pay</span>
        <span className="text-amber-200">₹{total}</span>
      </div>

      <Button
        className="w-full mt-6 bg-amber-300 text-black hover:bg-amber-200"
        onClick={placeOrder}
        disabled={!items.length || !storeId}
      >
        Place Order ₹{total}
      </Button>

      <p className="text-xs text-center text-white/50 mt-2">
        Secure payments by Razorpay
      </p>
    </div>
  );
}

export default OrderSummary
