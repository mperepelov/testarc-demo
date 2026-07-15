import {
  outcomeForAttempt,
  scenarioFor,
  SCENARIO_WORKLOADS,
} from "@testarc-demo/scenarios";
import { describe, expect, jest, test } from "@jest/globals";

const seed = process.env.TESTARC_SCENARIO_SEED ?? "default";
const attempts = new Map();

jest.retryTimes(2, { logErrorsBeforeRetry: true });

describe("team-owned service contracts", () => {
  for (let index = 0; index < SCENARIO_WORKLOADS.jest; index += 1) {
    const scenario = scenarioFor({ framework: "jest", index, seed });
    const define = scenario.kind === "skipped" ? test.skip : test;

    define(
      `[${scenario.id}] calculates an invoice (${scenario.kind})`,
      async () => {
        const attempt = attempts.get(scenario.id) ?? 0;
        attempts.set(scenario.id, attempt + 1);

        const calculateInvoice = ({ unitPrice, quantity }) =>
          unitPrice * quantity;
        const exercise = async () => {
          expect(calculateInvoice({ unitPrice: 12, quantity: 3 })).toBe(36);
        };

        if (globalThis.testarc) {
          await globalThis.testarc.step("calculate invoice total", exercise);
        } else {
          await exercise();
        }

        expect(outcomeForAttempt(scenario, attempt)).toBe("passed");
      },
    );
  }
});
