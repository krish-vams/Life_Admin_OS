import cors from "cors";
import express from "express";
import "./config/env.js";
import { rateLimit } from "./middleware/rateLimiter.js";
import analyticsRoutes from "./routes/analytics.js";
import authRoutes from "./routes/auth.js";
import billRoutes from "./routes/bills.js";
import detectedItemRoutes from "./routes/detectedItems.js";
import documentRoutes from "./routes/documents.js";
import gmailRoutes from "./routes/gmail.js";
import jobRoutes from "./routes/jobs.js";
import notificationRoutes from "./routes/notifications.js";
import notificationPreferenceRoutes from "./routes/notificationPreferences.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import userRoutes from "./routes/user.js";
import { logError, logInfo, logWarn } from "./utils/logger.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173"
  })
);
app.use(rateLimit());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "life-admin-os-api" });
});

app.use("/api/analytics", analyticsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/detected-items", detectedItemRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/gmail", gmailRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notification-preferences", notificationPreferenceRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/user", userRoutes);

app.use((req, res) => {
  logWarn("Route not found", {
    method: req.method,
    path: req.originalUrl
  });
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, _next) => {
  logError("API error", error, {
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.sub
  });

  const statusCode = error.statusCode || error.status || 500;
  const message =
    error.publicMessage ||
    (error.type === "entity.parse.failed" ? "Request body is invalid JSON." : null) ||
    (statusCode === 413 ? "Request body is too large." : "Unexpected server error.");

  res.status(statusCode).json({ message });
});

app.listen(port, () => {
  logInfo("Life Admin OS API listening", { port });
});
