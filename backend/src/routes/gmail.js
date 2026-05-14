import express from "express";
import { google } from "googleapis";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { enqueueEmailScan } from "../queues/jobQueue.js";
import { createGmailAuthUrl, getOAuthClient, verifyGmailState } from "../services/googleAuth.js";
import { logError } from "../utils/logger.js";

const router = express.Router();

router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT google_email, connected_at, updated_at
       FROM gmail_connections
       WHERE user_id = $1`,
      [req.user.sub]
    );

    return res.json({
      connected: result.rowCount > 0,
      connection: result.rows[0] || null
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/auth-url", requireAuth, (req, res, next) => {
  try {
    return res.json({ url: createGmailAuthUrl(req.user.sub) });
  } catch (error) {
    return next(error);
  }
});

router.get("/callback", async (req, res, next) => {
  try {
    if (!req.query.code || !req.query.state) {
      return res.status(400).json({ message: "Google OAuth callback is missing required details." });
    }

    const userId = verifyGmailState(req.query.state);
    const oauthClient = getOAuthClient();
    const { tokens } = await oauthClient.getToken(req.query.code);

    oauthClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
    const profile = await oauth2.userinfo.get();

    await query(
      `INSERT INTO gmail_connections (
         user_id, google_email, access_token, refresh_token, scope, token_expiry, connected_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         google_email = EXCLUDED.google_email,
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, gmail_connections.refresh_token),
         scope = EXCLUDED.scope,
         token_expiry = EXCLUDED.token_expiry,
         connected_at = NOW()`,
      [
        userId,
        profile.data.email,
        tokens.access_token,
        tokens.refresh_token,
        tokens.scope,
        tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
      ]
    );

    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/settings?gmail=connected`);
  } catch (error) {
    logError("Gmail connection failed", error);
    return next(error);
  }
});

router.post("/scan", requireAuth, async (req, res, next) => {
  try {
    const job = await enqueueEmailScan(req.user.sub);
    return res.status(202).json({ job: { id: job.id, name: job.name } });
  } catch (error) {
    return next(error);
  }
});

export default router;
