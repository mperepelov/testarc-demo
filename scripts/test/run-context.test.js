import assert from "node:assert/strict";
import test from "node:test";

import { resolveRunStartedAt } from "../lib/run-context.js";

test("keeps an explicitly supplied run timestamp", () => {
  assert.equal(
    resolveRunStartedAt(
      { TESTARC_RUN_STARTED_AT: "2026-07-15T06:00:00.000Z" },
      () => new Date("2026-07-15T07:00:00.000Z"),
    ),
    "2026-07-15T06:00:00.000Z",
  );
});

test("captures a timestamp before local orchestration when none was supplied", () => {
  assert.equal(
    resolveRunStartedAt({}, () => new Date("2026-07-15T07:00:00.000Z")),
    "2026-07-15T07:00:00.000Z",
  );
});
