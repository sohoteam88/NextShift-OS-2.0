#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" != 2 ]]; then
  printf 'Usage: %s IMAGE EXPECTED_HEAD_SHA\n' "$0" >&2
  exit 2
fi

image="$1"
expected_head_sha="$2"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
mock_server="$repo_root/scripts/deployment/tests/fixtures/health-mock-server.mjs"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/nextshift-application-image-health.XXXXXX")"
server_pid=''

cleanup_server() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" >/dev/null 2>&1 || true
    wait "$server_pid" 2>/dev/null || true
    server_pid=''
  fi
}

cleanup() {
  cleanup_server
  rm -rf "$fixture_root"
}
trap cleanup EXIT HUP INT TERM

print_server_log() {
  local server_log="$fixture_root/server.log"

  [[ -e "$server_log" ]] || return 0
  if [[ ! -f "$server_log" || -L "$server_log" ]]; then
    printf '%s\n' '--- mock server log unavailable: expected a regular file ---' >&2
    return 0
  fi

  printf '%s\n' '--- mock server log (stdout/stderr) ---' >&2
  sed -n '1,$p' "$server_log" >&2 || \
    printf '%s\n' '--- mock server log could not be read ---' >&2
  printf '%s\n' '--- end mock server log ---' >&2
}

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  print_server_log
  exit 1
}

[[ "$expected_head_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'expected head must be a lowercase 40-character SHA'
[[ -f "$mock_server" && ! -L "$mock_server" ]] || fail 'mock server fixture must be a regular non-symlink file'

image_id="$(docker image inspect --format '{{.Id}}' "$image")"
[[ "$image_id" =~ ^sha256:[0-9a-f]{64}$ ]] || fail 'final application image ID is not an immutable sha256 digest'
[[ "$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$image")" == "$expected_head_sha" ]] || \
  fail 'final application image revision does not match the exact head'
[[ "$(docker image inspect --format '{{.Config.User}}' "$image")" == 'nextjs' ]] || \
  fail 'final application image must run as the reviewed nextjs user'
[[ "$(docker image inspect --format '{{json .Config.Healthcheck.Test}}' "$image")" == \
  '["CMD","/usr/local/bin/nextshift-container-healthcheck"]' ]] || \
  fail 'final image Healthcheck metadata must execute only the canonical script'

docker run --rm --network none --entrypoint /bin/sh "$image" -ceu '
  test "$(id -u)" = 1001
  test -f /usr/local/bin/nextshift-container-healthcheck
  test ! -L /usr/local/bin/nextshift-container-healthcheck
  test -x /usr/local/bin/nextshift-container-healthcheck
  command -v curl >/dev/null
  command -v node >/dev/null
' || fail 'final image runtime healthcheck authority is incomplete or not executable by final USER'

start_server() {
  local scenario="$1"
  local control_file="$fixture_root/server-url"
  local elapsed_milliseconds=0
  local poll_interval_milliseconds=200
  local timeout_milliseconds=30000

  cleanup_server
  rm -f "$control_file"
  node "$mock_server" "$control_file" "$scenario" 0.0.0.0 >"$fixture_root/server.log" 2>&1 &
  server_pid=$!

  while [[ ! -s "$control_file" ]]; do
    kill -0 "$server_pid" >/dev/null 2>&1 || fail "mock server exited for scenario $scenario"
    if (( elapsed_milliseconds >= timeout_milliseconds )); then
      fail "mock server did not publish a URL after ${elapsed_milliseconds}ms (timeout ${timeout_milliseconds}ms) for scenario $scenario"
    fi
    sleep 0.2
    elapsed_milliseconds=$((elapsed_milliseconds + poll_interval_milliseconds))
  done

  [[ -s "$control_file" && ! -L "$control_file" ]] || fail 'mock server did not publish a URL'
  host_url="$(<"$control_file")"
  [[ "$host_url" =~ ^http://127\.0\.0\.1:([0-9]+)$ ]] || fail 'mock server returned an unsafe URL'
  container_url="http://host.docker.internal:${BASH_REMATCH[1]}/api/v1/health"
}

run_healthcheck() {
  docker run --rm \
    --add-host host.docker.internal:host-gateway \
    "$image" \
    /usr/local/bin/nextshift-container-healthcheck \
    "$container_url" \
    1 >/dev/null 2>&1
}

expect_accept() {
  local scenario="$1"
  start_server "$scenario"
  run_healthcheck || fail "final image healthcheck rejected $scenario"
}

expect_reject() {
  local scenario="$1"
  start_server "$scenario"
  if run_healthcheck; then
    fail "final image healthcheck accepted $scenario"
  fi
}

expect_accept readiness-ok
expect_reject readiness-503
expect_reject readiness-degraded
expect_reject readiness-database-error
expect_reject malformed
expect_reject timeout

start_server readiness-ok
closed_container_url="$container_url"
cleanup_server
container_url="$closed_container_url"
if run_healthcheck; then
  fail 'final image healthcheck accepted a connection failure'
fi

printf 'PASS: exact_head_application_image_healthcheck_contract\n'
printf 'IMAGE_ID=%s\n' "$image_id"
printf 'HEALTHCHECK=%s\n' '["CMD","/usr/local/bin/nextshift-container-healthcheck"]'
