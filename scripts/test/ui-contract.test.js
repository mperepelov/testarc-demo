import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const config = readFileSync(
  new URL("../../verification/ui/playwright.config.js", import.meta.url),
  "utf8",
);
const smoke = readFileSync(
  new URL("../../verification/ui/tests/testarc-smoke.spec.js", import.meta.url),
  "utf8",
);

test("keeps the TestArc UI verifier separate from reporter ingestion", () => {
  assert.match(config, /reporter: \[\[["']line["']\]\]/);
  assert.doesNotMatch(config, /@testarc\/playwright-reporter/);
});

test("uses accessible login controls and verifies the correlated commit", () => {
  assert.match(smoke, /getByLabel\(["']Email["']\)/);
  assert.match(smoke, /getByLabel\(["']Password["']\)/);
  assert.match(smoke, /TESTARC_COMMIT_SHA\.slice\(0, 7\)/);
  assert.match(smoke, /toBeGreaterThanOrEqual\(3\)/);
});
