import cors from "cors";
import express from "express";
import "./config/env.js";
import authRoutes from "./routes/auth.js";
import billRoutes from "./routes/bills.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import userRoutes from "./routes/user.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "life-admin-os-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/user", userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Unexpected server error." });
});

app.listen(port, () => {
  console.log(`Life Admin OS API listening on port ${port}`);
});
