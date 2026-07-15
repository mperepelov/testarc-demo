import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateEnvironment } from "./lib/preflight.js";
import { buildWorkloadResult } from "./lib/workload-result.js";

const framework = process.argv[2];
if (!["playwright", "jest", "vitest"].includes(framework)) {
  throw new Error(
    "Usage: node scripts/run-workload.js <playwright|jest|vitest>",
  );
}
if (process.env.TESTARC_REPORTING_ENABLED === "true")
  validateEnvironment("workload");

const startedAt = new Date().toISOString();
const npmExecPath = process.env.npm_execpath;
const command = npmExecPath
  ? process.execPath
  : process.platform === "win32"
    ? "npm.cmd"
    : "npm";
const commandArgs = npmExecPath
  ? [npmExecPath, "run", `test:${framework}`]
  : ["run", `test:${framework}`];
const exitCode = await new Promise((resolveExit, reject) => {
  const child = spawn(command, commandArgs, {
    stdio: "inherit",
    env: process.env,
  });
  child.once("error", reject);
  child.once("exit", (code) => resolveExit(code ?? 1));
});

const result = buildWorkloadResult({
  framework,
  seed: process.env.TESTARC_SCENARIO_SEED ?? "default",
  startedAt,
  completedAt: new Date().toISOString(),
  exitCode,
});
const directory = resolve("artifacts/workloads");
await mkdir(directory, { recursive: true });
await writeFile(
  resolve(directory, `${framework}.json`),
  `${JSON.stringify(result, null, 2)}\n`,
);
process.stdout.write(`${JSON.stringify(result)}\n`);
