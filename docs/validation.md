# Validation record

## Verified locally

- API integration test: create, edit, delete, invalid input, HTTPS validation, release prerequisites, duplicate versions, persistence after reopening the store, password authentication, and deletion of related releases.
- Production frontend compilation.
- Dependency audit: no reported vulnerabilities at the time of installation.
- Deployment script shell syntax.
- Browser checks: project creation, rendered dashboard totals, desktop dark theme, desktop light theme, and mobile layout at 390 × 844.
- Mobile document width matches the viewport; no horizontal overflow in the tested overview state.

## Pending

- Local Docker build: Docker is not installed on the development machine. The GitHub workflow includes a Docker build.
- PostgreSQL integration and Cloud SQL connectivity: requires cloud database provisioning.
- Google Cloud deployment, authenticated live end-to-end tests, and restart persistence: account access is blocked until Google two-step verification is enabled.

Screenshots in this repository are local browser captures. No cloud dashboard or live deployment result is claimed.
