import { FRAMEWORK_WORKLOADS } from "@testarc-demo/scenarios";

const FRAMEWORKS = Object.freeze(["playwright", "jest", "vitest"]);

export function correlateFrameworkRuns(runs, { branch, commitSha, startedAt }) {
  const cutoff = Date.parse(startedAt);
  if (!Number.isFinite(cutoff))
    throw new Error(`Invalid TESTARC_RUN_STARTED_AT: ${startedAt}`);

  const candidates = runs
    .filter(
      (run) =>
        FRAMEWORKS.includes(run.framework) &&
        run.branch === branch &&
        run.commitSha === commitSha &&
        run.status === "completed" &&
        Date.parse(run.createdAt) >= cutoff,
    )
    .sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );

  const selected = FRAMEWORKS.map((framework) =>
    candidates.find((run) => run.framework === framework),
  );
  const missing = FRAMEWORKS.filter((_, index) => !selected[index]);
  if (missing.length > 0) {
    throw new Error(`missing completed runs for ${missing.join(", ")}`);
  }
  return selected;
}

export function evaluateImmediateRun(
  run,
  { jobStatuses, executions, artifacts },
) {
  const expectedTests = FRAMEWORK_WORKLOADS[run.framework];
  if (!expectedTests) throw new Error(`Unexpected framework ${run.framework}`);
  if (run.status !== "completed")
    throw new Error(`${run.framework} run is ${run.status}`);
  if (run.totalTests !== expectedTests) {
    throw new Error(
      `${run.framework} reported ${run.totalTests} tests; expected ${expectedTests}`,
    );
  }
  if (run.failedCount < 1)
    throw new Error(`${run.framework} has no seeded persistent failure`);
  if (run.skippedCount < 1)
    throw new Error(`${run.framework} has no seeded skipped test`);
  if (
    jobStatuses.length === 0 ||
    jobStatuses.some(({ status }) => status !== "completed")
  ) {
    throw new Error(`${run.framework} ingestion is not completed`);
  }
  if (executions.length === 0)
    throw new Error(`${run.framework} has no ingested executions`);

  const scenarioExecutions = executions.filter(({ testName }) =>
    /\[(PLAYWRIGHT|JEST|VITEST)-\d{3}\]/.test(testName ?? ""),
  );
  if (scenarioExecutions.length === 0) {
    throw new Error(
      `${run.framework} executions do not preserve stable demo IDs`,
    );
  }
  if (run.framework === "playwright" && artifacts.length === 0) {
    throw new Error("playwright run has no retained failure artifact");
  }

  return {
    framework: run.framework,
    runId: run.id,
    totalTests: run.totalTests,
    retryEvidence: executions.some(({ retryIndex }) => retryIndex > 0),
    artifactEvidence: artifacts.length > 0,
    canaryExecutions: executions.filter(({ testName }) =>
      /\[CANARY-\d{3}\]/.test(testName ?? ""),
    ).length,
  };
}

export function evaluateHistory({ relevantRunCount, stabilityRows }) {
  if (relevantRunCount < 5) {
    return { status: "not-enough-evidence", relevantRunCount };
  }
  const flakyTests = stabilityRows.filter(
    (row) => row.flakeClassification && row.flakeClassification !== "stable",
  ).length;
  if (flakyTests === 0) {
    throw new Error(
      `no flaky test evidence after ${relevantRunCount} relevant runs`,
    );
  }
  return { status: "validated", relevantRunCount, flakyTests };
}

function normalizeJobStatuses(data) {
  return Array.isArray(data) ? data : [data];
}

function relevantCycleCount(runs) {
  const counts = FRAMEWORKS.map(
    (framework) =>
      runs.filter(
        (run) => run.framework === framework && run.status === "completed",
      ).length,
  );
  return Math.min(...counts);
}

export async function verifyApi({
  fetchImpl = fetch,
  environment = process.env,
} = {}) {
  const apiUrl = environment.TESTARC_API_URL.replace(/\/+$/, "");
  const headers = { Authorization: `Bearer ${environment.TESTARC_API_KEY}` };
  const branch = environment.TESTARC_BRANCH ?? "main";
  const commitSha = environment.TESTARC_COMMIT_SHA;
  const projectId = environment.TESTARC_PROJECT_ID;

  async function get(path) {
    const response = await fetchImpl(`${apiUrl}${path}`, { headers });
    if (!response.ok)
      throw new Error(`GET ${path} failed with HTTP ${response.status}`);
    return response.json();
  }

  const query = new URLSearchParams({
    projectId,
    branch,
    commitSha,
    pageSize: "100",
  });
  const deadline =
    Date.now() + Number(environment.TESTARC_VERIFY_TIMEOUT_MS ?? 120_000);
  let matchedRuns;
  let lastError;
  while (Date.now() < deadline) {
    const response = await get(`/v1/runs?${query}`);
    try {
      matchedRuns = correlateFrameworkRuns(response.data, {
        branch,
        commitSha,
        startedAt: environment.TESTARC_RUN_STARTED_AT,
      });
      break;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
  if (!matchedRuns)
    throw lastError ?? new Error("Timed out waiting for framework runs");

  const immediate = await Promise.all(
    matchedRuns.map(async (summary) => {
      const [detail, status, executions, artifacts] = await Promise.all([
        get(`/v1/runs/${summary.id}`),
        get(`/v1/runs/${summary.id}/status`),
        get(`/v1/runs/${summary.id}/executions?pageSize=100`),
        get(`/v1/runs/${summary.id}/artifacts?pageSize=100`),
      ]);
      return evaluateImmediateRun(detail.data, {
        jobStatuses: normalizeJobStatuses(status.data),
        executions: executions.data,
        artifacts: artifacts.data,
      });
    }),
  );

  if (!immediate.some(({ retryEvidence }) => retryEvidence)) {
    throw new Error("No retry evidence was preserved by any framework run");
  }

  const historyQuery = new URLSearchParams({
    projectId,
    branch,
    pageSize: "100",
  });
  const historicalRuns = await get(`/v1/runs?${historyQuery}`);
  const cycles = relevantCycleCount(historicalRuns.data);
  let stabilityRows = [];
  if (cycles >= 5) {
    const stabilityQuery = new URLSearchParams({
      projectId,
      includeFeatureBranches: "false",
      pageSize: "100",
    });
    stabilityRows = (await get(`/v1/stability/tests?${stabilityQuery}`)).data;
  }

  return {
    schemaVersion: "testarc-demo/verification/v1",
    commitSha,
    branch,
    immediate,
    history: evaluateHistory({ relevantRunCount: cycles, stabilityRows }),
  };
}
