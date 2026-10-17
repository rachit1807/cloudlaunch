#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${RENDER_SERVICE_ID:?Set RENDER_SERVICE_ID}"
: "${RENDER_API_KEY:?Set RENDER_API_KEY securely in your shell}"
command -v node >/dev/null || { echo 'Node.js 24 is required.' >&2; exit 1; }
command -v npm >/dev/null || { echo 'npm is required.' >&2; exit 1; }
npm ci
npm test
npm run build
node scripts/deploy-render.mjs
