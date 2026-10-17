# REST API

Base path: `/api`. JSON requests use `Content-Type: application/json`. When configured, send the shared password in the `X-Workspace-Password` header on every endpoint except `/health`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Verify database availability; returns `status` and storage mode |
| GET | `/workspace` | Return projects, deployments, settings, and recent activity |
| POST | `/projects` | Create project; returns 201 |
| PATCH | `/projects/:id` | Replace editable project fields and optional readiness checklist |
| DELETE | `/projects/:id` | Remove project and related releases; returns 204 |
| POST | `/projects/:id/releases` | Record a verified release; returns 201 |
| PATCH | `/settings` | Update workspace and owner names |

Project payload:

```json
{
  "name": "Portfolio",
  "description": "My personal website",
  "stack": "React",
  "environment": "Production",
  "url": "https://example.com",
  "checklist": [true, true, true, true]
}
```

The checklist is accepted on updates. New projects start with four unchecked items. Accepted stacks: React, Next.js, Node.js, Python, Other. Environments: Production, Preview, Development. URLs are optional until release and must use HTTPS when supplied.

Release payload:

```json
{"version":"v1.0.0","notes":"First production release"}
```

The project must have all checklist items complete and a valid live URL. Reusing the same version on one project returns 409. CloudLaunch stores the supplied release URL; it does not fetch or verify it automatically.

Settings payload: `{"name":"My workspace","owner":"Rachit Tripathi"}`.

Errors return `{"error":"Readable message"}`. Common statuses: 400 invalid input, 401 workspace password required, 404 missing project, 409 duplicate release, 429 too many failed password attempts, 500 server/storage error.
