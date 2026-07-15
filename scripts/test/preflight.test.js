import assert from "node:assert/strict";
import test from "node:test";

import { requiredEnvironment, validateEnvironment } from "../lib/preflight.js";

test("requires only public TestArc connection inputs for API verification", () => {
  assert.deepEqual(requiredEnvironment("api"), [
    "TESTARC_API_URL",
    "TESTARC_API_KEY",
    "TESTARC_PROJECT_ID",
    "TESTARC_COMMIT_SHA",
    "TESTARC_RUN_STARTED_AT",
  ]);
});

test("adds the dedicated user credentials for UI verification", () => {
  assert.deepEqual(requiredEnvironment("ui"), [
    "TESTARC_WEB_URL",
    "TESTARC_E2E_EMAIL",
    "TESTARC_E2E_PASSWORD",
    "TESTARC_COMMIT_SHA",
  ]);
});

test("reports every missing variable without printing secret values", () => {
  assert.throws(
    () =>
      validateEnvironment("ui", { TESTARC_WEB_URL: "https://testarc.example" }),
    /TESTARC_E2E_EMAIL, TESTARC_E2E_PASSWORD, TESTARC_COMMIT_SHA/,
  );
});
