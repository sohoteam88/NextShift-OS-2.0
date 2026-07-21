#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
healthcheck="$repo_root/scripts/container-healthcheck.sh"
deploy_smoke="$repo_root/scripts/deploy-smoke.sh"
mock_server="$repo_root/scripts/deployment/tests/fixtures/health-mock-server.mjs"
app_dockerfile="$repo_root/Dockerfile"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/nextshift-health-readiness.XXXXXX")"
server_pid=''
pass_count=0

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

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

pass() {
  pass_count=$((pass_count + 1))
  printf 'PASS: %s\n' "$1"
}

for contract_file in "$healthcheck" "$deploy_smoke" "$mock_server" "$app_dockerfile"; do
  [[ -f "$contract_file" && ! -L "$contract_file" ]] || fail "unsafe contract file: $contract_file"
done

[[ "$(grep -Fc 'COPY scripts/container-healthcheck.sh /usr/local/bin/nextshift-container-healthcheck' "$app_dockerfile")" == 1 ]] || \
  fail 'application image must copy the canonical healthcheck script exactly once'
[[ "$(grep -Fc 'HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD ["/usr/local/bin/nextshift-container-healthcheck"]' "$app_dockerfile")" == 1 ]] || \
  fail 'Docker HEALTHCHECK must execute the canonical readiness contract'
pass docker_healthcheck_uses_readiness_contract

start_server() {
  local scenario="$1"
  local control_file="$fixture_root/server-url"

  cleanup_server
  rm -f "$control_file"
  node "$mock_server" "$control_file" "$scenario" >"$fixture_root/server.log" 2>&1 &
  server_pid=$!

  for _ in {1..50}; do
    [[ -s "$control_file" ]] && break
    kill -0 "$server_pid" >/dev/null 2>&1 || fail "mock server exited for scenario $scenario"
    sleep 0.05
  done

  [[ -s "$control_file" && ! -L "$control_file" ]] || fail 'mock server did not publish a URL'
  BASE_URL="$(<"$control_file")"
  [[ "$BASE_URL" =~ ^http://127\.0\.0\.1:[0-9]+$ ]] || fail 'unsafe mock server URL'
}

expect_health_accept() {
  local name="$1"
  HEALTHCHECK_BASE_URL="$BASE_URL" HEALTHCHECK_TIMEOUT_SECONDS=1 "$healthcheck" >/dev/null 2>&1 || \
    fail "$name should be accepted"
  pass "$name"
}

expect_health_reject() {
  local name="$1"
  if HEALTHCHECK_BASE_URL="$BASE_URL" HEALTHCHECK_TIMEOUT_SECONDS=1 "$healthcheck" >/dev/null 2>&1; then
    fail "$name should be rejected"
  fi
  pass "$name"
}

start_server readiness-503
expect_health_reject container_health_rejects_503

start_server readiness-degraded
expect_health_reject container_health_rejects_200_degraded

start_server malformed
expect_health_reject container_health_rejects_malformed_json

start_server readiness-ok
expect_health_accept container_health_accepts_200_database_ok

start_server timeout
expect_health_reject container_health_rejects_timeout

start_server readiness-ok
closed_url="$BASE_URL"
cleanup_server
BASE_URL="$closed_url"
expect_health_reject container_health_rejects_connection_failure

start_server readiness-degraded
if BASE_URL="$BASE_URL" "$deploy_smoke" >/dev/null 2>&1; then
  fail 'deploy_smoke_rejects_database_degraded should be rejected'
fi
pass deploy_smoke_rejects_database_degraded

start_server readiness-ok
BASE_URL="$BASE_URL" "$deploy_smoke" >/dev/null 2>&1 || \
  fail 'deploy_smoke_accepts_healthy_contract should be accepted'
pass deploy_smoke_accepts_healthy_contract

[[ "$pass_count" == 9 ]] || fail "expected 9 named fixtures, got $pass_count"
printf 'PASS: %s health/readiness contract fixtures\n' "$pass_count"
