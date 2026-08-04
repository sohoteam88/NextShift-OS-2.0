#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
action="${1:-}"
confirmation="${2:-}"
target="${3:-}"
control_plane_ref="${4:-}"
control_plane_sha="${5:-}"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

case "$action" in
  deploy) expected_confirmation='DEPLOY_PRODUCTION' ;;
  rollback) expected_confirmation='ROLLBACK_PRODUCTION' ;;
  *) fail "unsupported production action: $action" ;;
esac

[[ "$confirmation" == "$expected_confirmation" ]] || fail 'confirmation does not match the selected production action'
[[ "$control_plane_ref" == 'refs/heads/main' ]] || fail 'production workflow must be dispatched from refs/heads/main'
[[ "$control_plane_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'control-plane SHA must be a full lowercase 40-character Git SHA'

git -C "$repo_root" fetch --no-tags origin '+refs/heads/main:refs/remotes/origin/main'
[[ "$(git -C "$repo_root" rev-parse refs/remotes/origin/main)" == "$control_plane_sha" ]] || \
  fail 'main changed after dispatch; create a new production request'

if [[ "$action" == deploy ]]; then
  [[ "$target" =~ ^[0-9a-f]{40}$ ]] || fail 'deploy target must be a full lowercase 40-character Git SHA'
  [[ "$(git -C "$repo_root" rev-parse "$target^{commit}" 2>/dev/null || true)" == "$target" ]] || \
    fail 'deploy SHA did not resolve to the exact requested commit'
  git -C "$repo_root" merge-base --is-ancestor "$target" refs/remotes/origin/main || \
    fail 'deploy SHA is not contained in origin/main'
else
  [[ "$target" =~ ^nextshift-app:[a-z0-9][a-z0-9._-]{0,127}$ ]] || \
    fail 'rollback target must be the exact authorized nextshift-app tag'
fi

approval_validator="$repo_root/scripts/deployment/os39/validate-final-release-approval.sh"
[[ -f "$approval_validator" && ! -L "$approval_validator" && -x "$approval_validator" ]] || \
  fail 'OS 3.9 Final Release Approval validator must be an executable, non-symlink file'
"$approval_validator" "$action" "$target" stage-1-3

printf 'PASS: OS 3.9 production request is bound to main control plane %s and %s target %s\n' \
  "$control_plane_sha" "$action" "$target"
