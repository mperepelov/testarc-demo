# Contributing

Issues and pull requests are welcome. Keep changes black-box: this repository
may use only TestArc's published reporters, public HTTP API, and public web UI.

Use Node.js 24 and validate changes before opening a pull request:

```bash
nvm use
npm ci
npm run check
```

Scenario changes must remain deterministic, preserve stable test IDs, and add
or update focused tests. Do not commit credentials, `.env`, generated reports,
or artifacts from a TestArc instance.

By submitting a contribution, you agree that it is licensed under Apache-2.0.
