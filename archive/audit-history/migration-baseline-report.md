# E3A Migration Baseline Report

Date: 2026-06-19
Status: PASS WITH OPERATIONAL WARNING

## Objective

Resolve E3 migration readiness blocker by checking Prisma migration status against the release database and verifying whether unapplied migrations remain.

## Scope

This was a read-only migration readiness check. No production database migration was executed and no production data was modified.

## Authority

Migration authority remains ADR-024:

- Prisma is the application schema authority.
- Release deploy must use reviewed Prisma migrations.
- `prisma migrate status` must be clean before `prisma migrate deploy`.

## Supabase Change Review

Supabase changelog was checked on 2026-06-19. Relevant notes:

- Postgres 14 support deprecation is upcoming on 2026-07-01.
- Data API exposure behavior for new tables changed in 2026-04.
- Recent self-hosted Supabase breaking changes do not apply to the managed Supabase release DB used by this app.

No changelog item blocked the Prisma release DB status check.

## Release DB Check

Initial container command:

```text
npx prisma migrate status
```

Result:

- Failed because `npx` installed Prisma 7.8.0.
- Prisma 7 no longer accepts `url` and `directUrl` inside `schema.prisma`.
- This was a CLI version drift issue, not a database migration failure.

Corrected command:

```text
npx prisma@6.19.3 migrate status
```

Result:

```text
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-ap-southeast-1.pooler.supabase.com:5432"

3 migrations found in prisma/migrations

Database schema is up to date!
```

## Migration Table Evidence

The release database `_prisma_migrations` table contains all repository migrations:

| Migration | Status |
| --- | --- |
| `20260612110000_mission_engine_core` | finished, not rolled back |
| `20260612130000_video_project_engine` | finished, not rolled back |
| `20260612190000_brand_profile_canonical` | finished, not rolled back |

## Unapplied Migration Resolution

E3 previously saw unapplied migrations on a local non-production test DB that had been initialized with `prisma db push`. That did not represent release DB state.

E3A release DB status confirms:

- No unapplied repository migrations remain on the release DB.
- No rolled-back migration was detected.
- The E3 migration blocker is resolved for the current release DB.

## Operational Warning

The production container does not include a local Prisma CLI binary. Running unpinned `npx prisma` can pull Prisma 7 and produce a false validation failure.

Release procedure must pin the CLI version:

```text
npx prisma@6.19.3 migrate status
npx prisma@6.19.3 migrate deploy
```

or ship the matching Prisma CLI in the release image/tooling.

## Final Decision

PASS WITH OPERATIONAL WARNING.

The migration baseline is clean on the release DB. The remaining action is to make Prisma CLI version pinning part of the deployment runbook/tooling.
