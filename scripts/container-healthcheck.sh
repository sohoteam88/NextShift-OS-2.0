#!/usr/bin/env sh
set -eu

CANONICAL_URL='http://127.0.0.1:3000/api/v1/health'
CANONICAL_TIMEOUT_SECONDS='8'

case "$#" in
  0)
    target_url="$CANONICAL_URL"
    timeout_seconds="$CANONICAL_TIMEOUT_SECONDS"
    ;;
  2)
    # Test-only interface. The Docker HEALTHCHECK metadata never supplies arguments.
    target_url="$1"
    timeout_seconds="$2"
    ;;
  *)
    exit 2
    ;;
esac

response_file="$(mktemp "${TMPDIR:-/tmp}/nextshift-healthcheck.XXXXXX")"

cleanup() {
  rm -f "$response_file"
}
trap cleanup EXIT HUP INT TERM

status="$(
  curl \
    --silent \
    --show-error \
    --max-time "$timeout_seconds" \
    --output "$response_file" \
    --write-out '%{http_code}' \
    "$target_url"
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
