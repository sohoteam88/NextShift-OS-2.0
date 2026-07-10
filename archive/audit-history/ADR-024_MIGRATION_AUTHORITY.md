# ADR-024: Migration Authority

Date: 2026-06-19
Status: Accepted
Decision: Prisma Authority

## Context

E1 identified that both migration trees exist:

- `prisma/migrations`
- `supabase/migrations`

Dual active schema authorities increase drift risk and make production recovery harder.

## Decision

Prisma is the production schema authority for application tables.

## Rationale

- Runtime code uses Prisma Client as the primary application database access layer.
- `prisma/schema.prisma` is the canonical app schema.
- Dockerfile runs `npx prisma generate`.
- Existing production deploy workflows already include Prisma commands in scripts.
- Prisma schema validation passes.

## Supabase Migration Boundary

Supabase migrations are no longer the authority for application table evolution.

Allowed Supabase migration scope:

- Supabase platform-only features.
- RLS/policy changes if the app explicitly adopts them.
- Extensions or database features not represented by Prisma.

Any Supabase migration must reference the Prisma migration or ADR that justifies it.

## Production Rule

Application schema changes must follow:

```text
Prisma schema change
-> Prisma migration
-> code review
-> prisma migrate deploy
```

Do not apply ad hoc SQL directly to production for app tables.

## Drift Control

Before production deploy:

```bash
pnpm exec prisma validate
pnpm exec prisma migrate status
```

For incident recovery:

```bash
pnpm exec prisma migrate diff
```

## Existing Supabase Migrations

Existing `supabase/migrations` are retained as historical artifacts. They must not be extended for application table changes unless a future ADR changes this authority decision.

## Success Criteria

Single schema authority is defined: Prisma.

## Final Decision

READY FOR E2
