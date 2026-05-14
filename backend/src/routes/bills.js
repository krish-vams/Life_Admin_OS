import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { validateUuidParam } from "../middleware/validateRequest.js";
import {
  isValidDate,
  toLimitedString,
  toNonNegativeAmount,
  toNonNegativeInteger
} from "../utils/validation.js";

const router = express.Router();
const BILL_STATUSES = new Set(["upcoming", "paid", "overdue"]);
router.param("id", validateUuidParam("Bill id"));

function toDateString(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function toBill(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    amount: Number(row.amount),
    dueDate: toDateString(row.due_date),
    reminderDaysBefore: Number(row.reminder_days_before),
    category: row.category,
    status: row.status,
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function validateBill(input) {
  const errors = {};
  const name = toLimitedString(input.name, 160);
  const amount = toNonNegativeAmount(input.amount);
  const dueDate = String(input.dueDate || input.due_date || "").trim();
  const reminderDaysBefore = toNonNegativeInteger(input.reminderDaysBefore ?? input.reminder_days_before, 3);
  const category = toLimitedString(input.category, 80);
  const status = String(input.status || "upcoming").trim().toLowerCase();
  const notes = toLimitedString(input.notes, 2000);

  if (name.length < 2) {
    errors.name = "Bill name must be at least 2 characters.";
  }

  if (amount === null) {
    errors.amount = "Amount must be a valid positive number.";
  }

  if (!isValidDate(dueDate)) {
    errors.dueDate = "Due date must be a valid YYYY-MM-DD date.";
  }

  if (reminderDaysBefore === null) {
    errors.reminderDaysBefore = "Reminder preference must be zero or more days.";
  }

  if (category.length < 2) {
    errors.category = "Category must be at least 2 characters.";
  }

  if (!BILL_STATUSES.has(status)) {
    errors.status = "Status must be upcoming, paid, or overdue.";
  }

  return {
    values: {
      name,
      amount,
      dueDate,
      reminderDaysBefore,
      category,
      status,
      notes
    },
    errors
  };
}

router.use(requireAuth);

export async function listBills(req, res, next) {
  try {
    const result = await query(
      `SELECT id, user_id, name, amount, due_date, reminder_days_before, category, status, notes, created_at, updated_at
       FROM bills
       WHERE user_id = $1
       ORDER BY due_date ASC, created_at DESC`,
      [req.user.sub]
    );

    return res.json({ bills: result.rows.map(toBill) });
  } catch (error) {
    return next(error);
  }
}

export async function getBill(req, res, next) {
  try {
    const result = await query(
      `SELECT id, user_id, name, amount, due_date, reminder_days_before, category, status, notes, created_at, updated_at
       FROM bills
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Bill was not found." });
    }

    return res.json({ bill: toBill(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
}

export async function createBill(req, res, next) {
  try {
    const { values, errors } = validateBill(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Bill details are invalid.", errors });
    }

    const result = await query(
      `INSERT INTO bills (user_id, name, amount, due_date, reminder_days_before, category, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, name, amount, due_date, reminder_days_before, category, status, notes, created_at, updated_at`,
      [
        req.user.sub,
        values.name,
        values.amount,
        values.dueDate,
        values.reminderDaysBefore,
        values.category,
        values.status,
        values.notes
      ]
    );

    return res.status(201).json({ bill: toBill(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
}

export async function updateBill(req, res, next) {
  try {
    const { values, errors } = validateBill(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Bill details are invalid.", errors });
    }

    const result = await query(
      `UPDATE bills
       SET name = $1, amount = $2, due_date = $3, reminder_days_before = $4, category = $5, status = $6, notes = $7
       WHERE id = $8 AND user_id = $9
       RETURNING id, user_id, name, amount, due_date, reminder_days_before, category, status, notes, created_at, updated_at`,
      [
        values.name,
        values.amount,
        values.dueDate,
        values.reminderDaysBefore,
        values.category,
        values.status,
        values.notes,
        req.params.id,
        req.user.sub
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Bill was not found." });
    }

    return res.json({ bill: toBill(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
}

export async function deleteBill(req, res, next) {
  try {
    const result = await query("DELETE FROM bills WHERE id = $1 AND user_id = $2", [req.params.id, req.user.sub]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Bill was not found." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

router.get("/", listBills);
router.get("/:id", getBill);
router.post("/", createBill);
router.put("/:id", updateBill);
router.delete("/:id", deleteBill);

export default router;
