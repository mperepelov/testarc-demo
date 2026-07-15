import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../../.github/workflows/testarc-e2e.yml", import.meta.url),
  "utf8",
);

test("runs daily and manually while scheduled runs remain explicitly opt-in", () => {
  assert.match(workflow, /cron: ["']0 6 \* \* \*["']/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /vars\.TESTARC_E2E_ENABLED == 'true'/);
});

test("runs three framework workloads independently before one final verifier", () => {
  for (const job of ["playwright:", "jest:", "vitest:", "verify:"]) {
    assert.match(workflow, new RegExp(`^  ${job}`, "m"));
  }
  assert.match(workflow, /needs: \[context, playwright, jest, vitest\]/);
  assert.match(workflow, /environment: railway-e2e/);
});

test("pins Node and reporter versions and prevents overlapping scheduled evidence", () => {
  assert.match(workflow, /node-version: 24/);
  assert.match(workflow, /group: testarc-e2e/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.doesNotMatch(workflow, /@next/);
});
