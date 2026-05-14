import { query } from "../config/db.js";

function userFilter(userId, column = "user_id") {
  return userId ? `AND ${column} = $1` : "";
}

function params(userId) {
  return userId ? [userId] : [];
}

export async function generateNotifications(userId = null) {
  const userParams = params(userId);

  await query(
    `INSERT INTO notifications (user_id, type, source_id, title, message, scheduled_for, due_on)
     SELECT user_id,
            'bill',
            id,
            name || ' is due soon',
            name || ' is due on ' || TO_CHAR(due_date, 'Mon DD, YYYY') || '.',
            due_date - reminder_days_before,
            due_date
     FROM bills
     WHERE status <> 'paid'
       AND due_date >= CURRENT_DATE
       AND due_date - reminder_days_before <= CURRENT_DATE
       ${userFilter(userId)}
     ON CONFLICT (user_id, type, source_id, scheduled_for) DO NOTHING`,
    userParams
  );

  await query(
    `INSERT INTO notifications (user_id, type, source_id, title, message, scheduled_for, due_on)
     SELECT user_id,
            'subscription',
            id,
            name || ' renews soon',
            name || ' renews on ' || TO_CHAR(next_renewal_date, 'Mon DD, YYYY') || '.',
            next_renewal_date - reminder_days_before,
            next_renewal_date
     FROM subscriptions
     WHERE status = 'active'
       AND next_renewal_date >= CURRENT_DATE
       AND next_renewal_date - reminder_days_before <= CURRENT_DATE
       ${userFilter(userId)}
     ON CONFLICT (user_id, type, source_id, scheduled_for) DO NOTHING`,
    userParams
  );

  await query(
    `INSERT INTO notifications (user_id, type, source_id, title, message, scheduled_for, due_on)
     SELECT user_id,
            'document',
            id,
            name || ' expires soon',
            name || ' expires on ' || TO_CHAR(expiry_date, 'Mon DD, YYYY') || '.',
            expiry_date - reminder_days_before,
            expiry_date
     FROM documents
     WHERE expiry_date >= CURRENT_DATE
       AND expiry_date - reminder_days_before <= CURRENT_DATE
       ${userFilter(userId)}
     ON CONFLICT (user_id, type, source_id, scheduled_for) DO NOTHING`,
    userParams
  );
}

export function startDailyReminderJob() {
  const oneDayMs = 24 * 60 * 60 * 1000;

  async function run() {
    try {
      await generateNotifications();
    } catch (error) {
      console.error("Daily reminder check failed", error);
    }
  }

  run();
  return setInterval(run, oneDayMs);
}

