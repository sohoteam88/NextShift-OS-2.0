#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
response_file="$(mktemp "${TMPDIR:-/tmp}/nextshift-smoke.XXXXXX")"

cleanup() {
  rm -f "$response_file"
}
trap cleanup EXIT HUP INT TERM

check_status() {
  path="$1"
  expected="$2"
  status="$(curl --silent --show-error --max-time 10 --output "$response_file" --write-out '%{http_code}' "$BASE_URL$path")"

  if [ "$status" != "$expected" ]; then
    echo "Smoke check failed: $path returned $status, expected $expected"
    exit 1
  fi

  echo "Smoke check passed: $path returned $status"
}

check_json_contract() {
  path="$1"
  contract="$2"
  check_status "$path" "200"

  if ! node - "$response_file" "$contract" <<'NODE'
const fs = require('node:fs');

try {
  const body = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const contract = process.argv[3];
  const valid = body?.status === 'ok'
    && (contract !== 'readiness' || body?.services?.database === 'ok');
  process.exit(valid ? 0 : 1);
} catch {
  process.exit(1);
}
NODE
  then
    echo "Smoke check failed: $path did not satisfy the $contract JSON contract"
    exit 1
  fi
}

check_json_contract "/api/health" "liveness"
check_json_contract "/api/v1/health" "readiness"
check_status "/api/v1/version" "200"
check_status "/login" "200"

echo "Deploy smoke checks passed for $BASE_URL"
