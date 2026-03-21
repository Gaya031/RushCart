import CheckoutHeader from "../../components/checkout/CheckoutHeader";
import AddressSection from "../../components/checkout/AddressSection";
import DeliverySchedule from "../../components/checkout/DeliverySchedule";
import PaymentMethod from "../../components/checkout/PaymentMethod";
import OrderSummary from "../../components/checkout/OrderSummary";
import { useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";

export default function CheckoutPage() {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("prepaid");
  const [deliveryMode, setDeliveryMode] = useState("instant");
  const [deliverySlot, setDeliverySlot] = useState(null);

  return (
    <div className="min-h-screen rc-shell">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <CheckoutHeader />

        <div className="grid grid-cols-12 gap-8 mt-8">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <AddressSection onAddressSelect={setSelectedAddress} />
            <DeliverySchedule onModeChange={setDeliveryMode} onSlotChange={setDeliverySlot} />
            <PaymentMethod onMethodSelect={setPaymentMethod} />
          </div>

          <div className="col-span-12 lg:col-span-4">
            <OrderSummary
              address={selectedAddress}
              paymentMethod={paymentMethod}
              deliveryMode={deliveryMode}
              deliverySlot={deliverySlot}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
