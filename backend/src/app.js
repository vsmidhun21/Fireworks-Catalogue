import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import publicRoutes from "./routes/public.routes.js";
import estimateRoutes from "./routes/estimate.routes.js";
import adminAuthRoutes from "./routes/admin.auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || "http://localhost:5173").split(","),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// app.use("/uploads", express.static(UPLOADS_DIR));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", generalLimiter);

app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, message: "Sri RR Crackers API is running", data: { time: new Date().toISOString() } });
});

app.use("/api/v1", publicRoutes);
app.use("/api/v1", estimateRoutes);
app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
