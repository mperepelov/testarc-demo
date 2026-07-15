import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWorkloadResult,
  evaluateWorkloadResults,
} from "../lib/workload-result.js";

test("records intentional runner failures as evidence without changing the harness contract", () => {
  assert.deepEqual(
    buildWorkloadResult({
      framework: "jest",
      seed: "daily",
      startedAt: "2026-07-15T06:00:00.000Z",
      completedAt: "2026-07-15T06:00:01.000Z",
      exitCode: 1,
    }),
    {
      schemaVersion: "testarc-demo/workload-result/v1",
      framework: "jest",
      seed: "daily",
      startedAt: "2026-07-15T06:00:00.000Z",
      completedAt: "2026-07-15T06:00:01.000Z",
      runnerExitCode: 1,
      intentionalFailureObserved: true,
    },
  );
});

test("requires one intentional non-zero runner result from every framework", () => {
  const result = evaluateWorkloadResults([
    {
      framework: "playwright",
      runnerExitCode: 1,
      intentionalFailureObserved: true,
    },
    { framework: "jest", runnerExitCode: 1, intentionalFailureObserved: true },
    {
      framework: "vitest",
      runnerExitCode: 1,
      intentionalFailureObserved: true,
    },
  ]);

  assert.deepEqual(result, {
    playwright: 1,
    jest: 1,
    vitest: 1,
  });
  assert.throws(
    () =>
      evaluateWorkloadResults([
        {
          framework: "playwright",
          runnerExitCode: 1,
          intentionalFailureObserved: true,
        },
        {
          framework: "jest",
          runnerExitCode: 0,
          intentionalFailureObserved: false,
        },
        {
          framework: "vitest",
          runnerExitCode: 1,
          intentionalFailureObserved: true,
        },
      ]),
    /jest did not produce its intentional failure/,
  );
});
