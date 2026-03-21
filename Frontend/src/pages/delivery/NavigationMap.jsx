import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";
import {
  getAssignedDeliveries,
  getDeliveryMapRoute,
  getDeliveryRouteContext,
  getDeliveryServiceBase,
  isDeliveryRealtimeAvailable,
  postDeliveryLocation,
} from "../../api/delivery.api";

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const deliveryServiceBase = getDeliveryServiceBase();
const SOCKET_IO_JS = deliveryServiceBase ? `${deliveryServiceBase}/socket.io/socket.io.js` : "";

const loadLeaflet = async () => {
  if (window.L) return window.L;

  const existingCss = document.querySelector(`link[href='${LEAFLET_CSS}']`);
  if (!existingCss) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }

  await new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src='${LEAFLET_JS}']`);
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return window.L;
};

const loadSocketIo = async () => {
  if (!SOCKET_IO_JS) return null;
  if (window.io) return window.io;

  await new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src='${SOCKET_IO_JS}']`);
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
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

export default function NavigationMap() {
  const [searchParams] = useSearchParams();
  const initialDeliveryId = searchParams.get("deliveryId");

  const [deliveryId, setDeliveryId] = useState(initialDeliveryId || "");
  const [assignedRows, setAssignedRows] = useState([]);
  const [routeContext, setRouteContext] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [driverTracking, setDriverTracking] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    getAssignedDeliveries()
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setAssignedRows(rows);

        if (!deliveryId && rows.length > 0) {
          setDeliveryId(String(rows[0].id));
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || "Failed to load assigned deliveries.");
      });
  }, [deliveryId]);

  useEffect(() => {
    if (!deliveryId) return;

    let mounted = true;
    setLoading(true);
    setError("");

    const load = async () => {
      try {
        const contextRes = await getDeliveryRouteContext(deliveryId);
        if (!mounted) return;

        const context = contextRes.data;
        setRouteContext(context);

        const fromLat = context?.pickup?.lat;
        const fromLng = context?.pickup?.lng;
        const toLat = context?.drop?.lat;
        const toLng = context?.drop?.lng;

        if ([fromLat, fromLng, toLat, toLng].some((v) => typeof v !== "number" || Number.isNaN(v))) {
          throw new Error("Pickup/drop coordinates are missing for this delivery.");
        }

        const route = await getDeliveryMapRoute({ fromLat, fromLng, toLat, toLng });
        if (!mounted) return;
        setRouteData(route);
      } catch (err) {
        if (!mounted) return;
        setRouteData(null);
        setError(err?.response?.data?.detail || err?.message || "Failed to load map route.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [deliveryId]);

  const mapPoints = useMemo(() => {
    if (!routeContext) return null;
    return {
      pickup: routeContext.pickup,
      drop: routeContext.drop,
      polyline: Array.isArray(routeData?.polyline) ? routeData.polyline : [],
      etaMinutes: routeData?.eta_minutes,
      distanceKm: routeData?.distance_km,
      driver: driverTracking,
    };
  }, [routeContext, routeData, driverTracking]);

  useEffect(() => {
    let active = true;
    if (!deliveryId || !routeContext?.order_id) return;

    const initSocket = async () => {
      try {
        const realtimeAvailable = await isDeliveryRealtimeAvailable();
        if (!realtimeAvailable) return;
        const ioClient = await loadSocketIo();
        if (!active || !ioClient) return;
        const socket = ioClient(deliveryServiceBase, { transports: ["websocket", "polling"] });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join_delivery", { delivery_id: String(deliveryId) });
          socket.emit("join_order", { order_id: String(routeContext.order_id) });
        });
        socket.on("tracking:update", (payload) => {
          if (String(payload?.delivery_id) === String(deliveryId)) {
            setDriverTracking(payload);
          }
        });
      } catch {
        // keep route view working without socket
      }
    };

    initSocket();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [deliveryId, routeContext?.order_id]);

  useEffect(() => {
    if (!sharing || !deliveryId || !routeContext?.order_id) return;
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const payload = {
          delivery_id: String(deliveryId),
          order_id: String(routeContext.order_id),
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          heading: Number(position.coords.heading || 0),
          speed: Number(position.coords.speed || 0),
          status: "in_transit",
        };
        setDriverTracking(payload);
        try {
          await postDeliveryLocation(payload);
          if (socketRef.current) {
            socketRef.current.emit("driver_location", payload);
          }
        } catch {
          // non-blocking for UI
        }
      },
      () => setError("Unable to capture live location."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sharing, deliveryId, routeContext?.order_id]);

  useEffect(() => {
    let cancelled = false;

    const draw = async () => {
      if (!mapRef.current || !mapPoints?.pickup || !mapPoints?.drop) return;
      const L = await loadLeaflet();
      if (cancelled || !mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const pickupLatLng = [mapPoints.pickup.lat, mapPoints.pickup.lng];
      const dropLatLng = [mapPoints.drop.lat, mapPoints.drop.lng];

      L.marker(pickupLatLng).addTo(map).bindPopup(`Pickup: ${mapPoints.pickup.name || "Store"}`);
      L.marker(dropLatLng).addTo(map).bindPopup(`Drop: ${mapPoints.drop.name || "Customer"}`);

      if (mapPoints.polyline.length > 1) {
        const polyline = L.polyline(mapPoints.polyline, { color: "#38bdf8", weight: 5 }).addTo(map);
        map.fitBounds(polyline.getBounds(), { padding: [24, 24] });
      } else {
        map.fitBounds([pickupLatLng, dropLatLng], { padding: [24, 24] });
      }

      if (
        mapPoints.driver &&
        typeof mapPoints.driver.lat === "number" &&
        typeof mapPoints.driver.lng === "number"
      ) {
        L.circleMarker([mapPoints.driver.lat, mapPoints.driver.lng], {
          radius: 7,
          color: "#0284c7",
          fillColor: "#38bdf8",
          fillOpacity: 0.95,
          weight: 2,
        })
          .addTo(map)
          .bindPopup("Live Driver Location");
      }
    };

    draw();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapPoints]);

  return (
    <RoleDashboardLayout role="delivery" title="Navigation Map">
      <div className="max-w-5xl space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>
            <p className="font-medium text-white">Select Delivery</p>
            <p className="text-sm text-white/60">Route is generated from live pickup/drop coordinates.</p>
          </div>
          <select
            value={deliveryId}
            onChange={(e) => setDeliveryId(e.target.value)}
            className="border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
          >
            {!assignedRows.length && <option value="">No assigned deliveries</option>}
            {assignedRows.map((row) => (
              <option key={row.id} value={String(row.id)}>
                Delivery #{row.id} - Order #{row.order_id}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-sm text-white/60">Loading route...</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}

        {mapPoints && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="text-sm text-white/70 flex flex-wrap gap-4">
              <span><b className="text-white">Pickup:</b> {mapPoints.pickup.name}</span>
              <span><b className="text-white">Drop:</b> {mapPoints.drop.name || "Customer"}</span>
              {typeof mapPoints.distanceKm === "number" && <span><b className="text-white">Distance:</b> {mapPoints.distanceKm.toFixed(2)} km</span>}
              {typeof mapPoints.etaMinutes === "number" && <span><b className="text-white">ETA:</b> {mapPoints.etaMinutes} min</span>}
              {mapPoints.driver?.updated_at && (
                <span>
                  <b className="text-white">Driver Update:</b> {new Date(mapPoints.driver.updated_at).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`px-3 py-2 rounded text-sm ${
                  sharing ? "bg-red-500/20 text-red-200" : "bg-sky-300 text-black"
                }`}
                onClick={() => setSharing((s) => !s)}
              >
                {sharing ? "Stop Live Sharing" : "Start Live Sharing"}
              </button>
              <span className="text-xs text-white/50">Live location is broadcast via Socket.IO.</span>
            </div>
            <div ref={mapRef} className="h-[480px] rounded border border-white/10" />
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
}
