import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { logWarn } from "../utils/logger.js";
import { isValidEmail, normalizeEmail, toLimitedString } from "../utils/validation.js";

const router = express.Router();

function validateRegistration({ name, email, password }) {
  const errors = {};
  const normalizedEmail = normalizeEmail(email);

  const normalizedName = toLimitedString(name, 120);

  if (normalizedName.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!isValidEmail(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password || String(password).length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return { errors, normalizedEmail, normalizedName };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { errors, normalizedEmail, normalizedName } = validateRegistration({ name, email, password });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Registration details are invalid.", errors });
    }

    const existingUser = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);

    if (existingUser.rowCount > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at, updated_at`,
      [normalizedName, normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    return res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!isValidEmail(email) || !password) {
      logWarn("Failed login attempt", {
        email,
        reason: "invalid_input"
      });
      return res.status(400).json({ message: "Email and password are required." });
    }

    const result = await query(
      `SELECT id, name, email, password_hash, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      logWarn("Failed login attempt", {
        email,
        reason: "unknown_email"
      });
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      logWarn("Failed login attempt", {
        email,
        reason: "password_mismatch"
      });
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
