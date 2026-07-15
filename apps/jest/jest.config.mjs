const reportingEnabled = process.env.TESTARC_REPORTING_ENABLED === "true";

export default {
  testEnvironment: reportingEnabled
    ? "@testarc/jest-reporter/environment"
    : "node",
  reporters: [
    "default",
    ...(reportingEnabled
      ? [
          [
            "@testarc/jest-reporter",
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
          ],
        ]
      : []),
  ],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
};
