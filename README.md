# TestArc black-box demo

This public repository is a long-running end-to-end client of TestArc. It
simulates three independent teams using the published Playwright, Jest, and
Vitest reporters, then validates the resulting TestArc data through only the
public HTTP API and web UI.

The demo is intentionally black-box. It does not import the TestArc monorepo,
read its database, contact Redis or queues, reuse internal fixtures, or start,
migrate, seed, and stop a TestArc deployment.

## What runs

| Workload   | Tests | Evidence                                                              |
| ---------- | ----: | --------------------------------------------------------------------- |
| Playwright |    25 | 22 team-owned browser tests and 3 non-gating public-site canaries     |
| Jest       |    38 | Service-style tests, including deterministic retry-pass and failures  |
| Vitest     |    37 | Domain-utility tests, including deterministic retry-pass and failures |

Every run contains a fixed mix of passing, retry-pass, persistently failing,
and skipped tests. `TESTARC_SCENARIO_SEED` changes which stable test IDs receive
each scenario while preserving the totals. There is no random behavior.

The framework processes are expected to exit non-zero because each contains a
seeded persistent failure. The harness records those exit codes as workload
evidence and continues. The final API and UI verifiers own the workflow verdict.

## Prerequisites

- Node.js 24
- a running TestArc instance, either local or on Railway
- a TestArc project and API key allowed to submit and read that project
- a dedicated least-privilege TestArc user allowed to sign in and view runs
- Chromium for the Playwright workload and UI verifier

TestArc must already be healthy and migrated before this repository runs.

## Run against a local TestArc instance

Install exact dependencies and Chromium:

```bash
nvm use
npm ci
npx playwright install chromium
```

Create the local configuration:

```bash
cp .env.example .env
```

Edit `.env` with values from the running TestArc instance. `.env` is ignored by
Git and loaded automatically by the orchestration and verification scripts.

Run the complete black-box flow:

```bash
npm run e2e
```

The full flow runs all three workloads in parallel, waits for and verifies
their public API records, then signs into the web UI and confirms that the
correlated commit is visible. It never manages the TestArc process itself.

You can also run each layer independently:

```bash
npm run workloads
npm run verify:api
npm run verify:ui
```

For an offline workload-only check that does not submit to TestArc, explicitly
disable reporting and run a framework. A non-zero exit is expected:

```bash
TESTARC_REPORTING_ENABLED=false TESTARC_SCENARIO_SEED=local-check npm run test:jest
```

## Environment variables

| Variable                    | Required by       | Meaning                                                              |
| --------------------------- | ----------------- | -------------------------------------------------------------------- |
| `TESTARC_API_URL`           | workloads and API | Public API base URL without `/v1`, such as `http://localhost:3001`   |
| `TESTARC_WEB_URL`           | UI verifier       | Public web URL, such as `http://localhost:3000`                      |
| `TESTARC_API_KEY`           | workloads and API | Project-scoped TestArc API key; never commit it                      |
| `TESTARC_PROJECT_ID`        | workloads and API | Project UUID or slug that receives the demo runs                     |
| `TESTARC_E2E_EMAIL`         | UI verifier       | Email of a dedicated least-privilege TestArc user                    |
| `TESTARC_E2E_PASSWORD`      | UI verifier       | Password for that dedicated user; never commit it                    |
| `TESTARC_SCENARIO_SEED`     | workloads         | Reproducible scenario assignment seed                                |
| `TESTARC_REPORTING_ENABLED` | workloads         | Must be `true` for real TestArc submission                           |
| `TESTARC_BRANCH`            | correlation       | Stable branch label; defaults to `main`                              |
| `TESTARC_COMMIT_SHA`        | correlation       | Actual Git commit SHA in CI; use a stable local label for local runs |
| `TESTARC_ENVIRONMENT`       | correlation       | `github-actions` in CI or `local` locally                            |
| `TESTARC_RUN_STARTED_AT`    | API verifier      | ISO timestamp captured before the three workloads begin              |
| `TESTARC_VERIFY_TIMEOUT_MS` | API verifier      | Optional ingestion wait timeout; defaults to 120000                  |

`npm run e2e` captures `TESTARC_RUN_STARTED_AT` immediately before launching the
workloads. Set it yourself only when running `npm run verify:api` independently.

## Railway and daily GitHub Actions

Deploy TestArc to a persistent Railway project separately. This demo does not
own that deployment. In this repository on GitHub:

1. Create or use the `railway-e2e` environment.
2. Add environment secrets named `TESTARC_API_URL`, `TESTARC_WEB_URL`,
   `TESTARC_API_KEY`, `TESTARC_PROJECT_ID`, `TESTARC_E2E_EMAIL`, and
   `TESTARC_E2E_PASSWORD`.
3. Keep the repository variable `TESTARC_E2E_ENABLED` set to `false` while the
   Railway instance or credentials are not ready.
4. Run **TestArc black-box E2E** manually once. The optional `seed` input makes
   a failure assignment exactly reproducible.
5. After the manual run passes, set `TESTARC_E2E_ENABLED=true`.

The scheduled workflow runs every day at 06:00 UTC. Playwright, Jest, and
Vitest execute in separate parallel jobs. A final job downloads their result
records, validates TestArc through the public API, and runs the unreported UI
smoke. Workflow concurrency prevents overlapping evidence windows.

## What the verifier proves

For every execution it checks:

- one completed, correctly correlated run from each public reporter
- exact framework test totals and the expected persistent failure and skip
- completed ingestion jobs
- preserved stable test IDs and retry evidence
- retained Playwright failure artifacts
- visible runs after a real user login through the public web UI

The three public canaries (`example.com`, `playwright.dev`, and `github.com`)
exercise external navigation and are visible in TestArc, but their outcomes are
observational and do not change the final TestArc product verdict.

Historical flakiness validation begins only after five relevant executions per
framework. Before that threshold the verifier returns `not-enough-evidence`
instead of failing. Trend assertions can be added after the daily dataset has a
meaningful window.

This repository validates correctness and long-running stability signals. It
is not the TestArc throughput or capacity benchmark; load tests belong in a
separate, controlled performance plan.

## Dependency policy

Reporter versions are exact in `package.json` and `package-lock.json`.
Dependabot proposes reviewed upgrades instead of silently following npm
dist-tags. The current reporters are evaluation prereleases, so use this demo
with a non-production TestArc project until stable packages are released.

Pull requests run deterministic contract tests, formatting checks, and a dry
listing of the unreported UI smoke. See [CONTRIBUTING.md](CONTRIBUTING.md) and
[SECURITY.md](SECURITY.md) for the public contribution and reporting policies.

## License

Apache-2.0. See [LICENSE](LICENSE).
