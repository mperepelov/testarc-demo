export function buildWorkloadResult({
  framework,
  seed,
  startedAt,
  completedAt,
  exitCode,
}) {
  if (!["playwright", "jest", "vitest"].includes(framework)) {
    throw new Error(`unknown framework ${framework}`);
  }
  if (!Number.isInteger(exitCode) || exitCode < 0) {
    throw new Error("exitCode must be a non-negative integer");
  }
  return {
    schemaVersion: "testarc-demo/workload-result/v1",
    framework,
    seed,
    startedAt,
    completedAt,
    runnerExitCode: exitCode,
    intentionalFailureObserved: exitCode !== 0,
  };
}

export function evaluateWorkloadResults(results) {
  const frameworks = ["playwright", "jest", "vitest"];
  const byFramework = new Map(
    results.map((result) => [result.framework, result]),
  );
  if (byFramework.size !== frameworks.length) {
    throw new Error(
      "Expected exactly one workload result from every framework",
    );
  }

  return Object.fromEntries(
    frameworks.map((framework) => {
      const result = byFramework.get(framework);
      if (!result) throw new Error(`Missing ${framework} workload result`);
      if (!result.intentionalFailureObserved || result.runnerExitCode === 0) {
        throw new Error(`${framework} did not produce its intentional failure`);
      }
      return [framework, result.runnerExitCode];
    }),
  );
}
