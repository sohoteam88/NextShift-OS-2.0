# ADR-E2 — Persist `Content.updatedAt`

Status: Accepted by Steven on 2026-07-15

## Context

The canonical `Content` model persisted `createdAt` but not a last-modified timestamp. E1 therefore had to display a server-confirmation time for PATCH responses and could not make a durable claim after refresh. E2 requires saved drafts to be ordered by their actual last change and to display that same persisted time. `createdAt` cannot satisfy that acceptance criterion.

## Decision

Add this Prisma field:

```prisma
updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
```

Migration `20260715220949_add_content_updated_at` performs an additive sequence:

1. add `updated_at` as nullable and without a default;
2. backfill every existing row from its own `created_at`;
3. set `DEFAULT CURRENT_TIMESTAMP` and `NOT NULL`;
4. add `(tenant_id, owner_id, updated_at, id)` and `(tenant_id, updated_at, id)` indexes.

Library queries order by `updatedAt DESC, id DESC`. Prisma updates `updatedAt` automatically for subsequent PATCH operations. E1 generation and refresh now return the database value, and PATCH clients use the server-returned value.

## Compatibility and rollback

- Existing rows retain their historical creation time as the initial update time rather than appearing newly changed at migration execution.
- Existing inserts remain compatible because the database default supplies a value.
- Existing reads remain compatible because the change is additive.
- Application rollback may ignore the new column while leaving it in place; destructive rollback is intentionally not supplied because dropping user-history data is outside this authorization.
- Both member and tenant-manager Library query shapes receive an index aligned to their ownership prefix and deterministic sort keys.

## Deployment boundary

This migration file is reviewed and locally validated by E2. Its existence is not authorization to apply it to production. Production migration and deployment require a separate explicit release action.
