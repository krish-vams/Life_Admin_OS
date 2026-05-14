import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const NOTIFICATION_STATUSES = new Set(["unread", "read", "dismissed"]);

function toDateString(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function toNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    sourceId: row.source_id,
    title: row.title,
    message: row.message,
    scheduledFor: toDateString(row.scheduled_for),
    dueOn: toDateString(row.due_on),
    status: row.status,
    isRead: row.is_read,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, user_id, type, source_id, title, message, scheduled_for, due_on, status, is_read, created_at, updated_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY
         CASE status WHEN 'unread' THEN 0 WHEN 'read' THEN 1 ELSE 2 END,
         scheduled_for ASC,
         created_at DESC`,
      [req.user.sub]
    );

    return res.json({ notifications: result.rows.map(toNotification) });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id/status", async (req, res, next) => {
  try {
    const status = String(req.body.status || "").trim().toLowerCase();

    if (!NOTIFICATION_STATUSES.has(status)) {
      return res.status(400).json({ message: "Status must be unread, read, or dismissed." });
    }

    const result = await query(
      `UPDATE notifications
       SET status = $1, is_read = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id, type, source_id, title, message, scheduled_for, due_on, status, is_read, created_at, updated_at`,
      [status, status !== "unread", req.params.id, req.user.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notification was not found." });
    }

    return res.json({ notification: toNotification(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

export default router;
