import http from "http";

import cors from "cors";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import { buildDeliveryRouter } from "./routes/deliveryRoutes.js";
import { createTrackingStore } from "./services/trackingService.js";
import { registerTrackingSocketHandlers } from "./socket/registerTrackingSocketHandlers.js";

const app = express();
app.disable("x-powered-by");

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "100kb" }));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

const trackingStore = createTrackingStore();
registerTrackingSocketHandlers({ io, trackingStore });
app.use(buildDeliveryRouter({ io, trackingStore }));

const port = process.env.PORT || 4001;
server.listen(port, () => {
  console.log(`Delivery service running on port ${port}`);
});
