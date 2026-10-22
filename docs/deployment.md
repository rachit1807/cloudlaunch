# Render deployment

## Deployed configuration

- Service: `cloudlaunch-rachit`, free Docker web service, Singapore.
- Source: `rachit1807/cloudlaunch`, `main` branch.
- Build: multi-stage root Dockerfile; non-root Node.js 24 runtime.
- Health path: `/api/health`, which checks PostgreSQL connectivity.
- Secrets: Supply `DATABASE_URL` securely in Render; the Blueprint generates `WORKSPACE_PASSWORD` through the Blueprint.
- Storage: independent Neon PostgreSQL 16 project in Singapore, `cloudlaunch.workspace` table.
- Deploy source of truth: root `render.yaml`.

## Reproduce in your own account

1. Fork the repository and configure a Neon PostgreSQL 16 project in Singapore.
2. Set your repository URL and supply the direct Neon connection URL with `sslmode=require` as `DATABASE_URL`. Keep credentials private.
3. Create a Blueprint from the repository. Review the plan and confirm the service is `free` before deploying.
4. Render validates the Blueprint, builds the Dockerfile, uses the supplied environment secrets, and starts the app.
5. Retrieve the generated workspace password in Render’s Environment page. Do not commit it or the database URL.
6. Open the live URL, unlock the workspace, and complete the checks below.

The local Render CLI is not installed; the deployment configuration was validated by Render’s Dashboard planning flow before deployment.

## Storage separation

CloudLaunch uses its own Neon project, database and role. Queries explicitly qualify the `cloudlaunch` schema, and the application pool is limited to three connections. Traffic from Render to Neon uses TLS. The direct endpoint is used; credentials belong only in Render environment settings.

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

The web service sleeps after 15 minutes without inbound traffic and may take about one minute to wake. Free instance hours and build resources are shared with the owner’s other Render services. The Neon production branch has no scheduled expiry. Its free plan has storage, compute, transfer and recovery limits. Keep independent backups and review usage; no service is guaranteed unlimited or permanently free.

No paid service or database upgrade was requested or configured. Additional workspace usage beyond included limits follows the account’s Render billing settings; this project is not an unlimited hosting guarantee.

[Render free-plan limits](https://render.com/docs/free)

## Why Google Cloud was replaced

Google Cloud deployment was attempted, but billing activation presented a ₹15,000 payment request during account setup. To keep the student project within a zero-cost hosting budget, Render was selected instead. The amount is described as the payment request shown during setup; it is not claimed to be the cost of this application or a confirmed charge.

Google Cloud instructions remain in [google-cloud.md](google-cloud.md) and `scripts/deploy-gcp.sh` for future use. This deployment is on Render, which is also a cloud platform; it is not represented as an AWS, Google Cloud, or Azure deployment.
