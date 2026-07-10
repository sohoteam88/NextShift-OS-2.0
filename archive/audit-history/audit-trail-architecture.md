# D4 Audit Trail Architecture

Date: 2026-06-19
Status: READY FOR E1
Scope: Immutable audit-trail architecture for NextShift OS.

## Objective

The audit trail must answer:

- Who changed what?
- When did it happen?
- Why was it changed?
- Who approved it?
- Can we prove it later?

Audit trail is for human and security-sensitive actions. It is not a replacement for telemetry.

## Audit vs Telemetry

| Type | Purpose | Examples | Storage |
| --- | --- | --- | --- |
| Telemetry | System lifecycle and operational signals | `runtime.execution_completed`, `journey.stage_changed`, `coo.plan_generated` | Event/log sink |
| Audit Trail | Human, admin, security, permission, tenant, destructive, and manual override actions | `audit.role_changed`, `audit.tenant_updated`, `audit.permission_changed`, `audit.manual_override_applied` | Immutable audit storage |

Rule: telemetry is not audit trail. Do not write every system event into audit storage.

## Current System Baseline

The repo already has an `AuditLog` Prisma model mapped to `audit_logs`:

- `id`
- `tenantId`
- `actorId`
- `action`
- `targetType`
- `targetId`
- `metadata`
- `createdAt`

Existing readers:

- `src/modules/admin/services/platform-health.ts`
- `src/app/(auth)/platform-admin/audit-logs/page.tsx`

Existing writers include admin/user/settings/member/SaaS flows. D4 architecture makes this table the canonical target but requires future implementation to route writes through one append-only audit service with redaction.

## Canonical Audit Record

```ts
interface AuditRecord {
  auditId: string;
  occurredAt: string;
  actorId?: string;
  actorEmail?: string;
  tenantId?: string;
  action: string;
  targetType: string;
  targetId: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  metadata: Record<string, unknown>;
}
```

Implementation note: the current Prisma model stores `id` and `createdAt`; these map to `auditId` and `occurredAt`. `actorEmail` and `severity` can initially be derived/displayed from joined user/action metadata, but should become explicit fields in a future migration if audit query volume or compliance needs justify it.

## Immutable Rule

Audit records are append-only.

Never:

- Update an audit record.
- Overwrite metadata.
- Hard-delete audit rows.
- Reuse an audit ID.

Allowed:

- Archive old records through a controlled retention process.
- Add compensating records such as `audit.restore` or `audit.manual_override_removed`.
- Add metadata to a new follow-up record that references the original audit ID.

## Write Path

Future implementation should centralize writes through a dedicated service:

```text
module action
-> audit service
-> redaction
-> immutable audit_logs append
```

The audit service must:

- Validate canonical action names.
- Enforce append-only writes.
- Apply `logging-redaction-policy.md`.
- Require `actorId` for human actions where possible.
- Include `tenantId` where tenant context exists.
- Store stable `targetType` and `targetId`.
- Store structured metadata only.
- Avoid raw request bodies and raw form payloads.

## Query Model

Audit trail must support:

- By user / actor.
- By tenant.
- By action.
- By target.
- By severity.
- By date range.

Minimum query dimensions:

| Query | Required Fields |
| --- | --- |
| By User | `actorId`, `createdAt` |
| By Tenant | `tenantId`, `createdAt` |
| By Action | `action`, `createdAt` |
| By Target | `targetType`, `targetId`, `createdAt` |
| By Severity | `severity` or severity derived from action catalog |
| By Date Range | `createdAt` |

The existing model already indexes `(tenantId, createdAt)` and `actorId`. Future migration should consider indexes for `(action, createdAt)` and `(targetType, targetId)` if platform-admin audit search expands.

## Redaction

Audit metadata must follow `audit/logging-redaction-policy.md`.

Do not store:

- Passwords.
- Tokens.
- Cookies.
- API keys.
- Service-role keys.
- Database URLs with credentials.
- Full prompts.
- Full conversations.
- Full transcripts.
- Private notes.
- Raw authenticated request body.

Allowed metadata examples:

- `fromRole`
- `toRole`
- `changeType`
- `reasonCode`
- `approvalId`
- `affectedFieldNames`
- `exportType`
- `recordCount`
- `requestPath`

## Ownership

| Owner | Audit Scope |
| --- | --- |
| Auth | User creation, role change, permission change, auth bypass detection |
| Platform | Tenant creation/update/suspension/deletion, platform security |
| Journey | Journey stage, mission, readiness manual overrides |
| AI COO | Recommendation and assignment manual overrides |
| Runtime | Execution assignment/result manual overrides |
| Admin | Data exports, destructive actions, restore actions |

Ownership rule: the module that performs the human/admin action writes the audit record. Platform owns cross-tenant security and tenant administration records.

## Approval Model

Audit records should support approval evidence when the action requires it:

- `approvedBy`
- `approvalId`
- `approvalReasonCode`
- `approvalSource`

If there is no explicit approval workflow, metadata should include `reasonCode` or `changeType` rather than free-form sensitive notes.

## Success Criteria

- Audit taxonomy defined: see `audit/audit-event-catalog.md`.
- Immutable rule defined: complete.
- Retention defined: see `audit/audit-retention-policy.md`.
- Query model defined: complete.
- Ownership defined: complete.
- Redaction applied: policy defined, future centralized service required.

## Final Decision

READY FOR E1

Next gate: `E1_INFRASTRUCTURE_AUDIT.md`
