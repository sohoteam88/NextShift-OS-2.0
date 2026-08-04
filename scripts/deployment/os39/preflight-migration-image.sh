#!/usr/bin/env bash
# Rehearse the exact release's migration image locally; its ID is evidence only.
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
  fail 'rehearsal image tag already exists; remove it deliberately before retrying'
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
[[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] || fail 'rehearsal migration image ID is invalid'
revision="$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$image")"
[[ "$revision" == "$release_sha" ]] || fail 'rehearsal migration image revision mismatch'
"$repo_root/scripts/deployment/validate-migration-image-runtime.sh" "$image" "$release_sha" >/dev/null
printf 'REHEARSAL_RELEASE_SHA=%s\nREHEARSAL_IMAGE_ID=%s\nREHEARSAL_IMAGE_ID_SCOPE=ENGINE_LOCAL_REHEARSAL_ONLY_NO_CROSS_BUILD_COMPARISON\n' \
  "$release_sha" "$digest"
