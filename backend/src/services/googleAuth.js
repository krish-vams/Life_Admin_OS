import { google } from "googleapis";
import jwt from "jsonwebtoken";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email"
];

export function getOAuthClient() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth environment variables are required.");
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function createGmailAuthUrl(userId) {
  const oauthClient = getOAuthClient();
  const state = jwt.sign({ sub: userId, purpose: "gmail-oauth" }, process.env.JWT_SECRET, {
    expiresIn: "15m"
  });

  return oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state
  });
}

export function verifyGmailState(state) {
  const payload = jwt.verify(state, process.env.JWT_SECRET);

  if (payload.purpose !== "gmail-oauth") {
    throw new Error("Invalid Gmail OAuth state.");
  }

  return payload.sub;
}

