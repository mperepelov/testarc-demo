const REQUIREMENTS = Object.freeze({
  api: [
    "TESTARC_API_URL",
    "TESTARC_API_KEY",
    "TESTARC_PROJECT_ID",
    "TESTARC_COMMIT_SHA",
    "TESTARC_RUN_STARTED_AT",
  ],
  ui: [
    "TESTARC_WEB_URL",
    "TESTARC_E2E_EMAIL",
    "TESTARC_E2E_PASSWORD",
    "TESTARC_COMMIT_SHA",
  ],
  workload: [
    "TESTARC_API_URL",
    "TESTARC_API_KEY",
    "TESTARC_PROJECT_ID",
    "TESTARC_COMMIT_SHA",
  ],
});

export function requiredEnvironment(surface) {
  const requirements = REQUIREMENTS[surface];
  if (!requirements) throw new Error(`unknown preflight surface ${surface}`);
  return [...requirements];
}

export function validateEnvironment(surface, environment = process.env) {
  const missing = requiredEnvironment(surface).filter(
    (name) => !environment[name]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
