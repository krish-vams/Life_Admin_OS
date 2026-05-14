import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function toDateString(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function monthlyAmount(amount, billingCycle) {
  const value = Number(amount || 0);

  switch (billingCycle) {
    case "weekly":
      return value * 4.33;
    case "quarterly":
      return value / 3;
    case "yearly":
      return value / 12;
    default:
      return value;
  }
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function nextRenewalPrediction(subscription) {
  const currentRenewal = toDateString(subscription.next_renewal_date);

  const cycleDays = {
    weekly: 7,
    monthly: 30,
    quarterly: 91,
    yearly: 365
  };

  return {
    subscriptionId: subscription.id,
    name: subscription.name,
    billingCycle: subscription.billing_cycle,
    currentRenewalDate: currentRenewal,
    predictedNextRenewalDate: addDays(currentRenewal, cycleDays[subscription.billing_cycle] || 30)
  };
}

router.use(requireAuth);

router.get("/summary", async (req, res, next) => {
  try {
    const [subscriptionsResult, billsResult] = await Promise.all([
      query(
        `SELECT id, name, amount, billing_cycle, next_renewal_date, category, status
         FROM subscriptions
         WHERE user_id = $1`,
        [req.user.sub]
      ),
      query(
        `SELECT id, name, amount, due_date, category, status
         FROM bills
         WHERE user_id = $1`,
        [req.user.sub]
      )
    ]);

    const activeSubscriptions = subscriptionsResult.rows.filter((subscription) => subscription.status === "active");
    const monthlySubscriptionTotal = activeSubscriptions.reduce(
      (total, subscription) => total + monthlyAmount(subscription.amount, subscription.billing_cycle),
      0
    );

    const categoryMap = new Map();

    for (const subscription of activeSubscriptions) {
      const category = subscription.category || "Uncategorized";
      categoryMap.set(category, (categoryMap.get(category) || 0) + monthlyAmount(subscription.amount, subscription.billing_cycle));
    }

    const categorySpending = [...categoryMap.entries()]
      .map(([category, monthlyTotal]) => ({ category, monthlyTotal }))
      .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

    function expectedPayments(days) {
      const billTotal = billsResult.rows
        .filter((bill) => bill.status !== "paid")
        .filter((bill) => {
          const date = toDateString(bill.due_date);
          return date <= addDays(new Date().toISOString().slice(0, 10), days) && date >= new Date().toISOString().slice(0, 10);
        })
        .reduce((total, bill) => total + Number(bill.amount || 0), 0);

      const renewalTotal = activeSubscriptions
        .filter((subscription) => {
          const date = toDateString(subscription.next_renewal_date);
          return date <= addDays(new Date().toISOString().slice(0, 10), days) && date >= new Date().toISOString().slice(0, 10);
        })
        .reduce((total, subscription) => total + Number(subscription.amount || 0), 0);

      return Number((billTotal + renewalTotal).toFixed(2));
    }

    const duplicateSubscriptionAlerts = [...categoryMap.entries()]
      .filter(([, monthlyTotal]) => monthlyTotal > 0)
      .map(([category]) => {
        const subscriptions = activeSubscriptions.filter((subscription) => subscription.category === category);

        if (subscriptions.length < 2) {
          return null;
        }

        return {
          category,
          count: subscriptions.length,
          names: subscriptions.map((subscription) => subscription.name),
          message: `You have multiple ${category.toLowerCase()} subscriptions: ${subscriptions
            .map((subscription) => subscription.name)
            .join(", ")}.`
        };
      })
      .filter(Boolean);

    return res.json({
      monthlySubscriptionTotal: Number(monthlySubscriptionTotal.toFixed(2)),
      categorySpending,
      upcomingExpenseSummary: {
        next7Days: expectedPayments(7),
        next15Days: expectedPayments(15),
        next30Days: expectedPayments(30)
      },
      duplicateSubscriptionAlerts,
      renewalPredictions: activeSubscriptions.map(nextRenewalPrediction)
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

