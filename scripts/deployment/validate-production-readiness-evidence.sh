#!/usr/bin/env bash
set -euo pipefail

stage="${1:-}"
evidence="${2:-}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

control_value() {
  local file="$1" key="$2" count
  count="$(grep -Ec "^${key}=" "$file" || true)"
  [[ "$count" == 1 ]] || fail "$key must occur exactly once"
  grep -E "^${key}=" "$file" | cut -d= -f2-
}

case "$stage" in
  stage-1-3 | stage-4) ;;
  *) fail 'readiness evidence stage must be explicitly set to stage-1-3 or stage-4' ;;
esac

[[ -f "$evidence" && ! -L "$evidence" ]] || \
  fail 'Production Readiness evidence must be a regular, non-symlink file'

migration_rehearsal="$(control_value "$evidence" MIGRATION_REHEARSAL)"
migration_image_rehearsal="$(control_value "$evidence" MIGRATION_IMAGE_REHEARSAL)"
migration_image_digest="$(control_value "$evidence" MIGRATION_IMAGE_DIGEST)"

case "$stage" in
  stage-1-3)
    [[ "$migration_rehearsal" == 'PENDING_STAGE_4' ]] || \
      fail 'Stage 1-3 migration rehearsal evidence must be PENDING_STAGE_4'
    [[ "$migration_image_rehearsal" == 'PENDING_STAGE_4' ]] || \
      fail 'Stage 1-3 migration image rehearsal evidence must be PENDING_STAGE_4'
    [[ "$migration_image_digest" == 'PENDING_STAGE_4' ]] || \
      fail 'Stage 1-3 migration image digest evidence must be PENDING_STAGE_4'
    ;;
  stage-4)
    [[ "$migration_rehearsal" == 'PASS' ]] || \
      fail 'Stage 4 migration rehearsal evidence is not PASS'
    [[ "$migration_image_rehearsal" == 'PASS' ]] || \
      fail 'Stage 4 migration image rehearsal evidence is not PASS'
    [[ "$migration_image_digest" =~ ^sha256:[0-9a-f]{64}$ ]] || \
      fail 'Stage 4 migration image digest evidence is invalid'
    ;;
esac

printf 'PASS: Production Readiness migration evidence matches explicit %s state\n' "$stage"
