#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd -P)"
validator="$repo_root/scripts/deployment/os39/validate-production-readiness-evidence.sh"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/nextshift-os39-readiness.XXXXXX")"
pass_count=0

cleanup() { rm -rf "$fixture_root"; }
trap cleanup EXIT
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
pass() { pass_count=$((pass_count + 1)); printf 'PASS: %s\n' "$1"; }

write_evidence() {
  printf '%s\n' \
    "MIGRATION_REHEARSAL=$1" \
    "MIGRATION_IMAGE_REHEARSAL=$2" \
    "REHEARSAL_IMAGE_ID=$3" \
    'REHEARSAL_IMAGE_ID_SCOPE=ENGINE_LOCAL_REHEARSAL_ONLY_NO_CROSS_BUILD_COMPARISON' >"$fixture_root/evidence.md"
}

expect_accept() {
  "$validator" "$1" "$fixture_root/evidence.md" >/dev/null || fail "$2 should be accepted"
  pass "$2"
}

expect_reject() {
  if "$validator" "$1" "$fixture_root/evidence.md" >/dev/null 2>&1; then
    fail "$2 should be rejected"
  fi
  pass "$2"
}

valid_digest='sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
write_evidence PASS PASS "$valid_digest"
expect_accept stage-1-3 stage_1_3_real_digest_accepted

write_evidence PENDING_STAGE_4 PENDING_STAGE_4 PENDING_STAGE_4
expect_reject stage-1-3 pending_stage_semantics_rejected

write_evidence PASS PASS 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
expect_reject stage-1-3 short_digest_rejected

[[ "$pass_count" == 3 ]] || fail "expected 3 fixtures, got $pass_count"
printf 'PASS: OS 3.9 Production Readiness evidence fixtures (%s)\n' "$pass_count"
