import { expect, test } from "@playwright/test";

import { validateEnvironment } from "../../../scripts/lib/preflight.js";

test("a dedicated user can see the newly ingested runs", async ({ page }) => {
  validateEnvironment("ui");
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.TESTARC_E2E_EMAIL);
  await page.getByLabel("Password").fill(process.env.TESTARC_E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.goto("/runs");
  await expect(page.getByRole("heading", { name: "Runs" })).toBeVisible();
  const commit = process.env.TESTARC_COMMIT_SHA.slice(0, 7);
  const correlatedRuns = page.getByRole("row").filter({ hasText: commit });
  await expect.poll(() => correlatedRuns.count()).toBeGreaterThanOrEqual(3);
});
