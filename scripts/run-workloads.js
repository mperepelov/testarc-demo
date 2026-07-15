import { spawn } from "node:child_process";

const command = process.execPath;
const frameworks = ["playwright", "jest", "vitest"];

await Promise.all(
  frameworks.map(
    (framework) =>
      new Promise((resolve, reject) => {
        const child = spawn(command, ["scripts/run-workload.js", framework], {
          stdio: "inherit",
          env: process.env,
        });
        child.once("error", reject);
        child.once("exit", (code) =>
          code === 0
            ? resolve()
            : reject(new Error(`${framework} harness exited ${code}`)),
        );
      }),
  ),
);
