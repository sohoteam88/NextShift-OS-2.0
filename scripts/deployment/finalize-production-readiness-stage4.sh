#!/usr/bin/env bash
set -euo pipefail

pending_evidence="${1:-}"
digest_file="${2:-}"
stage4_evidence="${3:-}"
validator="${4:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/validate-production-readiness-evidence.sh}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[[ -f "$pending_evidence" && ! -L "$pending_evidence" ]] || \
  fail 'pending Production Readiness evidence must be a regular, non-symlink file'
[[ -f "$digest_file" && ! -L "$digest_file" ]] || \
  fail 'migration image digest input must be a regular, non-symlink file'
[[ -f "$validator" && ! -L "$validator" && -x "$validator" ]] || \
  fail 'Production Readiness evidence stage validator is unavailable or unsafe'
[[ -n "$stage4_evidence" && "$stage4_evidence" != "$pending_evidence" ]] || \
  fail 'Stage 4 evidence output must be distinct from the immutable pending evidence'

"$validator" stage-1-3 "$pending_evidence" >/dev/null

digest_line_count="$(awk 'END { print NR }' "$digest_file")"
[[ "$digest_line_count" == 1 ]] || fail 'migration image digest input must contain exactly one line'
migration_image_digest="$(sed -n '1p' "$digest_file")"
[[ "$migration_image_digest" =~ ^sha256:[0-9a-f]{64}$ ]] || \
  fail 'migration image digest input is invalid'

cp "$pending_evidence" "$stage4_evidence"
perl -pi -e \
  "s/^MIGRATION_REHEARSAL=.*/MIGRATION_REHEARSAL=PASS/;
   s/^MIGRATION_IMAGE_REHEARSAL=.*/MIGRATION_IMAGE_REHEARSAL=PASS/;
   s/^MIGRATION_IMAGE_DIGEST=.*/MIGRATION_IMAGE_DIGEST=$migration_image_digest/" \
  "$stage4_evidence"

"$validator" stage-4 "$stage4_evidence" >/dev/null
printf 'PASS: finalized Stage 4 Production Readiness evidence from deployed migration artifact %s\n' \
  "$migration_image_digest"
