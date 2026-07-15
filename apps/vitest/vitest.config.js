import { defineConfig } from "vitest/config";

const reportingEnabled = process.env.TESTARC_REPORTING_ENABLED === "true";
const reporters = ["default"];

if (reportingEnabled) {
  reporters.push([
    "@testarc/vitest-reporter",
    {
      mode: "ci",
      deliveryPolicy: "required",
      artifactStoragePolicy: "non-passed-only",
      apiUrl: process.env.TESTARC_API_URL,
      apiKey: process.env.TESTARC_API_KEY,
      projectId: process.env.TESTARC_PROJECT_ID,
      branch: process.env.TESTARC_BRANCH ?? "main",
      commitSha: process.env.TESTARC_COMMIT_SHA,
      environment: process.env.TESTARC_ENVIRONMENT ?? "local",
    },
  ]);
}

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    reporters,
    fileParallelism: false,
  },
});
