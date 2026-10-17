# Architecture

CloudLaunch uses one Node.js service to serve the React production build and a JSON REST API. A same-origin deployment avoids cross-origin API configuration. Vite proxies `/api` in development.

## Runtime flow

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Express
    participant PostgreSQL
    User->>React: Edit a project
    React->>Express: PATCH /api/projects/:id + workspace password
    Express->>Express: Validate input and authorize
    Express->>PostgreSQL: BEGIN; SELECT FOR UPDATE
    PostgreSQL-->>Express: Workspace JSONB
    Express->>PostgreSQL: UPDATE; COMMIT
    Express-->>React: Saved project
    React->>Express: GET /api/workspace
    Express-->>React: Updated counts and activity
```

## Storage

PostgreSQL stores a single workspace row in a `workspace` table in the configured `cloudlaunch` schema with `id INTEGER PRIMARY KEY` and `data JSONB NOT NULL`. Data contains projects, deployments, settings, and activity. The first startup creates the table and empty row idempotently. This is the initial schema migration; no manual SQL import is required for a new workspace.

Each mutation locks the row in a transaction so parallel service instances do not overwrite changes. This intentionally simple model suits a personal portfolio project. Activity retains the latest 30 entries; project and release data have no automatic expiration.

Without `DATABASE_URL`, development uses an ignored JSON file. Local writes are serialized, written to a temporary file, and renamed atomically. This mode supports a single process only. Production startup rejects the file fallback, avoiding data loss on ephemeral Render service storage.

## Security and operational behavior

- Production requires `DATABASE_URL` and `WORKSPACE_PASSWORD`.
- All business API routes compare the workspace password using a constant-time comparison after checking buffer lengths.
- Passwords are supplied in an HTTP header, never a query string. HTTPS is provided by Render.
- Failed attempts are limited per process. A high-volume public service should move rate limiting to shared storage and use an identity provider.
- Health reports storage availability and mode, without credentials or workspace data.
- HTTPS-only project URLs avoid executable URI schemes. React escapes user text.
- Express accepts at most 32 KB per JSON request. Names, descriptions, versions, and notes have server-side limits.
- Helmet provides baseline security headers. Content Security Policy is disabled for compatibility with the inline theme initializer and external font stylesheet; a hardened deployment should use hashes/nonces and self-hosted fonts.
- Database URLs and workspace passwords are injected by Render environment configuration. They are not built into browser assets or committed.
- The container runs as the unprivileged `node` user and handles SIGTERM gracefully.
- UI typography loads from Google Fonts, with local sans-serif fallbacks. Tech icons in the README load from Skill Icons.

## Hosting

The verified deployment is a free Render Docker web service in Singapore. Render builds the root multi-stage Dockerfile and serves the resulting container over managed HTTPS. The service uses PostgreSQL over Render’s private network and checks `/api/health` for readiness.

The owner approved reusing the existing free PostgreSQL instance. Every table reference is explicitly qualified as `cloudlaunch.workspace`, and the schema name is validated before use. The connection pool has at most three connections. TeamHub’s tables are not changed; both applications still share the instance’s capacity, database role, availability, and expiry date.

The root `render.yaml` is the source of truth for hosting and environment references. It only defines the CloudLaunch service, so it does not take over management of the existing database. The workspace password is platform-generated and the database URL is resolved through `fromDatabase`.

The original Google Cloud configuration remains an optional alternative in `scripts/deploy-gcp.sh` and `docs/google-cloud.md`. It was not deployed because Google Cloud billing activation presented a ₹15,000 payment request during setup.
