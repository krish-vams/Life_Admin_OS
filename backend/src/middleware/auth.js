import jwt from "jsonwebtoken";
import { logWarn } from "../utils/logger.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    logWarn("Blocked unauthenticated API request", {
      method: req.method,
      path: req.originalUrl
    });
    return res.status(401).json({ message: "Authentication token is required." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    logWarn("Blocked request with invalid auth token", {
      method: req.method,
      path: req.originalUrl,
      reason: error.name
    });
    return res.status(401).json({ message: "Authentication token is invalid or expired." });
  }
}
