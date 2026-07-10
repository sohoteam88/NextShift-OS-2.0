#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"

check_status() {
  path="$1"
  expected="$2"
  status="$(curl -sS -o /tmp/nextshift-smoke-response -w '%{http_code}' "$BASE_URL$path")"

  if [ "$status" != "$expected" ]; then
    echo "Smoke check failed: $path returned $status, expected $expected"
    cat /tmp/nextshift-smoke-response || true
    exit 1
  fi

  echo "Smoke check passed: $path returned $status"
}

check_json_ok() {
  path="$1"
  check_status "$path" "200"

  if ! grep -q '"status":"ok"' /tmp/nextshift-smoke-response; then
    echo "Smoke check failed: $path did not include status ok"
    cat /tmp/nextshift-smoke-response || true
    exit 1
  fi
}

check_json_ok "/api/health"
check_status "/api/v1/version" "200"
check_status "/login" "200"

echo "Deploy smoke checks passed for $BASE_URL"
