import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { requireAuth } from "../src/middleware/auth.js";
import { resetQueryImplementation, setQueryImplementation } from "../src/config/db.js";
import { createBill, deleteBill } from "../src/routes/bills.js";
import { testUserId } from "./helpers/auth.js";
import { callHandler, createMockResponse } from "./helpers/handlers.js";

afterEach(() => {
  resetQueryImplementation();
});

test("rejects bill creation without authentication", () => {
  const req = {
    headers: {},
    method: "POST",
    originalUrl: "/api/bills"
  };
  const res = createMockResponse();

  requireAuth(req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Authentication token is required.");
});

test("creates a bill with validated input", async () => {
  const insertedBill = {
    id: "22222222-2222-4222-8222-222222222222",
    user_id: testUserId,
    name: "Internet",
    amount: "60.00",
    due_date: "2026-06-01",
    reminder_days_before: 3,
    category: "Utilities",
    status: "upcoming",
    notes: "Autopay",
    created_at: "2026-05-14T00:00:00.000Z",
    updated_at: "2026-05-14T00:00:00.000Z"
  };

  setQueryImplementation(async (sql, params) => {
    assert.match(sql, /INSERT INTO bills/);
    assert.deepEqual(params.slice(0, 4), [testUserId, "Internet", 60, "2026-06-01"]);
    return { rowCount: 1, rows: [insertedBill] };
  });

  const res = await callHandler(createBill, {
    user: { sub: testUserId },
    body: {
      name: "Internet",
      amount: "60",
      dueDate: "2026-06-01",
      reminderDaysBefore: "3",
      category: "Utilities",
      status: "upcoming",
      notes: "Autopay"
    }
  });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.bill.name, "Internet");
  assert.equal(res.body.bill.amount, 60);
});

test("rejects invalid bill input before database access", async () => {
  let queryCount = 0;
  setQueryImplementation(async () => {
    queryCount += 1;
    return { rowCount: 0, rows: [] };
  });

  const res = await callHandler(createBill, {
    user: { sub: testUserId },
    body: {
      name: "X",
      amount: "-1",
      dueDate: "2026-02-30",
      category: "U"
    }
  });

  assert.equal(res.statusCode, 400);
  assert.equal(Boolean(res.body.errors.amount), true);
  assert.equal(Boolean(res.body.errors.dueDate), true);
  assert.equal(queryCount, 0);
});

test("scopes bill deletion to the authenticated user", async () => {
  setQueryImplementation(async (sql, params) => {
    assert.match(sql, /DELETE FROM bills/);
    assert.deepEqual(params, ["22222222-2222-4222-8222-222222222222", testUserId]);
    return { rowCount: 0, rows: [] };
  });

  const res = await callHandler(deleteBill, {
    params: { id: "22222222-2222-4222-8222-222222222222" },
    user: { sub: testUserId }
  });

  assert.equal(res.statusCode, 404);
});
