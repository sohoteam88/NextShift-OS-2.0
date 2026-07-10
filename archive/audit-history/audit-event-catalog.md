# D4 Audit Event Catalog

Date: 2026-06-19
Status: READY FOR E1
Scope: Canonical audit event taxonomy for NextShift OS.

## Naming Rules

- Audit actions use the `audit.` prefix.
- Use past-tense action names where possible.
- Use stable action names, not free-form sentences.
- Store human-readable display copy outside the canonical action when needed.
- Do not log raw sensitive values in action or metadata.

## Common Fields

Every audit record must include:

| Field | Required | Notes |
| --- | --- | --- |
| `auditId` | Yes | Maps to current `AuditLog.id` |
| `occurredAt` | Yes | Maps to current `AuditLog.createdAt` |
| `actorId` | For human action | System actions may be null but should include `actorType` metadata |
| `actorEmail` | Optional | May be joined from user record for display |
| `tenantId` | When tenant-scoped | Required for tenant/admin actions |
| `action` | Yes | Must match this catalog |
| `targetType` | Yes | `user`, `tenant`, `permission`, `override`, `export`, `record`, etc. |
| `targetId` | When available | Stable target identifier |
| `severity` | Yes | Explicit field in future model, derived from catalog until then |
| `metadata` | Yes | Redacted structured context |

## Category 1: Authentication & Security

| Event | Severity | Target Type | Required Metadata |
| --- | --- | --- | --- |
| `audit.user_created` | INFO | `user` | `createdBy`, `creationSource` |
| `audit.role_changed` | WARN | `user` | `fromRole`, `toRole`, `reasonCode` |
| `audit.permission_changed` | WARN | `permission` | `permission`, `changeType`, `targetUserId` |
| `audit.auth_bypass_detected` | CRITICAL | `security` | `requestPath`, `reasonCode`, `correlationId` |

Notes:

- Do not store passwords, invite tokens, reset tokens, cookies, or authorization headers.
- Auth bypass is a security incident and must also produce a CRITICAL error-tracking alert.

## Category 2: Tenant Administration

| Event | Severity | Target Type | Required Metadata |
| --- | --- | --- | --- |
| `audit.tenant_created` | INFO | `tenant` | `changeType`, `actorId` |
| `audit.tenant_updated` | INFO | `tenant` | `changeType`, `affectedFieldNames` |
| `audit.tenant_suspended` | WARN | `tenant` | `reasonCode`, `actorId` |
| `audit.tenant_deleted` | CRITICAL | `tenant` | `reasonCode`, `approvalId` |

Tenant administration fields:

```json
{
  "tenantId": "",
  "actorId": "",
  "changeType": ""
}
```

Do not store full tenant settings if settings may include secrets or private configuration. Store affected field names and safe before/after enum values.

## Category 3: Manual Overrides

| Event | Severity | Target Type | Required Metadata |
| --- | --- | --- | --- |
| `audit.manual_override_applied` | WARN / CRITICAL | `override` | `overrideType`, `fromValue`, `toValue`, `reasonCode` |
| `audit.manual_override_removed` | WARN | `override` | `overrideType`, `previousValue`, `reasonCode` |

Override examples:

- Force stage.
- Force mission.
- Force readiness.
- Force assignment.

Severity rule:

- WARN for reversible operational overrides.
- CRITICAL for overrides affecting tenant isolation, authorization, billing, data integrity, or authority-chain correctness.

## Category 4: Data Export

| Event | Severity | Target Type | Required Metadata |
| --- | --- | --- | --- |
| `audit.data_export_requested` | WARN | `export` | `exportType`, `scope`, `requestedFormat` |
| `audit.data_export_completed` | WARN | `export` | `exportType`, `recordCount`, `completedStatus` |

Data export fields:

```json
{
  "actorId": "",
  "tenantId": "",
  "exportType": ""
}
```

Do not store exported file contents or signed download URLs in metadata.

## Category 5: Destructive Actions

| Event | Severity | Target Type | Required Metadata |
| --- | --- | --- | --- |
| `audit.record_deleted` | WARN | `record` | `recordType`, `reasonCode` |
| `audit.bulk_delete` | CRITICAL | `record` | `recordType`, `recordCount`, `approvalId` |
| `audit.restore` | WARN | `record` | `recordType`, `restoredFromAuditId` |

Destructive action records must be written before or inside the same transaction as the destructive operation where possible. If a transaction rolls back, the audit record should roll back unless the attempted destructive action itself must be preserved as a denied/failed audit action.

## Existing Action Mapping

Some current writers store free-form actions such as role/status change sentences and tenant settings update sentences. Future implementation should map them to canonical actions:

| Current Pattern | Canonical Action |
| --- | --- |
| Role changed text | `audit.role_changed` |
| Status changed text | `audit.permission_changed` or user status-specific action in future catalog |
| Tenant settings updated text | `audit.tenant_updated` |
| Override granted/revoked | `audit.manual_override_applied` / `audit.manual_override_removed` |
| Member approval/rejection | `audit.permission_changed` or future `audit.member_status_changed` |

## Severity Defaults

| Action Prefix / Pattern | Default Severity |
| --- | --- |
| `audit.user_created` | INFO |
| `audit.tenant_created` | INFO |
| `audit.tenant_updated` | INFO |
| `audit.role_changed` | WARN |
| `audit.permission_changed` | WARN |
| `audit.manual_override_*` | WARN |
| `audit.data_export_*` | WARN |
| `audit.record_deleted` | WARN |
| `audit.bulk_delete` | CRITICAL |
| `audit.tenant_deleted` | CRITICAL |
| `audit.auth_bypass_detected` | CRITICAL |

## Query Requirements

The audit catalog must support filtering by:

- User / actor.
- Tenant.
- Action.
- Target type and target ID.
- Severity.
- Date range.

## Final Decision

READY FOR E1
