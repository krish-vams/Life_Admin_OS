import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, email, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [req.user.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User profile was not found." });
    }

    const user = result.rows[0];

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

