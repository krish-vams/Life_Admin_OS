import { google } from "googleapis";
import { query } from "../config/db.js";
import { getOAuthClient } from "./googleAuth.js";

const EMAIL_QUERY = [
  "newer_than:90d",
  "(invoice OR receipt OR charged OR renewal OR subscription OR \"your bill is due\" OR payment)"
].join(" ");

function toDateString(value) {
  return new Date(Number(value || Date.now())).toISOString().slice(0, 10);
}

export function parseAmount(text) {
  const match = text.match(/\$\s?(\d{1,6}(?:,\d{3})*(?:\.\d{2})?)/);
  return match ? Number(match[1].replaceAll(",", "")) : null;
}

export function inferType(text) {
  const normalized = text.toLowerCase();

  if (/(subscription|renewal|renews|membership|premium)/.test(normalized)) {
    return "subscription";
  }

  return "bill";
}

export function inferName(message) {
  const fromHeader = message.payload?.headers?.find((header) => header.name.toLowerCase() === "from")?.value;
  const fromName = fromHeader?.split("<")[0]?.replaceAll("\"", "").trim();

  if (fromName) {
    return fromName.slice(0, 160);
  }

  return "Detected item";
}

export function confidenceFor(text, amount) {
  const normalized = text.toLowerCase();
  let score = 0.45;

  if (amount !== null) {
    score += 0.2;
  }

  if (/(invoice|receipt|charged|bill|subscription|renewal|payment)/.test(normalized)) {
    score += 0.25;
  }

  return Math.min(score, 0.95);
}

export async function scanUserEmail(userId) {
  const connectionResult = await query("SELECT * FROM gmail_connections WHERE user_id = $1", [userId]);
  const connection = connectionResult.rows[0];

  if (!connection?.refresh_token) {
    throw new Error("Gmail is not connected for this user.");
  }

  const oauthClient = getOAuthClient();
  oauthClient.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expiry_date: connection.token_expiry ? new Date(connection.token_expiry).getTime() : undefined
  });

  const gmail = google.gmail({ version: "v1", auth: oauthClient });
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: EMAIL_QUERY,
    maxResults: 20
  });

  const messages = listResponse.data.messages || [];
  let detectedCount = 0;

  for (const messageRef of messages) {
    const messageResponse = await gmail.users.messages.get({
      userId: "me",
      id: messageRef.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"]
    });

    const message = messageResponse.data;
    const snippet = message.snippet || "";
    const amount = parseAmount(snippet);
    const type = inferType(snippet);
    const name = inferName(message);
    const detectedDate = toDateString(message.internalDate);
    const confidence = confidenceFor(snippet, amount);

    const result = await query(
      `INSERT INTO detected_items (
         user_id, source, source_email_id, type, name, amount, detected_date,
         suggested_due_date, billing_cycle, confidence_score, raw_snippet
       )
       VALUES ($1, 'gmail', $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id, source, source_email_id, type) DO NOTHING`,
      [
        userId,
        message.id,
        type,
        name,
        amount,
        detectedDate,
        detectedDate,
        type === "subscription" ? "monthly" : null,
        confidence,
        snippet
      ]
    );

    detectedCount += result.rowCount;
  }

  const newTokens = oauthClient.credentials;

  if (newTokens.access_token) {
    await query(
      `UPDATE gmail_connections
       SET access_token = $1, token_expiry = $2
       WHERE user_id = $3`,
      [
        newTokens.access_token,
        newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : connection.token_expiry,
        userId
      ]
    );
  }

  return detectedCount;
}
