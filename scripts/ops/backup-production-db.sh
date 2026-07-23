#!/usr/bin/env bash
set -euo pipefail

backup_dir='/home/deploy/backups'
environment_file='/home/deploy/nextshift/.env.production'
log_file="$backup_dir/backup.log"
manifest_file="$backup_dir/SHA256SUMS"
minimum_free_kb=$((2 * 1024 * 1024))
image_ref="${1:-}"

timestamp() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { printf '%s %s\n' "$(timestamp)" "$*" >>"$log_file"; }
fail() { log "FAIL: $*"; exit 1; }

mkdir -p "$backup_dir" || exit 1
touch "$log_file" || exit 1
[[ -n "$image_ref" ]] || fail 'usage: backup-production-db.sh nextshift-migrations:<exact-release-sha>'
[[ -f "$environment_file" && ! -L "$environment_file" ]] || fail "missing regular env file: $environment_file"
docker image inspect "$image_ref" >/dev/null 2>&1 || fail "migration image is unavailable: $image_ref"

available_kb="$(df -Pk "$backup_dir" | awk 'NR == 2 {print $4}')"
[[ "$available_kb" =~ ^[0-9]+$ && "$available_kb" -ge "$minimum_free_kb" ]] || \
  fail "insufficient disk space: required_kb=$minimum_free_kb actual_kb=${available_kb:-unknown}"

backup_file="$backup_dir/nextshift-$(date -u +%Y%m%d-%H%M%S).dump"
temporary_file="$backup_file.partial"
trap 'rm -f "$temporary_file"' EXIT

set +e
docker run --rm --env-file "$environment_file" --entrypoint bash "$image_ref" -c '
  set +x
  connection="${DIRECT_URL:-${DATABASE_URL:-}}"
  [[ -n "$connection" ]] || exit 64
  [[ "$connection" != *":6543"* ]] || exit 65
  exec pg_dump --format=custom --compress=9 --no-owner --no-privileges "$connection"
' >"$temporary_file" 2>/dev/null
backup_exit_code=$?
set -e
if (( backup_exit_code != 0 )); then
  fail "pg_dump failed exit_code=$backup_exit_code image=$image_ref (connection details redacted)"
fi
mv "$temporary_file" "$backup_file"
sha256="$(sha256sum "$backup_file" | awk '{print $1}')"
printf '%s  %s\n' "$sha256" "$(basename "$backup_file")" >>"$manifest_file"
find "$backup_dir" -maxdepth 1 -type f -name 'nextshift-*.dump' -mtime +13 -delete
log "SUCCESS: backup=$(basename "$backup_file") sha256=$sha256 image=$image_ref"
