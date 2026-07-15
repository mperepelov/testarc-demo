import { readFile } from "node:fs/promises";

import { validateEnvironment } from "../scripts/lib/preflight.js";
import { evaluateWorkloadResults } from "../scripts/lib/workload-result.js";
import { verifyApi } from "./lib/api-verifier.js";

validateEnvironment("api");
const frameworks = ["playwright", "jest", "vitest"];
const workloadResults = await Promise.all(
  frameworks.map(async (framework) =>
    JSON.parse(await readFile(`artifacts/workloads/${framework}.json`, "utf8")),
  ),
);
const result = {
  ...(await verifyApi()),
  workloadExitCodes: evaluateWorkloadResults(workloadResults),
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
