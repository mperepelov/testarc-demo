import assert from "node:assert/strict";
import test from "node:test";

import {
  FRAMEWORK_WORKLOADS,
  SCENARIO_WORKLOADS,
  outcomeForAttempt,
  scenarioFor,
  summarizeScenarios,
} from "../src/index.js";

test("defines exactly 100 tests across the three public reporters", () => {
  assert.deepEqual(FRAMEWORK_WORKLOADS, {
    playwright: 25,
    jest: 38,
    vitest: 37,
  });
  assert.equal(
    Object.values(FRAMEWORK_WORKLOADS).reduce((sum, count) => sum + count, 0),
    100,
  );
  assert.deepEqual(SCENARIO_WORKLOADS, {
    playwright: 22,
    jest: 38,
    vitest: 37,
  });
  assert.equal(
    FRAMEWORK_WORKLOADS.playwright - SCENARIO_WORKLOADS.playwright,
    3,
  );
});

test("keeps each seeded workload deterministic with a fixed scenario mix", () => {
  for (const [framework, count] of Object.entries(SCENARIO_WORKLOADS)) {
    const first = Array.from({ length: count }, (_, index) =>
      scenarioFor({ framework, index, seed: "daily-2026-07-15" }),
    );
    const second = Array.from({ length: count }, (_, index) =>
      scenarioFor({ framework, index, seed: "daily-2026-07-15" }),
    );

    assert.deepEqual(first, second);
    assert.deepEqual(summarizeScenarios(first), {
      passed: count - 4,
      flaky: 2,
      failed: 1,
      skipped: 1,
    });
  }
});

test("changes scenario identities when the seed changes without changing totals", () => {
  const first = Array.from({ length: SCENARIO_WORKLOADS.jest }, (_, index) =>
    scenarioFor({ framework: "jest", index, seed: "seed-a" }),
  );
  const second = Array.from({ length: SCENARIO_WORKLOADS.jest }, (_, index) =>
    scenarioFor({ framework: "jest", index, seed: "seed-b" }),
  );

  assert.notDeepEqual(
    first.map(({ kind }) => kind),
    second.map(({ kind }) => kind),
  );
  assert.deepEqual(summarizeScenarios(first), summarizeScenarios(second));
});

test("models retry-pass scenarios and persistent failures explicitly", () => {
  assert.equal(outcomeForAttempt({ kind: "flaky" }, 0), "failed");
  assert.equal(outcomeForAttempt({ kind: "flaky" }, 1), "passed");
  assert.equal(outcomeForAttempt({ kind: "failed" }, 0), "failed");
  assert.equal(outcomeForAttempt({ kind: "failed" }, 9), "failed");
  assert.equal(outcomeForAttempt({ kind: "passed" }, 0), "passed");
  assert.equal(outcomeForAttempt({ kind: "skipped" }, 0), "skipped");
});

test("rejects invalid framework indexes instead of silently changing identities", () => {
  assert.throws(
    () => scenarioFor({ framework: "playwright", index: 22, seed: "daily" }),
    /index must be an integer between 0 and 21/,
  );
});
