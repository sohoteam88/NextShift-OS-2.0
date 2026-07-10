# D4 Audit Retention Policy

Date: 2026-06-19
Status: READY FOR E1
Scope: Retention, archive, and deletion rules for NextShift OS audit trail.

## Principle

Audit records are immutable evidence. They must remain append-only and queryable for the required retention window.

## Retention Schedule

| Category | Minimum Retention | Notes |
| --- | --- | --- |
| Authentication & security | 24 months | Auth bypass records follow security retention |
| Tenant/admin actions | 24+ months | Tenant lifecycle, role, permission, settings |
| Security incidents | 365+ days | Tenant isolation, auth bypass, data integrity |
| Manual overrides | 24+ months | Stage, mission, readiness, assignment overrides |
| Data export | 24+ months | Request and completion metadata only |
| Destructive actions | 24+ months | Delete, bulk delete, restore |

If legal, contractual, or incident response requirements demand longer retention, the longer requirement wins.

## Immutable Storage Rules

Never:

- Hard-delete active audit rows.
- Update an audit row.
- Overwrite metadata.
- Remove actor or tenant attribution.
- Replace a record with a corrected version.

Allowed:

- Append correction records.
- Append restore records.
- Archive records after retention threshold.
- Export records for compliance review.

## Archive Process

Archive must be controlled and auditable.

Required archive metadata:

- `archiveJobId`
- `archivedAt`
- `archiveScope`
- `retentionCategory`
- `recordCount`
- `performedBy`

Archive jobs must not expose raw sensitive metadata. Redaction rules still apply.

## Deletion Policy

Hard deletion is not allowed through product/admin flows.

If deletion is required by a legal retention process:

1. Verify retention window has expired.
2. Verify there is no active investigation or hold.
3. Export/archive according to policy if required.
4. Write an audit record for the retention action.
5. Execute controlled purge only through approved maintenance tooling.

## Redaction And Data Minimization

Audit metadata must not include:

- Passwords.
- Tokens.
- Cookies.
- API keys.
- Service-role keys.
- Full prompts.
- Full conversations.
- Full transcripts.
- Private notes.
- Raw request bodies.
- Raw exported content.

Metadata should store:

- Stable IDs.
- Field names.
- Safe enum changes.
- Reason codes.
- Approval IDs.
- Counts.
- Date/time.
- Request path.

## Query Retention

Audit UI and APIs must be able to query retained records by:

- User / actor.
- Tenant.
- Action.
- Target.
- Severity.
- Date range.

Archived records may be slower to query, but must remain recoverable for compliance and incident review during the retention window.

## Existing Model Considerations

Current `AuditLog` rows are linked to `Tenant` with `onDelete: Cascade`. This conflicts with long-term audit preservation if tenant records can be deleted. Future schema hardening should evaluate one of these paths:

- Soft-delete tenants only and never hard-delete tenant rows during audit retention.
- Change audit tenant relation behavior to preserve audit rows.
- Store immutable tenant snapshot fields required for audit display.

Current `actor` relation uses `onDelete: SetNull`, which preserves audit rows if a user is removed. The audit display should keep enough actor metadata to identify the action later, preferably with an actor snapshot in metadata or explicit `actorEmail` field after a migration.

## Compliance Holds

If a record is under security, legal, or incident review hold:

- Do not archive into inaccessible storage.
- Do not purge.
- Preserve related correlation IDs and error events.
- Keep query access available to authorized platform admins.

## Final Decision

READY FOR E1

Next gate: `E1_INFRASTRUCTURE_AUDIT.md`
