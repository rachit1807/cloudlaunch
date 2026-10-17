# Render deployment

## Deployed configuration

- Service: `cloudlaunch-rachit`, free Docker web service, Singapore.
- Source: `rachit1807/cloudlaunch`, `main` branch.
- Build: multi-stage root Dockerfile; non-root Node.js 24 runtime.
- Health path: `/api/health`, which checks PostgreSQL connectivity.
- Secrets: Render resolves the existing database connection and generates `WORKSPACE_PASSWORD` through the Blueprint.
- Storage: existing `teamhub-rbac-db` database, isolated `cloudlaunch.workspace` table.
- Deploy source of truth: root `render.yaml`.

## Reproduce in your own account

1. Fork the repository and configure a PostgreSQL database in the same Render region as the web service.
2. Update `render.yaml` to reference your database’s actual name and your repository URL. Do not reuse someone else’s database resource name.
3. Create a Blueprint from the repository. Review the plan and confirm the service is `free` before deploying.
4. Render validates the Blueprint, builds the Dockerfile, resolves environment secrets, and starts the app.
5. Retrieve the generated workspace password in Render’s Environment page. Do not commit it or the database URL.
6. Open the live URL, unlock the workspace, and complete the checks below.

The local Render CLI is not installed; the deployment configuration was validated by Render’s Dashboard planning flow before deployment.

## Storage separation

The workspace owner approved using an existing PostgreSQL instance because Render permits one free PostgreSQL instance per workspace. CloudLaunch explicitly qualifies every table query with its validated `DATABASE_SCHEMA` value. Its pool is limited to three connections. The application creates its own schema and table and does not query or modify TeamHub tables.

Both apps share capacity, availability, credentials, and the database expiry date. Schema separation is not a security boundary between applications that use the same database role. A dedicated database role or separate instance is recommended for production.

## Deployment automation

Normal changes pushed to `main` auto-deploy. For manual deployment, set `RENDER_SERVICE_ID` and `RENDER_API_KEY` in a secure shell, then run `./scripts/deploy.sh`.

The script installs locked dependencies, tests the API, builds the frontend, creates one Render deploy, tracks that deploy to a terminal state, and checks the live database-backed health endpoint. Source must already be committed and pushed. The script does not read local changes into Render.

## Live checks

- Frontend and health endpoint respond over HTTPS.
- Unauthenticated business API access is rejected.
- Authenticated project creation, editing, search/filtering, readiness checks, and release recording work.
- Data survives a fresh browser load and a new service deployment.
- Mobile view has no horizontal overflow and theme switching works.
- Recent runtime logs show successful startup without database errors.

## Free-plan constraints

The web service sleeps after 15 minutes without inbound traffic and may take about one minute to wake. Free instance hours and build resources are shared with the owner’s other Render services. The existing free PostgreSQL instance expires on 9 November 2026. Export workspace data before expiry; free PostgreSQL instances have no backups.

No paid service or database upgrade was requested or configured. Additional workspace usage beyond included limits follows the account’s Render billing settings; this project is not an unlimited hosting guarantee.

[Render free-plan limits](https://render.com/docs/free)

## Why Google Cloud was replaced

Google Cloud deployment was attempted, but billing activation presented a ₹15,000 payment request during account setup. To keep the student project within a zero-cost hosting budget, Render was selected instead. The amount is described as the payment request shown during setup; it is not claimed to be the cost of this application or a confirmed charge.

Google Cloud instructions remain in [google-cloud.md](google-cloud.md) and `scripts/deploy-gcp.sh` for future use. This deployment is on Render, which is also a cloud platform; it is not represented as an AWS, Google Cloud, or Azure deployment.
