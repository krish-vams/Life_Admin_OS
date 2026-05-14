import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { resetQueryImplementation, setQueryImplementation } from "../src/config/db.js";
import { generateNotifications } from "../src/services/reminders.js";
import { testUserId } from "./helpers/auth.js";

afterEach(() => {
  resetQueryImplementation();
});

test("reminder generation creates bill, subscription, and document notification queries for one user", async () => {
  const calls = [];

  setQueryImplementation(async (sql, params) => {
    calls.push({ sql, params });
    return { rowCount: 1, rows: [] };
  });

  await generateNotifications(testUserId);

  assert.equal(calls.length, 3);
  assert.equal(calls.every((call) => call.params[0] === testUserId), true);
  assert.match(calls[0].sql, /FROM bills/);
  assert.match(calls[1].sql, /FROM subscriptions/);
  assert.match(calls[2].sql, /FROM documents/);
  assert.equal(calls.every((call) => call.sql.includes("ON CONFLICT")), true);
});
