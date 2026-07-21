#!/usr/bin/env sh
set -eu

BASE_URL="${HEALTHCHECK_BASE_URL:-http://127.0.0.1:3000}"
TIMEOUT_SECONDS="${HEALTHCHECK_TIMEOUT_SECONDS:-8}"
response_file="$(mktemp "${TMPDIR:-/tmp}/nextshift-healthcheck.XXXXXX")"

cleanup() {
  rm -f "$response_file"
}
trap cleanup EXIT HUP INT TERM

status="$(
  curl \
    --silent \
    --show-error \
    --max-time "$TIMEOUT_SECONDS" \
    --output "$response_file" \
    --write-out '%{http_code}' \
    "$BASE_URL/api/v1/health"
)"

[ "$status" = "200" ] || exit 1

node - "$response_file" <<'NODE'
const fs = require('node:fs');

try {
  const body = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  if (body?.status !== 'ok' || body?.services?.database !== 'ok') {
    process.exit(1);
  }
} catch {
  process.exit(1);
}
NODE
