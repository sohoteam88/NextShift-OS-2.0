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

[[ "$stage" == stage-1-3 ]] || fail 'OS 3.9 readiness evidence is validated only before dispatch'

[[ -f "$evidence" && ! -L "$evidence" ]] || \
  fail 'Production Readiness evidence must be a regular, non-symlink file'

migration_rehearsal="$(control_value "$evidence" MIGRATION_REHEARSAL)"
migration_image_rehearsal="$(control_value "$evidence" MIGRATION_IMAGE_REHEARSAL)"
rehearsal_image_id="$(control_value "$evidence" REHEARSAL_IMAGE_ID)"
rehearsal_image_id_scope="$(control_value "$evidence" REHEARSAL_IMAGE_ID_SCOPE)"

[[ "$migration_rehearsal" == PASS ]] || fail 'migration rehearsal evidence is not PASS'
[[ "$migration_image_rehearsal" == PASS ]] || fail 'migration image rehearsal evidence is not PASS'
[[ "$rehearsal_image_id" =~ ^sha256:[0-9a-f]{64}$ ]] || fail 'rehearsal image ID is invalid'
[[ "$rehearsal_image_id_scope" == 'ENGINE_LOCAL_REHEARSAL_ONLY_NO_CROSS_BUILD_COMPARISON' ]] || \
  fail 'rehearsal image ID must be explicitly engine-local and non-comparable across builds'

printf 'PASS: OS 3.9 readiness records a passed migration rehearsal without cross-build digest authority\n'
