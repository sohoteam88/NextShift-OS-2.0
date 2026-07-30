#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
validator="$repo_root/scripts/deployment/validate-production-readiness-evidence.sh"
finalizer="$repo_root/scripts/deployment/finalize-production-readiness-stage4.sh"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/nextshift-readiness-evidence-stage.XXXXXX")"
pass_count=0

cleanup() {
  rm -rf "$fixture_root"
}
trap cleanup EXIT

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

pass() {
  pass_count=$((pass_count + 1))
  printf 'PASS: %s\n' "$1"
}

write_evidence() {
  local migration_rehearsal="$1"
  local migration_image_rehearsal="$2"
  local migration_image_digest="$3"
  printf '%s\n' \
    "MIGRATION_REHEARSAL=$migration_rehearsal" \
    "MIGRATION_IMAGE_REHEARSAL=$migration_image_rehearsal" \
    "MIGRATION_IMAGE_DIGEST=$migration_image_digest" >"$fixture_root/evidence.md"
}

expect_accept() {
  local name="$1" stage="$2"
  "$validator" "$stage" "$fixture_root/evidence.md" >/dev/null || \
    fail "$name should be accepted"
  pass "$name"
}

expect_reject() {
  local name="$1" stage="$2"
  if "$validator" "$stage" "$fixture_root/evidence.md" >/dev/null 2>&1; then
    fail "$name should be rejected"
  fi
  pass "$name"
}

write_evidence PENDING_STAGE_4 PENDING_STAGE_4 PENDING_STAGE_4
expect_accept stage_1_3_pending_evidence_accepted stage-1-3
expect_reject stage_4_pending_evidence_rejected stage-4

write_evidence PASS PASS \
  sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
expect_reject stage_1_3_unproven_real_values_rejected stage-1-3
expect_accept stage_4_real_evidence_accepted stage-4

write_evidence PASS PASS \
  sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
expect_reject stage_4_short_digest_rejected stage-4

write_evidence PENDING_STAGE_4 PENDING_STAGE_4 PENDING_STAGE_4
pending_sha="$(shasum -a 256 "$fixture_root/evidence.md" | awk '{print $1}')"
printf '%s\n' \
  'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' \
  >"$fixture_root/migration-image-digest.txt"
"$finalizer" \
  "$fixture_root/evidence.md" \
  "$fixture_root/migration-image-digest.txt" \
  "$fixture_root/stage4-evidence.md" \
  "$validator" >/dev/null
[[ "$(shasum -a 256 "$fixture_root/evidence.md" | awk '{print $1}')" == "$pending_sha" ]] || \
  fail 'Stage 4 finalizer changed immutable pending evidence'
grep -Fxq 'MIGRATION_REHEARSAL=PASS' "$fixture_root/stage4-evidence.md" || \
  fail 'Stage 4 finalizer did not record migration rehearsal PASS'
grep -Fxq 'MIGRATION_IMAGE_REHEARSAL=PASS' "$fixture_root/stage4-evidence.md" || \
  fail 'Stage 4 finalizer did not record migration image rehearsal PASS'
grep -Fxq \
  'MIGRATION_IMAGE_DIGEST=sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' \
  "$fixture_root/stage4-evidence.md" || fail 'Stage 4 finalizer did not record exact migration digest'
pass stage_4_finalizer_preserves_pending_and_emits_real_evidence

[[ "$pass_count" == 6 ]] || fail "expected 6 fixtures, got $pass_count"
printf 'PASS: Production Readiness evidence stage fixtures (%s)\n' "$pass_count"
