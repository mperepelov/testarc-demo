import { spawn } from "node:child_process";

import { resolveRunStartedAt } from "./lib/run-context.js";

async function run(command, args) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve(exitCode ?? 1));
  });
  if (code !== 0)
    throw new Error(`${command} ${args.join(" ")} exited ${code}`);
}

process.env.TESTARC_RUN_STARTED_AT = resolveRunStartedAt();
await run(process.execPath, ["scripts/run-workloads.js"]);
await run(process.execPath, ["verification/api.js"]);
const npmExecPath = process.env.npm_execpath;
await run(
  npmExecPath
    ? process.execPath
    : process.platform === "win32"
      ? "npm.cmd"
      : "npm",
  [...(npmExecPath ? [npmExecPath] : []), "run", "verify:ui"],
);
