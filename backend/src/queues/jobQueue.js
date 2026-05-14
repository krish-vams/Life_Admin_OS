import { Queue } from "bullmq";
import IORedis from "ioredis";
import "../config/env.js";

export const JOB_QUEUE_NAME = "life-admin-os-jobs";
export const JOB_NAMES = {
  CHECK_UPCOMING_REMINDERS: "check-upcoming-reminders",
  SCAN_USER_EMAIL: "scan-user-email",
  SEND_NOTIFICATION: "send-notification"
};

export const redisConnection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

export const jobQueue = new Queue(JOB_QUEUE_NAME, {
  connection: redisConnection
});

export async function enqueueReminderCheck() {
  return jobQueue.add(
    JOB_NAMES.CHECK_UPCOMING_REMINDERS,
    {},
    {
      jobId: `manual-${Date.now()}`,
      removeOnComplete: 100,
      removeOnFail: 100
    }
  );
}

export async function enqueueEmailScan(userId) {
  return jobQueue.add(
    JOB_NAMES.SCAN_USER_EMAIL,
    { userId },
    {
      jobId: `scan-user-email-${userId}-${Date.now()}`,
      removeOnComplete: 100,
      removeOnFail: 100
    }
  );
}

export async function enqueueNotificationSend(notificationId) {
  return jobQueue.add(
    JOB_NAMES.SEND_NOTIFICATION,
    { notificationId },
    {
      jobId: `send-notification-${notificationId}`,
      removeOnComplete: 100,
      removeOnFail: 100
    }
  );
}

export async function scheduleDailyReminderCheck() {
  return jobQueue.add(
    JOB_NAMES.CHECK_UPCOMING_REMINDERS,
    {},
    {
      jobId: "daily-check-upcoming-reminders",
      repeat: { pattern: "0 8 * * *" },
      removeOnComplete: 100,
      removeOnFail: 100
    }
  );
}

