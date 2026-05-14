import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { resetQueryImplementation, setQueryImplementation } from "../src/config/db.js";
import { getAnalyticsSummary } from "../src/routes/analytics.js";
import { testUserId } from "./helpers/auth.js";
import { callHandler } from "./helpers/handlers.js";

afterEach(() => {
  resetQueryImplementation();
});

function addDays(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

test("returns dashboard analytics summary for the authenticated user", async () => {
  const queries = [];

  setQueryImplementation(async (sql, params) => {
    queries.push({ sql, params });

    if (sql.includes("FROM subscriptions")) {
      return {
        rows: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Spotify",
            amount: "12.00",
            billing_cycle: "monthly",
            next_renewal_date: addDays(3),
            category: "Entertainment",
            status: "active"
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            name: "Video Plus",
            amount: "120.00",
            billing_cycle: "yearly",
            next_renewal_date: addDays(20),
            category: "Entertainment",
            status: "active"
          }
        ]
      };
    }

    return {
      rows: [
        {
          id: "55555555-5555-4555-8555-555555555555",
          name: "Electricity",
          amount: "40.00",
          due_date: addDays(5),
          category: "Utilities",
          status: "upcoming"
        }
      ]
    };
  });

  const res = await callHandler(getAnalyticsSummary, {
    user: { sub: testUserId }
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.monthlySubscriptionTotal, 22);
  assert.equal(res.body.upcomingExpenseSummary.next7Days, 52);
  assert.equal(res.body.duplicateSubscriptionAlerts[0].category, "Entertainment");
  assert.equal(queries.every((entry) => entry.params[0] === testUserId), true);
});
