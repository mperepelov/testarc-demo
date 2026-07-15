# Security policy

Do not report vulnerabilities or accidentally exposed credentials in a public
issue. Use GitHub's private vulnerability reporting for this repository when it
is available, or contact the repository owner privately through the security
contact listed on their GitHub profile.

This demo must use a dedicated least-privilege TestArc user, a project-scoped
API key, and GitHub environment secrets. Rotate any credential immediately if
it appears in logs, artifacts, commits, or an issue.

Only the latest commit on `main` is maintained. The TestArc reporter packages
used here are prereleases and should not be treated as a stable production API.
