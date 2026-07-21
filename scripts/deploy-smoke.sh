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

  case "$contract" in
    liveness)
      contract_pattern='^\{"status":"ok","app":"NextShift OS","environment":"production","timestamp":"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z"\}$'
      ;;
    readiness)
      contract_pattern='^\{"status":"ok","timestamp":"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z","version":"0\.1\.0","services":\{"database":"ok"\}\}$'
      ;;
    *)
      echo "Smoke check failed: unknown JSON contract"
      exit 1
      ;;
  esac

  if ! LC_ALL=C grep -Eq "$contract_pattern" "$response_file"; then
    echo "Smoke check failed: $path did not satisfy the $contract JSON contract"
    exit 1
  fi
}

check_json_contract "/api/health" "liveness"
check_json_contract "/api/v1/health" "readiness"
check_status "/api/v1/version" "200"
check_status "/login" "200"

echo "Deploy smoke checks passed for $BASE_URL"
