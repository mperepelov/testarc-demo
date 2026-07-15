import { defineConfig } from "@playwright/test";

const reportingEnabled = process.env.TESTARC_REPORTING_ENABLED === "true";
const reporters = [["line"]];

if (reportingEnabled) {
  reporters.push([
    "@testarc/playwright-reporter",
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
  testDir: "./tests",
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: 2,
  timeout: 20_000,
  reporter: reporters,
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
