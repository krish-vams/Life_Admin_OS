import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const requests = new Map();

function getRequestKey(req) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return `user:${payload.sub}`;
    } catch {
      return `token:${crypto.createHash("sha256").update(token).digest("hex")}`;
    }
  }

  return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
}

export function rateLimit({
  maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000)
} = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = getRequestKey(req);
    const current = requests.get(key);

    if (!current || current.resetAt <= now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        message: "Too many requests. Please wait before trying again."
      });
    }

    return next();
  };
}
