import { describe, expect, test } from "vitest";
import {
  outcomeForAttempt,
  scenarioFor,
  SCENARIO_WORKLOADS,
} from "@testarc-demo/scenarios";

const seed = process.env.TESTARC_SCENARIO_SEED ?? "default";
const attempts = new Map();

describe("team-owned domain utilities", () => {
  for (let index = 0; index < SCENARIO_WORKLOADS.vitest; index += 1) {
    const scenario = scenarioFor({ framework: "vitest", index, seed });
    const options = scenario.kind === "skipped" ? { skip: true } : { retry: 2 };

    test(
      `[${scenario.id}] normalizes account data (${scenario.kind})`,
      options,
      () => {
        const attempt = attempts.get(scenario.id) ?? 0;
        attempts.set(scenario.id, attempt + 1);

        const normalizeAccount = (account) => ({
          email: account.email.trim().toLowerCase(),
          plan: account.plan ?? "free",
        });

        expect(normalizeAccount({ email: " Team@Example.com " })).toEqual({
          email: "team@example.com",
          plan: "free",
        });
        expect(
          outcomeForAttempt(scenario, attempt),
          `seeded ${scenario.kind} outcome`,
        ).toBe("passed");
      },
    );
  }
});
