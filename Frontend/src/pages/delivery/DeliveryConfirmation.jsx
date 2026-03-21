import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { confirmDelivery } from "../../api/delivery.api";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

export default function DeliveryConfirmationPage() {
  const { deliveryId } = useParams();
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const confirm = async () => {
    try {
      await confirmDelivery(deliveryId);
      setMsg("Delivery confirmed.");
      setTimeout(() => navigate("/delivery/earnings"), 700);
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Delivery confirmation failed");
    }
  };

  return (
    <RoleDashboardLayout role="delivery" title="Delivery Confirmation">
      <div className="max-w-xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          <p className="mb-4">Delivery ID: <span className="text-white">{deliveryId}</span></p>
          <button onClick={confirm} className="bg-sky-300 text-black px-4 py-2 rounded">
            Confirm Delivered
          </button>
          {msg && <p className="mt-3 text-sm text-white/70">{msg}</p>}
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
