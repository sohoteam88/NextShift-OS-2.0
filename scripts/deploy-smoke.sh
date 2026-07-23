#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
SMOKE_STARTUP_WAIT_SECONDS="${SMOKE_STARTUP_WAIT_SECONDS:-60}"
response_file="$(mktemp "${TMPDIR:-/tmp}/nextshift-smoke.XXXXXX")"

cleanup() {
  rm -f "$response_file"
}
trap cleanup EXIT HUP INT TERM

case "$SMOKE_STARTUP_WAIT_SECONDS" in
  ''|*[!0-9]*)
    echo "Smoke check failed: SMOKE_STARTUP_WAIT_SECONDS must be a non-negative integer"
    exit 1
    ;;
esac

fail_smoke() {
  echo "Smoke check failed: $*" >&2
  if command -v docker >/dev/null 2>&1; then
    echo '---- nextshift-app logs (last 50 lines) ----' >&2
    docker logs --tail 50 nextshift-app 2>&1 || \
      echo 'Unable to read nextshift-app logs.' >&2
    echo '---- end nextshift-app logs ----' >&2
  else
    echo 'Docker is unavailable; cannot collect nextshift-app logs.' >&2
  fi
  exit 1
}

check_status() {
  path="$1"
  expected="$2"
  started_at="$(date +%s)"

  while :; do
    if status="$(curl --silent --show-error --max-time 10 --output "$response_file" --write-out '%{http_code}' "$BASE_URL$path")"; then
      if [ "$status" != "$expected" ]; then
        fail_smoke "$path returned $status, expected $expected"
      fi

      echo "Smoke check passed: $path returned $status"
      return
    fi

    now="$(date +%s)"
    elapsed=$((now - started_at))
    if [ "$elapsed" -ge "$SMOKE_STARTUP_WAIT_SECONDS" ]; then
      fail_smoke "$path did not accept connections after ${elapsed}s (startup wait limit: ${SMOKE_STARTUP_WAIT_SECONDS}s)"
    fi

    sleep 0.2
  done
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
      fail_smoke 'unknown JSON contract'
      ;;
  esac

  if ! LC_ALL=C grep -Eq "$contract_pattern" "$response_file"; then
    fail_smoke "$path did not satisfy the $contract JSON contract"
  fi
}

check_json_contract "/api/health" "liveness"
check_json_contract "/api/v1/health" "readiness"
check_status "/api/v1/version" "200"
check_status "/login" "200"

echo "Deploy smoke checks passed for $BASE_URL"
