import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const BILLING_CYCLES = new Set(["weekly", "monthly", "quarterly", "yearly"]);
const SUBSCRIPTION_STATUSES = new Set(["active", "paused", "cancelled"]);

function toDateString(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function toSubscription(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    amount: Number(row.amount),
    billingCycle: row.billing_cycle,
    nextRenewalDate: toDateString(row.next_renewal_date),
    reminderDaysBefore: Number(row.reminder_days_before),
    category: row.category,
    status: row.status,
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function validateSubscription(input) {
  const errors = {};
  const name = String(input.name || "").trim();
  const amount = Number(input.amount);
  const billingCycle = String(input.billingCycle || input.billing_cycle || "monthly").trim().toLowerCase();
  const nextRenewalDate = String(input.nextRenewalDate || input.next_renewal_date || "").trim();
  const reminderDaysBefore = Number(input.reminderDaysBefore ?? input.reminder_days_before ?? 3);
  const category = String(input.category || "").trim();
  const status = String(input.status || "active").trim().toLowerCase();
  const notes = String(input.notes || "").trim();

  if (name.length < 2) {
    errors.name = "Subscription name must be at least 2 characters.";
  }

  if (!Number.isFinite(amount) || amount < 0) {
    errors.amount = "Amount must be a valid positive number.";
  }

  if (!BILLING_CYCLES.has(billingCycle)) {
    errors.billingCycle = "Billing cycle must be weekly, monthly, quarterly, or yearly.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(nextRenewalDate)) {
    errors.nextRenewalDate = "Renewal date must use YYYY-MM-DD.";
  }

  if (!Number.isInteger(reminderDaysBefore) || reminderDaysBefore < 0) {
    errors.reminderDaysBefore = "Reminder preference must be zero or more days.";
  }

  if (category.length < 2) {
    errors.category = "Category must be at least 2 characters.";
  }

  if (!SUBSCRIPTION_STATUSES.has(status)) {
    errors.status = "Status must be active, paused, or cancelled.";
  }

  return {
    values: {
      name,
      amount,
      billingCycle,
      nextRenewalDate,
      reminderDaysBefore,
      category,
      status,
      notes
    },
    errors
  };
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, user_id, name, amount, billing_cycle, next_renewal_date, reminder_days_before, category, status, notes, created_at, updated_at
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY next_renewal_date ASC, created_at DESC`,
      [req.user.sub]
    );

    return res.json({ subscriptions: result.rows.map(toSubscription) });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, user_id, name, amount, billing_cycle, next_renewal_date, reminder_days_before, category, status, notes, created_at, updated_at
       FROM subscriptions
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Subscription was not found." });
    }

    return res.json({ subscription: toSubscription(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { values, errors } = validateSubscription(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Subscription details are invalid.", errors });
    }

    const result = await query(
      `INSERT INTO subscriptions (user_id, name, amount, billing_cycle, next_renewal_date, reminder_days_before, category, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id, name, amount, billing_cycle, next_renewal_date, reminder_days_before, category, status, notes, created_at, updated_at`,
      [
        req.user.sub,
        values.name,
        values.amount,
        values.billingCycle,
        values.nextRenewalDate,
        values.reminderDaysBefore,
        values.category,
        values.status,
        values.notes
      ]
    );

    return res.status(201).json({ subscription: toSubscription(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { values, errors } = validateSubscription(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Subscription details are invalid.", errors });
    }

    const result = await query(
      `UPDATE subscriptions
       SET name = $1, amount = $2, billing_cycle = $3, next_renewal_date = $4, reminder_days_before = $5, category = $6, status = $7, notes = $8
       WHERE id = $9 AND user_id = $10
       RETURNING id, user_id, name, amount, billing_cycle, next_renewal_date, reminder_days_before, category, status, notes, created_at, updated_at`,
      [
        values.name,
        values.amount,
        values.billingCycle,
        values.nextRenewalDate,
        values.reminderDaysBefore,
        values.category,
        values.status,
        values.notes,
        req.params.id,
        req.user.sub
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Subscription was not found." });
    }

    return res.json({ subscription: toSubscription(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM subscriptions WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user.sub
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Subscription was not found." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
