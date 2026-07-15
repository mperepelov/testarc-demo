# TestArc Demo Agent Rules

- Track repository work in the TestArc Linear team and include the ticket ID in branch names.
- Keep this repository black-box: depend only on public TestArc packages, HTTP APIs, and the public web UI. Never import TestArc source modules or inspect its database, queues, Redis, or internal fixtures.
- Preserve deterministic scenarios. Do not use `Math.random`; vary scenarios only through `TESTARC_SCENARIO_SEED`.
- Intentional workload failures are evidence, not harness failures. The API and UI verifiers own the final verdict.
- Keep reporter dependencies pinned to exact versions. Upgrade them through reviewed dependency pull requests.
- The demo must work with a running local TestArc instance and a persistent Railway instance. It must not start, migrate, seed, or stop TestArc itself.
- Never commit credentials. Scheduled GitHub Actions runs remain disabled until `TESTARC_E2E_ENABLED=true` is configured as a repository variable.
