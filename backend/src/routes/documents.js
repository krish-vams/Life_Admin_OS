import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function toDateString(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function daysUntil(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((target - today) / 86400000);
}

function getDocumentStatus(expiryDate) {
  const days = daysUntil(expiryDate);

  if (days < 0) {
    return "expired";
  }

  if (days <= 30) {
    return "expiring_soon";
  }

  return "valid";
}

function toDocument(row) {
  const expiryDate = toDateString(row.expiry_date);

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    documentType: row.document_type,
    expiryDate,
    reminderDaysBefore: Number(row.reminder_days_before),
    status: getDocumentStatus(expiryDate),
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function validateDocument(input) {
  const errors = {};
  const name = String(input.name || "").trim();
  const documentType = String(input.documentType || input.document_type || "").trim();
  const expiryDate = String(input.expiryDate || input.expiry_date || "").trim();
  const reminderDaysBefore = Number(input.reminderDaysBefore ?? input.reminder_days_before ?? 30);
  const notes = String(input.notes || "").trim();

  if (name.length < 2) {
    errors.name = "Document name must be at least 2 characters.";
  }

  if (documentType.length < 2) {
    errors.documentType = "Document type must be at least 2 characters.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
    errors.expiryDate = "Expiry date must use YYYY-MM-DD.";
  }

  if (!Number.isInteger(reminderDaysBefore) || reminderDaysBefore < 0) {
    errors.reminderDaysBefore = "Reminder preference must be zero or more days.";
  }

  return {
    values: {
      name,
      documentType,
      expiryDate,
      reminderDaysBefore,
      status: getDocumentStatus(expiryDate),
      notes
    },
    errors
  };
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, user_id, name, document_type, expiry_date, reminder_days_before, status, notes, created_at, updated_at
       FROM documents
       WHERE user_id = $1
       ORDER BY expiry_date ASC, created_at DESC`,
      [req.user.sub]
    );

    return res.json({ documents: result.rows.map(toDocument) });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, user_id, name, document_type, expiry_date, reminder_days_before, status, notes, created_at, updated_at
       FROM documents
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Document was not found." });
    }

    return res.json({ document: toDocument(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { values, errors } = validateDocument(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Document details are invalid.", errors });
    }

    const result = await query(
      `INSERT INTO documents (user_id, name, document_type, expiry_date, reminder_days_before, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, name, document_type, expiry_date, reminder_days_before, status, notes, created_at, updated_at`,
      [
        req.user.sub,
        values.name,
        values.documentType,
        values.expiryDate,
        values.reminderDaysBefore,
        values.status,
        values.notes
      ]
    );

    return res.status(201).json({ document: toDocument(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { values, errors } = validateDocument(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Document details are invalid.", errors });
    }

    const result = await query(
      `UPDATE documents
       SET name = $1, document_type = $2, expiry_date = $3, reminder_days_before = $4, status = $5, notes = $6
       WHERE id = $7 AND user_id = $8
       RETURNING id, user_id, name, document_type, expiry_date, reminder_days_before, status, notes, created_at, updated_at`,
      [
        values.name,
        values.documentType,
        values.expiryDate,
        values.reminderDaysBefore,
        values.status,
        values.notes,
        req.params.id,
        req.user.sub
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Document was not found." });
    }

    return res.json({ document: toDocument(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM documents WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user.sub
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Document was not found." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
