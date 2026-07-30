#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
action="${1:-}"
confirmation="${2:-}"
release_sha="${3:-}"
control_plane_ref="${4:-}"
control_plane_sha="${5:-}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

case "$action" in
  deploy)
    expected_confirmation='DEPLOY_PRODUCTION'
    evidence_stage='stage-1-3'
    ;;
  rollback)
    expected_confirmation='ROLLBACK_PRODUCTION'
    evidence_stage='stage-1-3'
    ;;
  *) fail "unsupported production action: $action" ;;
esac

[[ "$confirmation" == "$expected_confirmation" ]] || \
  fail 'confirmation does not match the selected production action'
[[ "$control_plane_ref" == 'refs/heads/main' ]] || \
  fail 'production workflow must be dispatched from refs/heads/main'
[[ "$control_plane_sha" =~ ^[0-9a-f]{40}$ ]] || \
  fail 'control-plane SHA must be a full lowercase 40-character Git SHA'
[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || \
  fail 'release SHA must be a full lowercase 40-character Git SHA'

git fetch --no-tags origin '+refs/heads/main:refs/remotes/origin/main'
current_main_sha="$(git rev-parse 'refs/remotes/origin/main^{commit}')"
[[ "$current_main_sha" == "$control_plane_sha" ]] || \
  fail 'main changed after dispatch; create a new production request'

resolved_release_sha="$(git rev-parse "$release_sha^{commit}")"
[[ "$resolved_release_sha" == "$release_sha" ]] || \
  fail 'release SHA did not resolve to the exact requested commit'
git merge-base --is-ancestor "$release_sha" refs/remotes/origin/main || \
  fail 'release SHA is not contained in origin/main'

approval_validator="$repo_root/scripts/deployment/validate-final-release-approval.sh"
[[ -f "$approval_validator" && ! -L "$approval_validator" && -x "$approval_validator" ]] || \
  fail 'Final Release Approval validator must be an executable, non-symlink file'
"$approval_validator" "$action" "$release_sha" "$evidence_stage"

printf 'PASS: production request is bound to main control plane %s and release %s\n' \
  "$control_plane_sha" "$release_sha"
