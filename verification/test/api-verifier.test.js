import assert from "node:assert/strict";
import test from "node:test";

import {
  correlateFrameworkRuns,
  evaluateHistory,
  evaluateImmediateRun,
} from "../lib/api-verifier.js";

const startedAt = "2026-07-15T06:00:00.000Z";

test("correlates the latest run per framework by commit, branch, and workflow start", () => {
  const runs = [
    {
      id: "old",
      framework: "playwright",
      branch: "main",
      commitSha: "abc",
      status: "completed",
      createdAt: "2026-07-14T06:00:00.000Z",
    },
    {
      id: "pw",
      framework: "playwright",
      branch: "main",
      commitSha: "abc",
      status: "completed",
      createdAt: "2026-07-15T06:00:05.000Z",
    },
    {
      id: "jest",
      framework: "jest",
      branch: "main",
      commitSha: "abc",
      status: "completed",
      createdAt: "2026-07-15T06:00:06.000Z",
    },
    {
      id: "vitest",
      framework: "vitest",
      branch: "main",
      commitSha: "abc",
      status: "completed",
      createdAt: "2026-07-15T06:00:07.000Z",
    },
    {
      id: "other",
      framework: "vitest",
      branch: "feature",
      commitSha: "abc",
      status: "completed",
      createdAt: "2026-07-15T06:00:08.000Z",
    },
  ];

  assert.deepEqual(
    correlateFrameworkRuns(runs, {
      branch: "main",
      commitSha: "abc",
      startedAt,
    }).map(({ id }) => id),
    ["pw", "jest", "vitest"],
  );
});

test("fails correlation when any public reporter has not produced a run", () => {
  assert.throws(
    () =>
      correlateFrameworkRuns([], {
        branch: "main",
        commitSha: "abc",
        startedAt,
      }),
    /missing completed runs for playwright, jest, vitest/,
  );
});

test("validates immediate ingestion, expected outcomes, retries, and Playwright artifacts", () => {
  const result = evaluateImmediateRun(
    {
      framework: "playwright",
      totalTests: 25,
      failedCount: 1,
      skippedCount: 1,
      status: "completed",
    },
    {
      jobStatuses: [{ status: "completed" }],
      executions: [
        { testName: "[PLAYWRIGHT-001] checkout", retryIndex: 0 },
        { testName: "[PLAYWRIGHT-002] checkout", retryIndex: 1 },
      ],
      artifacts: [{ id: "trace-1", type: "trace" }],
    },
  );

  assert.equal(result.framework, "playwright");
  assert.equal(result.retryEvidence, true);
  assert.equal(result.artifactEvidence, true);
});

test("does not make public canary outcomes part of the gating counts", () => {
  const result = evaluateImmediateRun(
    {
      framework: "playwright",
      totalTests: 25,
      failedCount: 1,
      skippedCount: 1,
      status: "completed",
    },
    {
      jobStatuses: [{ status: "completed" }],
      executions: [
        { testName: "[PLAYWRIGHT-001] checkout", retryIndex: 0 },
        { testName: "[CANARY-001] Example Domain", retryIndex: 0 },
      ],
      artifacts: [{ id: "trace-1" }],
    },
  );

  assert.equal(result.canaryExecutions, 1);
});

test("reports insufficient history without failing before five relevant runs", () => {
  assert.deepEqual(
    evaluateHistory({ relevantRunCount: 4, stabilityRows: [] }),
    {
      status: "not-enough-evidence",
      relevantRunCount: 4,
    },
  );
});

test("requires flakiness evidence once five relevant runs exist", () => {
  assert.deepEqual(
    evaluateHistory({
      relevantRunCount: 5,
      stabilityRows: [{ flakeClassification: "flaky", eligibleExecutions: 5 }],
    }),
    { status: "validated", relevantRunCount: 5, flakyTests: 1 },
  );
  assert.throws(
    () =>
      evaluateHistory({
        relevantRunCount: 5,
        stabilityRows: [
          { flakeClassification: "stable", eligibleExecutions: 5 },
        ],
      }),
    /no flaky test evidence/,
  );
});
