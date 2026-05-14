import assert from "node:assert/strict";
import test from "node:test";
import { monthlySubscriptionAmount } from "../src/utils/finance.js";

test("calculates monthly subscription cost by billing cycle", () => {
  assert.equal(monthlySubscriptionAmount({ amount: 10, billingCycle: "monthly" }), 10);
  assert.equal(monthlySubscriptionAmount({ amount: 12, billingCycle: "weekly" }), 51.96);
  assert.equal(monthlySubscriptionAmount({ amount: 90, billingCycle: "quarterly" }), 30);
  assert.equal(monthlySubscriptionAmount({ amount: 120, billingCycle: "yearly" }), 10);
});
