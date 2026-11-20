import assert from "node:assert/strict";
import { test } from "node:test";
import { extraDamageTaken, signedPercent } from "../src/analysis/numbers.ts";

test("percentages carry one sign, a real minus for losses", () => {
  assert.equal(signedPercent(-8), "−8%");
  assert.equal(signedPercent(12.4), "+12%");
  assert.equal(signedPercent(0), "+0%");
});

test("missing resistance is measured as extra damage taken, against the character's own maximum", () => {
  assert.equal(extraDamageTaken(70, 76), 25); // 30% of each hit instead of 24%
  assert.equal(extraDamageTaken(70, 75), 20);
  assert.equal(extraDamageTaken(75, 75), 0);
});
