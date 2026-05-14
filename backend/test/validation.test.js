import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidDate,
  isValidEmail,
  isValidUuid,
  toNonNegativeAmount,
  toNonNegativeInteger
} from "../src/utils/validation.js";

test("validates email addresses", () => {
  assert.equal(isValidEmail("USER@example.com"), true);
  assert.equal(isValidEmail("missing-at-sign"), false);
});

test("validates UUID identifiers", () => {
  assert.equal(isValidUuid("11111111-1111-4111-8111-111111111111"), true);
  assert.equal(isValidUuid("not-a-uuid"), false);
});

test("rejects impossible calendar dates", () => {
  assert.equal(isValidDate("2026-05-14"), true);
  assert.equal(isValidDate("2026-02-30"), false);
  assert.equal(isValidDate("05/14/2026"), false);
});

test("normalizes amounts and integer reminder values", () => {
  assert.equal(toNonNegativeAmount("15.999"), 16);
  assert.equal(toNonNegativeAmount("-1"), null);
  assert.equal(toNonNegativeInteger("7", 3), 7);
  assert.equal(toNonNegativeInteger("1.5", 3), null);
});
