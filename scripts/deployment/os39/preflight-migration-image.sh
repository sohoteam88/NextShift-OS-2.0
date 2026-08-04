#!/usr/bin/env bash
# Build the exact release's migration image locally and print its engine-local ID.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
release_sha="${1:-}"
image=''

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'release SHA must be a full lowercase Git SHA'
[[ "$(git -C "$repo_root" rev-parse HEAD)" == "$release_sha" ]] || \
  fail 'preflight must run from the exact release SHA checkout'
git -C "$repo_root" diff --quiet || fail 'preflight requires a clean worktree'
git -C "$repo_root" diff --cached --quiet || fail 'preflight requires a clean index'

image="nextshift-migrations:preflight-$release_sha"
docker image inspect "$image" >/dev/null 2>&1 && \
  fail 'preflight image tag already exists; remove it deliberately before retrying'
cleanup() {
  [[ -n "$image" ]] && docker image rm --force "$image" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker build \
  --file "$repo_root/scripts/deployment/Dockerfile.migrations" \
  --build-arg RELEASE_SHA="$release_sha" \
  --label "org.opencontainers.image.revision=$release_sha" \
  --tag "$image" \
  "$repo_root" >/dev/null

digest="$(docker image inspect --format '{{.Id}}' "$image")"
[[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] || fail 'preflight migration image ID is invalid'
revision="$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$image")"
[[ "$revision" == "$release_sha" ]] || fail 'preflight migration image revision mismatch'
"$repo_root/scripts/deployment/validate-migration-image-runtime.sh" "$image" "$release_sha" >/dev/null
printf '%s\n' "$digest"
