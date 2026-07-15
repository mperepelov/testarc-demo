import { expect, test } from "@playwright/test";

const canaries = [
  {
    id: "CANARY-001",
    name: "Example Domain",
    url: "https://example.com",
    heading: "Example Domain",
  },
  {
    id: "CANARY-002",
    name: "Playwright documentation",
    url: "https://playwright.dev",
    heading: "Playwright",
  },
  {
    id: "CANARY-003",
    name: "GitHub",
    url: "https://github.com",
    heading: "GitHub",
  },
];

for (const canary of canaries) {
  test(`[${canary.id}] public canary: ${canary.name}`, async ({ page }) => {
    await page.goto(canary.url, { waitUntil: "domcontentloaded" });
    await expect(
      page
        .getByRole("heading", { name: new RegExp(canary.heading, "i") })
        .first(),
    ).toBeVisible();
  });
}
