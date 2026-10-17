#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${CLOUD_SQL_INSTANCE:?Set CLOUD_SQL_INSTANCE to project:region:instance}"
: "${SERVICE_ACCOUNT:?Set SERVICE_ACCOUNT to the Cloud Run runtime service account email}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE="${SERVICE_NAME:-cloudlaunch}"
DATABASE_SECRET="${DATABASE_SECRET:-cloudlaunch-database-url}"
PASSWORD_SECRET="${PASSWORD_SECRET:-cloudlaunch-workspace-password}"
for command in gcloud node npm; do command -v "$command" >/dev/null || { echo "Missing requirement: $command" >&2; exit 1; }; done
[[ -n "$(gcloud auth list --filter=status:ACTIVE --format='value(account)')" ]] || { echo 'Run gcloud auth login first.' >&2; exit 1; }
for secret in "$DATABASE_SECRET" "$PASSWORD_SECRET"; do gcloud secrets describe "$secret" --project "$GCP_PROJECT_ID" >/dev/null; done
npm ci
npm test
npm run build
# Cloud Build uses the multi-stage Dockerfile, then Cloud Run publishes the image.
gcloud run deploy "$SERVICE" --source . --project "$GCP_PROJECT_ID" --region "$REGION" \
 --service-account "$SERVICE_ACCOUNT" --allow-unauthenticated --port 8080 \
 --set-cloudsql-instances "$CLOUD_SQL_INSTANCE" \
 --set-env-vars NODE_ENV=production \
 --set-secrets "DATABASE_URL=$DATABASE_SECRET:latest,WORKSPACE_PASSWORD=$PASSWORD_SECRET:latest" \
 --max-instances 2 --memory 512Mi --quiet
URL="$(gcloud run services describe "$SERVICE" --project "$GCP_PROJECT_ID" --region "$REGION" --format='value(status.url)')"
node scripts/smoke.mjs "$URL"
echo "CloudLaunch deployed: $URL"
