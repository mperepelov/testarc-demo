import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  reporter: [["line"]],
  retries: 1,
  timeout: 30_000,
  use: {
    baseURL: process.env.TESTARC_WEB_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
