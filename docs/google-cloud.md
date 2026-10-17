# Deploy CloudLaunch to Google Cloud

## Prerequisites

- A Google Cloud account with two-step verification enabled.
- A project with billing enabled and permission to deploy Cloud Run, use Cloud Build, provision Cloud SQL, and manage the necessary service identities.
- Google Cloud CLI authenticated with `gcloud auth login`.
- Node.js 24 and npm.

Cloud SQL is a managed database and may incur charges even when Cloud Run is idle. Review the project budget before provisioning. This guide does not create resources automatically.

## 1. Prepare the cloud project

Select the intended project and enable Cloud Run, Cloud Build, Artifact Registry, Cloud SQL Admin, and Secret Manager APIs. Choose one region for the app and database, for example `asia-south1`.

In Cloud SQL, create a PostgreSQL instance, database named `cloudlaunch`, and a dedicated database user. Use a strong database password. Copy the instance connection name (`PROJECT:REGION:INSTANCE`). Keep database backups and recovery settings appropriate to the project. Avoid opening the database to all public IP addresses.

## 2. Configure runtime access

Create a dedicated Cloud Run service account such as `cloudlaunch-runtime`. Grant it the Cloud SQL Client role. Follow your organization’s least-privilege policy for Cloud Build and source-deploy permissions; the deploying identity must be allowed to act as this runtime service account.

Create these two Secret Manager secrets:

| Secret | Content |
| --- | --- |
| `cloudlaunch-database-url` | PostgreSQL connection URL |
| `cloudlaunch-workspace-password` | Strong shared workspace password |

Grant the runtime service account Secret Manager Secret Accessor on those specific secrets. Do not put secret values in Git, shell history, screenshots, or the README.

For a Cloud SQL socket, the database URL takes this shape:

```text
postgresql://USER:URL_ENCODED_PASSWORD@localhost/cloudlaunch?host=/cloudsql/PROJECT:REGION:INSTANCE
```

URL-encode special characters in the user/password portion. The script’s Cloud SQL attachment must exactly match the instance connection name. For another PostgreSQL provider, use that provider’s TLS and trust configuration; do not disable certificate verification.

## 3. Build and deploy

From the repository root:

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="asia-south1"
export CLOUD_SQL_INSTANCE="your-project-id:asia-south1:your-instance"
export SERVICE_ACCOUNT="cloudlaunch-runtime@your-project-id.iam.gserviceaccount.com"
./scripts/deploy.sh
```

Optional overrides: `SERVICE_NAME`, `DATABASE_SECRET`, and `PASSWORD_SECRET`. These are resource names, not secret values.

The script deploys the source using Cloud Build and the repository Dockerfile. Cloud Run exposes port 8080, attaches the Cloud SQL instance, and resolves the two secret versions into environment variables. Public HTTP access permits the interface and health endpoint to load; the shared workspace password protects business data routes. The service is capped at two instances.

The runtime creates the table and initial workspace on its first successful database connection. A fresh production workspace is empty. Existing local development data is not automatically uploaded.

## 4. Verify the live application

1. Open the actual Cloud Run service URL and unlock the workspace.
2. Create a temporary project and update its description.
3. Refresh the page and confirm the saved project remains.
4. Restart/redeploy the service and confirm the project still exists in PostgreSQL.
5. Test search, filters, mobile navigation, and both themes.
6. Add a verified HTTPS URL, finish the readiness checklist, save, and record a test release.
7. Confirm duplicate versions are rejected and delete the temporary project after checking its release history.
8. Run `node scripts/smoke.mjs https://ACTUAL_SERVICE_URL`.

The smoke script checks both frontend delivery and the database-backed health endpoint. It does not replace the authenticated user-flow checks above.

## 5. Submission evidence

After success, replace README deployment status with the verified URL. Save redacted screenshots of Cloud Run’s active revision, Cloud SQL status, and the live application under `docs/screenshots/`. Keep secret values, database connection strings, account identifiers, and billing details out of screenshots.

## Troubleshooting

- **Google Cloud access blocked:** enable two-step verification in the Google Account security settings, then refresh the console.
- **Service does not become ready:** check Cloud Run logs, required secrets, database connectivity, and port 8080.
- **Cloud SQL connection failure:** verify the exact instance connection name, attachment, runtime service identity, Cloud SQL Client role, database user, and socket URL.
- **Secret permission failure:** grant the runtime identity access on the relevant secret and redeploy.
- **401 from the API:** unlock the workspace with the production password. The health endpoint is intentionally public.
- **429 from the API:** wait a minute after repeated invalid password attempts.

## Official references

- [Cloud Run and Cloud SQL PostgreSQL](https://docs.cloud.google.com/sql/docs/postgres/connect-instance-cloud-run)
- [Configure secrets for Cloud Run](https://docs.cloud.google.com/run/docs/configuring/services/secrets)
- [Cloud Run deployment command](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy)
