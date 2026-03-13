const toNum = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const upsertTrackingInStore = (payload, trackingByDelivery, historyByDelivery) => {
  const deliveryId = String(payload.delivery_id);
  const orderId = payload.order_id ? String(payload.order_id) : null;
  const lat = toNum(payload.lat);
  const lng = toNum(payload.lng);

  if (lat === null || lng === null || !deliveryId) {
    return null;
  }

  const tracking = {
    delivery_id: deliveryId,
    order_id: orderId,
    lat,
    lng,
    heading: toNum(payload.heading),
    speed: toNum(payload.speed),
    status: payload.status || null,
    updated_at: new Date().toISOString(),
  };

  trackingByDelivery.set(deliveryId, tracking);

  const history = historyByDelivery.get(deliveryId) || [];
  history.push({ lat: tracking.lat, lng: tracking.lng, updated_at: tracking.updated_at });
  if (history.length > 200) history.shift();
  historyByDelivery.set(deliveryId, history);

  return tracking;
};

export const createTrackingStore = () => {
  const trackingByDelivery = new Map();
  const historyByDelivery = new Map();

  return {
    upsertTracking(payload = {}) {
      return upsertTrackingInStore(payload, trackingByDelivery, historyByDelivery);
    },
    getTrackingByDelivery(deliveryId) {
      return trackingByDelivery.get(String(deliveryId)) || null;
    },
    getHistoryByDelivery(deliveryId) {
      return historyByDelivery.get(String(deliveryId)) || [];
    },
    getTrackingByOrder(orderId) {
      const target = String(orderId);
      for (const row of trackingByDelivery.values()) {
        if (row.order_id === target) {
          return row;
        }
      }
      return null;
    },
  };
};

export const emitTrackingUpdate = (io, tracking) => {
  io.to(`delivery:${tracking.delivery_id}`).emit("tracking:update", tracking);
  if (tracking.order_id) {
    io.to(`order:${tracking.order_id}`).emit("tracking:update", tracking);
  }
};

