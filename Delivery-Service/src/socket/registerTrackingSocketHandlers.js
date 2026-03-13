import { emitTrackingUpdate } from "../services/trackingService.js";

export const registerTrackingSocketHandlers = ({ io, trackingStore }) => {
  io.on("connection", (socket) => {
    socket.on("join_delivery", ({ delivery_id }) => {
      if (delivery_id) socket.join(`delivery:${delivery_id}`);
    });

    socket.on("join_order", ({ order_id }) => {
      if (order_id) socket.join(`order:${order_id}`);
    });

    socket.on("leave_delivery", ({ delivery_id }) => {
      if (delivery_id) socket.leave(`delivery:${delivery_id}`);
    });

    socket.on("leave_order", ({ order_id }) => {
      if (order_id) socket.leave(`order:${order_id}`);
    });

    socket.on("driver_location", (payload = {}) => {
      const tracking = trackingStore.upsertTracking(payload);
      if (tracking) emitTrackingUpdate(io, tracking);
    });
  });
};

