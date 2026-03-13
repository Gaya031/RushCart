import { Router } from "express";

import { fetchRoute, parseRouteCoordinates } from "../services/routingService.js";
import { emitTrackingUpdate } from "../services/trackingService.js";

export const buildDeliveryRouter = ({ io, trackingStore }) => {
  const router = Router();

  router.get("/health", (_, res) => {
    res.json({ ok: true, service: "delivery-service", socketio: true });
  });

  router.get("/map/route", async (req, res) => {
    const coordinates = parseRouteCoordinates(req.query);
    if (!coordinates) {
      res.status(400).json({ message: "from_lat, from_lng, to_lat, to_lng are required numbers" });
      return;
    }

    try {
      const route = await fetchRoute(coordinates);
      res.json(route);
    } catch (err) {
      res.status(502).json({ message: err.message || "Failed to generate route" });
    }
  });

  router.post("/tracking/location", (req, res) => {
    const tracking = trackingStore.upsertTracking(req.body || {});
    if (!tracking) {
      res.status(400).json({ message: "delivery_id, lat and lng are required" });
      return;
    }
    emitTrackingUpdate(io, tracking);
    res.json({ ok: true, tracking });
  });

  router.get("/tracking/delivery/:deliveryId", (req, res) => {
    const deliveryId = String(req.params.deliveryId);
    const tracking = trackingStore.getTrackingByDelivery(deliveryId);
    if (!tracking) {
      res.status(404).json({ message: "Tracking not found" });
      return;
    }
    res.json({
      tracking,
      history: trackingStore.getHistoryByDelivery(deliveryId),
    });
  });

  router.get("/tracking/order/:orderId", (req, res) => {
    const tracking = trackingStore.getTrackingByOrder(req.params.orderId);
    if (!tracking) {
      res.status(404).json({ message: "Tracking not found" });
      return;
    }
    res.json({ tracking });
  });

  return router;
};

