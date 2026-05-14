import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { validateUuidParam } from "../middleware/validateRequest.js";
import {
  isValidDate,
  toLimitedString,
  toNonNegativeAmount
} from "../utils/validation.js";

const router = express.Router();
const BILLING_CYCLES = new Set(["weekly", "monthly", "quarterly", "yearly"]);
router.param("id", validateUuidParam("Detected item id"));

function toDateString(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function toDetectedItem(row) {
  return {
    id: row.id,
    source: row.source,
    sourceEmailId: row.source_email_id,
    type: row.type,
    name: row.name,
    amount: row.amount === null ? "" : Number(row.amount),
    detectedDate: toDateString(row.detected_date),
    suggestedDueDate: toDateString(row.suggested_due_date),
    billingCycle: row.billing_cycle || "",
    confidenceScore: Number(row.confidence_score),
    status: row.status,
    rawSnippet: row.raw_snippet || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT *
       FROM detected_items
       WHERE user_id = $1
       ORDER BY
         CASE status WHEN 'pending' THEN 0 WHEN 'confirmed' THEN 1 ELSE 2 END,
         created_at DESC`,
      [req.user.sub]
    );

    return res.json({ detectedItems: result.rows.map(toDetectedItem) });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/confirm", async (req, res, next) => {
  try {
    const itemResult = await query("SELECT * FROM detected_items WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user.sub
    ]);
    const item = itemResult.rows[0];

    if (!item) {
      return res.status(404).json({ message: "Detected item was not found." });
    }

    if (item.status !== "pending") {
      return res.status(400).json({ message: "Only pending detected items can be confirmed." });
    }

    const name = toLimitedString(req.body.name || item.name, 160);
    const amount = toNonNegativeAmount(req.body.amount ?? item.amount ?? 0);
    const date = String(req.body.suggestedDueDate || toDateString(item.suggested_due_date) || toDateString(item.detected_date));
    const category = toLimitedString(req.body.category || "Imported", 80);
    const billingCycle = String(req.body.billingCycle || item.billing_cycle || "monthly").trim().toLowerCase();

    if (name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    }

    if (amount === null) {
      return res.status(400).json({ message: "Amount must be a valid positive number." });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({ message: "Suggested due date must be a valid YYYY-MM-DD date." });
    }

    if (category.length < 2) {
      return res.status(400).json({ message: "Category must be at least 2 characters." });
    }

    if (item.type === "subscription") {
      if (!BILLING_CYCLES.has(billingCycle)) {
        return res.status(400).json({ message: "Billing cycle must be weekly, monthly, quarterly, or yearly." });
      }

      await query(
        `INSERT INTO subscriptions (
           user_id, name, amount, billing_cycle, next_renewal_date, reminder_days_before, category, status, notes
         )
         VALUES ($1, $2, $3, $4, $5, 3, $6, 'active', $7)`,
        [req.user.sub, name, amount, billingCycle, date, category, item.raw_snippet]
      );
    } else {
      await query(
        `INSERT INTO bills (user_id, name, amount, due_date, reminder_days_before, category, status, notes)
         VALUES ($1, $2, $3, $4, 3, $5, 'upcoming', $6)`,
        [req.user.sub, name, amount, date, category, item.raw_snippet]
      );
    }

    const updateResult = await query(
      `UPDATE detected_items
       SET status = 'confirmed'
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.sub]
    );

    return res.json({ detectedItem: toDetectedItem(updateResult.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/ignore", async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE detected_items
       SET status = 'ignored'
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Detected item was not found." });
    }

    return res.json({ detectedItem: toDetectedItem(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

export default router;
