import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { getOrderById } from "../../api/order.api";
import {
  getDeliveryServiceBase,
  getDeliveryTrackingByOrder,
  isDeliveryRealtimeAvailable,
} from "../../api/delivery.api";

const steps = ["placed", "packed", "shipped", "delivered"];
const deliveryServiceBase = getDeliveryServiceBase();
const SOCKET_IO_JS = deliveryServiceBase ? `${deliveryServiceBase}/socket.io/socket.io.js` : "";

const loadSocketIo = async () => {
  if (!SOCKET_IO_JS) return null;
  if (window.io) return window.io;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src='${SOCKET_IO_JS}']`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SOCKET_IO_JS;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
  return window.io;
};

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchOrder = () => {
      getOrderById(orderId)
        .then((res) => {
          if (mounted) setOrder(res.data);
        })
        .catch(() => {});
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000);
    getDeliveryTrackingByOrder(orderId).then((res) => setTracking(res?.tracking || null));
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  useEffect(() => {
    let active = true;
    let socket = null;

    const connect = async () => {
      try {
        const realtimeAvailable = await isDeliveryRealtimeAvailable();
        if (!realtimeAvailable) return;
        const ioClient = await loadSocketIo();
        if (!active || !ioClient) return;
        socket = ioClient(deliveryServiceBase, { transports: ["websocket", "polling"] });
        socket.on("connect", () => {
          socket.emit("join_order", { order_id: String(orderId) });
        });
        socket.on("tracking:update", (payload) => {
          if (String(payload?.order_id) === String(orderId)) {
            setTracking(payload);
          }
        });
      } catch {
        // tracking remains polling-based only
      }
    };

    connect();
    return () => {
      active = false;
      if (socket) socket.disconnect();
    };
  }, [orderId]);

  const currentIndex = steps.indexOf(order?.status || "placed");

  return (
    <div className="min-h-screen rc-shell">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-white mb-4">Order Tracking #{orderId}</h1>
        {!order ? (
          <p className="text-white/60">Loading tracking...</p>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="mb-6 text-white/70">
              Current status: <b className="text-white">{order.status}</b>
            </p>
            <div className="space-y-4">
              {steps.map((s, idx) => (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      idx <= currentIndex ? "bg-amber-300" : "bg-white/20"
                    }`}
                  />
                  <span className="capitalize text-white/70">{s}</span>
                </div>
              ))}
            </div>
            {tracking && (
              <div className="mt-6 border-t border-white/10 pt-4 text-sm text-white/70 space-y-1">
                <p className="text-white">Live Driver Location</p>
                <p>Latitude: {tracking.lat}</p>
                <p>Longitude: {tracking.lng}</p>
                {tracking.updated_at && <p>Updated: {new Date(tracking.updated_at).toLocaleTimeString()}</p>}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
