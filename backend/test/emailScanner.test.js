import assert from "node:assert/strict";
import test from "node:test";
import { confidenceFor, inferName, inferType, parseAmount } from "../src/services/emailScanner.js";

test("extracts dollar amounts from email snippets", () => {
  assert.equal(parseAmount("Your card was charged $15.99 today."), 15.99);
  assert.equal(parseAmount("Invoice total: $1,240.00"), 1240);
  assert.equal(parseAmount("No amount here"), null);
});

test("infers detected item type from keywords", () => {
  assert.equal(inferType("Your Spotify subscription renewed"), "subscription");
  assert.equal(inferType("Your electricity bill is due"), "bill");
});

test("infers sender name from Gmail metadata", () => {
  const message = {
    payload: {
      headers: [{ name: "From", value: "Netflix Billing <billing@example.com>" }]
    }
  };

  assert.equal(inferName(message), "Netflix Billing");
});

test("raises confidence when amount and payment keywords are present", () => {
  assert.equal(confidenceFor("Receipt for payment of $20.00", 20) > confidenceFor("Newsletter", null), true);
});
