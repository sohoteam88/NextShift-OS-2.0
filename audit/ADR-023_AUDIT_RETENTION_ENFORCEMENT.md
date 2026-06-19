# ADR-023: Audit Retention Enforcement

Date: 2026-06-19
Status: Accepted
Decision: Option A - Soft-delete tenants only

## Context

D4 requires audit records to be retained for 24+ months.

Current Prisma schema has:

```prisma
AuditLog.tenant -> onDelete: Cascade
```

If tenant rows are hard-deleted, audit evidence can be destroyed by cascade. E1 flagged this as a production blocker.

## Options

### Option A: Soft-delete tenants only

Do not hard-delete tenant rows in production. Tenant lifecycle uses status changes such as `active`, `suspended`, and retained inactive/deleted states rather than physical deletion.

### Option B: Remove cascade

Change the Prisma relation and database foreign key to prevent tenant deletion while audit logs exist.

## Decision

Choose Option A for immediate production readiness.

Rationale:

- Existing platform admin code exposes suspend/update flows, not tenant hard-delete.
- Tenant model already has `status`.
- Option A avoids a rushed production FK migration.
- Audit evidence is preserved as long as production tenant hard-delete is prohibited.

## Enforcement Rule

Production code must not call:

```ts
prisma.tenant.delete(...)
prisma.tenant.deleteMany(...)
```

outside test cleanup utilities.

Tenant removal must be represented as:

- `status = "suspended"` for operational suspension.
- Future `status = "deleted"` or equivalent retained state for logical removal.
- Audit record: `audit.tenant_suspended` or `audit.tenant_deleted` for logical deletion.

## Test Exception

Test cleanup may hard-delete tenants in isolated test databases only.

## Follow-Up

Option B remains recommended for longer-term hardening:

- Change audit relation to prevent cascade.
- Add explicit actor/tenant snapshots for audit display.
- Add migration that preserves existing audit rows.

## Success Criteria

Tenant deletion cannot destroy audit evidence in production because production tenant hard-delete is prohibited.

## Final Decision

READY FOR E2
