import { google } from "googleapis";
import { query } from "../config/db.js";
import { getOAuthClient } from "./googleAuth.js";
import { sendSmtpMail } from "./smtpClient.js";

function shouldSendEmail(method) {
  return method === "email" || method === "all";
}

function shouldSyncCalendar(method) {
  return method === "calendar" || method === "all";
}

async function getPreference(userId) {
  const result = await query("SELECT delivery_method FROM notification_preferences WHERE user_id = $1", [userId]);
  return result.rows[0]?.delivery_method || "in_app";
}

async function sendEmail(notification) {
  const sent = await sendSmtpMail({
    to: notification.user_email,
    subject: `Reminder: ${notification.title}`,
    text: notification.message
  });

  if (!sent) {
    return false;
  }

  await query("UPDATE notifications SET email_sent_at = NOW() WHERE id = $1", [notification.id]);
  return true;
}

async function syncCalendarEvent(notification) {
  if (notification.calendar_event_id) {
    return false;
  }

  const connectionResult = await query("SELECT * FROM gmail_connections WHERE user_id = $1", [notification.user_id]);
  const connection = connectionResult.rows[0];

  if (!connection?.refresh_token) {
    return false;
  }

  const oauthClient = getOAuthClient();
  oauthClient.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expiry_date: connection.token_expiry ? new Date(connection.token_expiry).getTime() : undefined
  });

  const calendar = google.calendar({ version: "v3", auth: oauthClient });
  const dueDate = notification.due_on instanceof Date ? notification.due_on.toISOString().slice(0, 10) : notification.due_on;
  const endDate = new Date(`${dueDate}T00:00:00`);
  endDate.setDate(endDate.getDate() + 1);

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: notification.title,
      description: notification.message,
      start: { date: dueDate },
      end: { date: endDate.toISOString().slice(0, 10) }
    }
  });

  await query(
    "UPDATE notifications SET calendar_event_id = $1, calendar_synced_at = NOW() WHERE id = $2",
    [event.data.id, notification.id]
  );
  return true;
}

export async function deliverNotification(notificationId) {
  const result = await query(
    `SELECT notifications.*, users.email AS user_email
     FROM notifications
     JOIN users ON users.id = notifications.user_id
     WHERE notifications.id = $1`,
    [notificationId]
  );
  const notification = result.rows[0];

  if (!notification || notification.status === "dismissed") {
    return { delivered: false };
  }

  const deliveryMethod = await getPreference(notification.user_id);
  const delivered = {
    email: false,
    calendar: false
  };

  if (shouldSendEmail(deliveryMethod) && !notification.email_sent_at) {
    delivered.email = await sendEmail(notification);
  }

  if (shouldSyncCalendar(deliveryMethod)) {
    delivered.calendar = await syncCalendarEvent(notification);
  }

  return { delivered };
}

export async function deliverDueNotifications() {
  const result = await query(
    `SELECT notifications.id
     FROM notifications
     WHERE status <> 'dismissed'
       AND scheduled_for <= CURRENT_DATE
     ORDER BY scheduled_for ASC`
  );

  for (const row of result.rows) {
    await deliverNotification(row.id);
  }

  return result.rowCount;
}
