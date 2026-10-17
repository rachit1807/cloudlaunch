# Validation record

## Local and continuous validation

- API integration test passes: project creation, edit, delete, invalid input, HTTPS URL validation, release prerequisites, duplicate versions, persistence after reopening the store, password protection, and related release deletion.
- Production frontend build passes.
- Deployment scripts pass shell/JavaScript syntax checks.
- Initial GitHub Actions run passed API tests, frontend compilation, and Docker build: [workflow run](https://github.com/rachit1807/cloudlaunch/actions/runs/39058147772).
- Dependency audit reported no known vulnerabilities at installation time.

## Verified on Render

Live URL: [cloudlaunch-rachit.onrender.com](https://cloudlaunch-rachit.onrender.com).

- Render Docker deploy `dep-db9s0b3bc2fs73d197p0` became live from commit `9d054dc`.
- Subsequent automatic deploy `dep-db9s3t2vcj2c739l8e90` became live from commit `cbad659`.
- Frontend and PostgreSQL-backed `/api/health` smoke checks passed over HTTPS.
- Unauthenticated `/api/workspace` returns 401.
- Generated workspace password unlocks the UI.
- Created a real CloudLaunch project with its actual live URL; saved and reloaded it successfully.
- Saved all four verified readiness checks and recorded the actual first release as `v1.0.0`.
- Saved project data persisted across the subsequent service deployment.
- Release history shows the stored version, notes, environment, and live link.
- Live mobile search and environment filters correctly show and clear empty results.
- Mobile navigation, desktop light/dark themes, and the 390 × 844 layout were checked.
- The mobile document width equals the 390-pixel viewport, with no horizontal overflow in the tested overview state.
- Runtime logs confirm successful startup and a live service without database errors in the inspected startup entries.

## Limits

- Authenticated destructive delete behavior was covered by local integration tests, not performed on the real retained CloudLaunch release record.
- Database inspection through the hosted Render query tool is blocked by the existing database’s external IP restrictions. Those restrictions were preserved. The running app connects through the private network; its live health and persistence flows confirm database access.
- There was no AWS, Google Cloud, or Azure deployment. Google Cloud billing setup presented a ₹15,000 payment request, so the user selected Render instead.
- Render’s free web service sleeps when idle and shares workspace free-hour limits. The existing free PostgreSQL instance expires on 9 November 2026 unless upgraded.

Live screenshots are stored in `docs/screenshots/live-*`; local design captures remain separately named. Secrets are not included in screenshots or repository files.

## Interface redesign verification

Verified the live project index, project workbook, release journal, and both themes after the redesign. On a 390px mobile viewport, document width and scroll width both measured 390px. Local owner login and project form were checked; API integration tests and production build passed. Public sample data remains isolated from the private workspace.
