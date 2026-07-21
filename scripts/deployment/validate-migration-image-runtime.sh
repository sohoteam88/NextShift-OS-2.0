#!/usr/bin/env bash
set -euo pipefail

image="${1:-}"
expected_revision="${2:-}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[[ -n "$image" ]] || fail 'migration image reference is required'
[[ "$expected_revision" =~ ^[0-9a-f]{40}$ ]] || \
  fail 'expected revision must be a full lowercase 40-character Git SHA'

image_id="$(docker image inspect --format '{{.Id}}' "$image")"
[[ "$image_id" =~ ^sha256:[0-9a-f]{64}$ ]] || fail 'migration image ID is not a SHA-256 digest'

revision="$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$image")"
bash_label="$(docker image inspect --format '{{ index .Config.Labels "com.nextshift.migration.bash" }}' "$image")"
psql_label="$(docker image inspect --format '{{ index .Config.Labels "com.nextshift.migration.psql" }}' "$image")"
pnpm_label="$(docker image inspect --format '{{ index .Config.Labels "com.nextshift.migration.pnpm" }}' "$image")"
prisma_label="$(docker image inspect --format '{{ index .Config.Labels "com.nextshift.migration.prisma" }}' "$image")"
entrypoint="$(docker image inspect --format '{{json .Config.Entrypoint}}' "$image")"
image_environment="$(docker image inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$image")"

[[ "$revision" == "$expected_revision" ]] || fail 'migration image revision does not match the exact Git head'
[[ "$bash_label" == '5.3.9-r1' ]] || fail 'migration Bash OCI label mismatch'
[[ "$psql_label" == '17.10-r0' ]] || fail 'migration psql OCI label mismatch'
[[ "$pnpm_label" == '10.24.0' ]] || fail 'migration pnpm OCI label mismatch'
[[ "$prisma_label" == '6.19.3' ]] || fail 'migration Prisma OCI label mismatch'
[[ "$entrypoint" == '["/usr/bin/env","bash","/app/scripts/deployment/run-os38-production-migrations.sh"]' ]] || \
  fail 'migration image entrypoint drift'

if grep -Eq '^(DATABASE_URL|DIRECT_URL|SOURCE_DB_URL|SUPABASE_DB_URL|PGPASSWORD)=' <<<"$image_environment"; then
  fail 'migration image contains a database credential environment variable'
fi

docker run --rm --network none --entrypoint /bin/sh "$image" -ceu '
  test "$(apk info -v | grep -Fx "bash-5.3.9-r1")" = "bash-5.3.9-r1"
  test "$(apk info -v | grep -Fx "postgresql17-client-17.10-r0")" = "postgresql17-client-17.10-r0"
  test "$(psql --version)" = "psql (PostgreSQL) 17.10"
  test "$(pnpm --version)" = "10.24.0"
  test "$(./node_modules/.bin/prisma --version | awk '\''/prisma[[:space:]]*:/ {print $3; exit}'\'')" = "6.19.3"
  test -x /app/scripts/deployment/run-os38-production-migrations.sh
'

printf 'PASS: migration_image_builds_from_exact_head\n'
printf 'PASS: installed_bash_matches_oci_label\n'
printf 'PASS: installed_psql_matches_oci_label\n'
printf 'PASS: migration_image_revision_matches_exact_head\n'
printf 'PASS: migration_image_build_does_not_run_migration\n'
printf 'PASS: migration_image_build_requires_no_database_secret\n'
printf 'IMAGE_ID=%s\n' "$image_id"
