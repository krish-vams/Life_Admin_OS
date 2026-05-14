import { Worker } from "bullmq";
import "../config/env.js";
import { scanUserEmail } from "../services/emailScanner.js";
import { deliverDueNotifications, deliverNotification } from "../services/notificationDelivery.js";
import { generateNotifications } from "../services/reminders.js";
import { JOB_NAMES, JOB_QUEUE_NAME, redisConnection, scheduleDailyReminderCheck } from "../queues/jobQueue.js";

await scheduleDailyReminderCheck();

const worker = new Worker(
  JOB_QUEUE_NAME,
  async (job) => {
    if (job.name === JOB_NAMES.CHECK_UPCOMING_REMINDERS) {
      await generateNotifications();
      const deliveredCount = await deliverDueNotifications();
      return { deliveredCount };
    }

    if (job.name === JOB_NAMES.SCAN_USER_EMAIL) {
      const detectedCount = await scanUserEmail(job.data.userId);
      return { detectedCount };
    }

    if (job.name === JOB_NAMES.SEND_NOTIFICATION) {
      const result = await deliverNotification(job.data.notificationId);
      return result;
    }

    throw new Error(`Unsupported job: ${job.name}`);
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log(`Completed ${job.name} (${job.id})`);
});

worker.on("failed", (job, error) => {
  console.error(`Failed ${job?.name || "job"} (${job?.id || "unknown"})`, error);
});

console.log("Life Admin OS worker is running");
