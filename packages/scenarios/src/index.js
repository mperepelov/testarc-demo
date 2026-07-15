export const FRAMEWORK_WORKLOADS = Object.freeze({
  playwright: 25,
  jest: 38,
  vitest: 37,
});

export const SCENARIO_WORKLOADS = Object.freeze({
  playwright: 22,
  jest: 38,
  vitest: 37,
});

const FAILURE_RANKS = Object.freeze({
  failed: 0,
  flaky: new Set([1, 2]),
  skipped: 3,
});

function hash(value) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.codePointAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function scenarioFor({ framework, index, seed }) {
  const count = SCENARIO_WORKLOADS[framework];
  if (!count) {
    throw new Error(`unknown framework ${framework}`);
  }
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw new Error(`index must be an integer between 0 and ${count - 1}`);
  }

  const normalizedSeed = String(seed || "default");
  const offset = hash(`${normalizedSeed}:${framework}`) % count;
  const rank = (index + offset) % count;
  const kind =
    rank === FAILURE_RANKS.failed
      ? "failed"
      : FAILURE_RANKS.flaky.has(rank)
        ? "flaky"
        : rank === FAILURE_RANKS.skipped
          ? "skipped"
          : "passed";

  return Object.freeze({
    id: `${framework.toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
    framework,
    index,
    kind,
    seed: normalizedSeed,
  });
}

export function outcomeForAttempt(scenario, attempt) {
  if (!Number.isInteger(attempt) || attempt < 0) {
    throw new Error("attempt must be a non-negative integer");
  }

  switch (scenario.kind) {
    case "passed":
      return "passed";
    case "flaky":
      return attempt === 0 ? "failed" : "passed";
    case "failed":
      return "failed";
    case "skipped":
      return "skipped";
    default:
      throw new Error(`unknown scenario kind ${scenario.kind}`);
  }
}

export function summarizeScenarios(scenarios) {
  return scenarios.reduce(
    (summary, scenario) => {
      summary[scenario.kind] += 1;
      return summary;
    },
    { passed: 0, flaky: 0, failed: 0, skipped: 0 },
  );
}
