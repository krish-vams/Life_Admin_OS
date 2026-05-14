import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { enqueueEmailScan, enqueueReminderCheck } from "../queues/jobQueue.js";

const router = express.Router();

router.use(requireAuth);

router.post("/check-upcoming-reminders", async (_req, res, next) => {
  try {
    const job = await enqueueReminderCheck();
    return res.status(202).json({ job: { id: job.id, name: job.name } });
  } catch (error) {
    return next(error);
  }
});

router.post("/scan-user-email", async (req, res, next) => {
  try {
    const job = await enqueueEmailScan(req.user.sub);
    return res.status(202).json({ job: { id: job.id, name: job.name } });
  } catch (error) {
    return next(error);
  }
});

export default router;

