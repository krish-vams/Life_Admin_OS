import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const DELIVERY_METHODS = new Set(["in_app", "email", "calendar", "all"]);

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const result = await query("SELECT delivery_method FROM notification_preferences WHERE user_id = $1", [
      req.user.sub
    ]);

    return res.json({
      preferences: {
        deliveryMethod: result.rows[0]?.delivery_method || "in_app"
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const deliveryMethod = String(req.body.deliveryMethod || req.body.delivery_method || "").trim();

    if (!DELIVERY_METHODS.has(deliveryMethod)) {
      return res.status(400).json({ message: "Delivery method must be in_app, email, calendar, or all." });
    }

    const result = await query(
      `INSERT INTO notification_preferences (user_id, delivery_method)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET delivery_method = EXCLUDED.delivery_method
       RETURNING delivery_method`,
      [req.user.sub, deliveryMethod]
    );

    return res.json({
      preferences: {
        deliveryMethod: result.rows[0].delivery_method
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

