import { expect, test } from "@playwright/test";
import {
  outcomeForAttempt,
  scenarioFor,
  SCENARIO_WORKLOADS,
} from "@testarc-demo/scenarios";

const seed = process.env.TESTARC_SCENARIO_SEED ?? "default";

for (let index = 0; index < SCENARIO_WORKLOADS.playwright; index += 1) {
  const scenario = scenarioFor({ framework: "playwright", index, seed });
  const define = scenario.kind === "skipped" ? test.skip : test;

  define(
    `[${scenario.id}] checkout flow (${scenario.kind})`,
    async ({ page }, testInfo) => {
      await test.step("open the team-owned example application", async () => {
        await page.setContent(`
        <main>
          <h1>Checkout</h1>
          <label>Quantity <input aria-label="Quantity" type="number" value="1" /></label>
          <button type="button">Place order</button>
          <p role="status"></p>
        </main>
        <script>
          document.querySelector('button').addEventListener('click', () => {
            document.querySelector('[role=status]').textContent = 'Order accepted';
          });
        </script>
      `);
        await expect(
          page.getByRole("heading", { name: "Checkout" }),
        ).toBeVisible();
      });

      await test.step("submit an order", async () => {
        await page.getByRole("button", { name: "Place order" }).click();
        await expect(page.getByRole("status")).toHaveText("Order accepted");
      });

      if (index === 0) {
        await testInfo.attach("scenario.json", {
          body: Buffer.from(JSON.stringify(scenario)),
          contentType: "application/json",
        });
      }

      expect(
        outcomeForAttempt(scenario, testInfo.retry),
        `seeded ${scenario.kind} outcome`,
      ).toBe("passed");
    },
  );
}
