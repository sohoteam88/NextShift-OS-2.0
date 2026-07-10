# D3 Error Tracking Plan

Date: 2026-06-19
Status: READY FOR D4
Scope: Production error tracking architecture for NextShift OS.

## Objective

Error tracking must answer:

- What failed?
- How serious is it?
- Who is affected?
- Do we need to act now?
- Which module owns the fix?

D3 defines the production error taxonomy, grouping rules, correlation strategy, ownership model, alert severity, and retention policy. It does not add a new vendor or change runtime behavior.

## Architecture

Error tracking sits on top of the D1/D2 observability foundation:

- `LogEventEnvelope` is the canonical event shape.
- `correlationId` ties cross-module work together.
- `emitServerEvent()` is the server-safe emission path.
- `redactLogProperties()` protects secrets and sensitive content before logs are written.

No error event may bypass redaction.

## Error Categories

| Category | Canonical Events | Severity | Owner |
| --- | --- | --- | --- |
| External service failure | `error.external_service_failed` | ERROR | Calling module |
| Authority chain failure | `error.authority_conflict_detected`, `authority_chain_break` | CRITICAL | Downstream consumer with upstream owner involved |
| Tenant isolation failure | `error.tenant_isolation_violation` | CRITICAL | Platform |
| Authentication failure | `error.authentication_failed`, `error.authorization_failed` | WARN / ERROR | Auth |
| Runtime failure | `runtime.execution_failed` | ERROR | Agent Runtime |
| Unhandled exception | `error.unhandled_exception` | ERROR / CRITICAL | Failing module |

## Severity Model

| Severity | Meaning | Alerting |
| --- | --- | --- |
| INFO | Expected lifecycle event | No alert |
| WARN | Recoverable issue or suspicious access attempt | Weekly summary unless repeated |
| ERROR | User-visible failure or provider/runtime failure | Daily engineering review |
| CRITICAL | Security, authority break, tenant isolation, data integrity risk | Immediate alert |

Severity escalation rule: if an ERROR affects multiple tenants, breaks a canonical authority contract, or risks data exposure, escalate to CRITICAL.

## Correlation Strategy

Every cross-module flow must use a shared `correlationId`.

Target flow:

```text
Interview Authority
-> Business State
-> Journey
-> AI COO
-> Agent Runtime
-> Growth Loop
```

Rules:

- First module in a flow creates the correlation ID.
- Downstream modules preserve the same correlation ID.
- If a module receives no correlation ID, it may create one, but must mark the flow as a new root flow.
- Runtime execution events must include the same correlation ID from assignment receipt through completion/failure.
- Error events emitted during a correlated flow must reuse that correlation ID.

## Grouping Strategy

Group errors by stable dimensions:

- `module`
- `errorCode`
- `provider`
- `requestPath`
- `operation`
- `upstreamModule`
- `downstreamModule`

Never group by message text alone. Message text can change based on locale, provider copy, or dynamic values.

Recommended grouping key:

```text
{module}:{errorCode}:{provider}:{operation}:{requestPath}
```

For authority failures:

```text
authority:{upstreamModule}->{downstreamModule}:{errorCode}
```

For tenant isolation failures:

```text
security:tenant_isolation:{module}:{requestPath}
```

## Required Error Fields

Every error event must include:

- `eventId`
- `eventName`
- `occurredAt`
- `severity`
- `module`
- `source`
- `schemaVersion`
- `correlationId` when available
- `userId` when known
- `tenantId` when known
- `errorCode` or `failureCode`

Error-specific fields are defined in `audit/error-catalog.md`.

## Ownership

| Owner | Owns |
| --- | --- |
| Auth | Authentication and authorization failures |
| Interview Authority | Interview extraction, completion, and brand discovery failures |
| Business State | Business state generation, readiness, and bottleneck failures |
| Journey | Stage, milestone, and next-action failures |
| AI COO | Plan, recommendation, and assignment failures |
| Agent Runtime | Assignment receipt, execution, and result failures |
| Growth Loop | Signal and score failures |
| Platform | Tenant isolation, security, audit, data integrity |

Ownership rule: the module that detects the failure emits the error event. The canonical owner is accountable for triage even when the root cause is upstream.

## Retention

| Error Type | Retention |
| --- | --- |
| WARN | 30 days |
| ERROR | 90 days |
| CRITICAL | 365 days |
| Audit/security records | 24+ months |

Aggregated metrics may be retained longer than raw event payloads.

## Redaction Requirements

Error tracking must not store:

- API keys.
- Tokens.
- Cookies.
- Passwords.
- Service-role keys.
- Database URLs with credentials.
- Full prompts.
- Full conversations.
- Full transcripts.
- Raw provider response bodies.
- Raw authenticated request bodies.

Stack traces are allowed only in the error tracking sink and must not be written into analytics properties or user-facing responses.

## Implementation Notes For D4+

Current D2 implementation emits `runtime.execution_failed` and `error.external_service_failed` around `src/app/api/v1/ai-workforce/execute/route.ts`. D4 should keep this behavior intact and add audit-trail coverage for security/admin actions, not duplicate product telemetry as audit logs.

## Success Criteria

- Error taxonomy defined: complete.
- Severity model defined: complete.
- Ownership defined: complete.
- Alert policy defined: see `audit/alerting-policy.md`.
- Correlation strategy defined: complete.
- Retention defined: complete.

## Final Decision

READY FOR D4

Next gate: `D4_AUDIT_TRAIL.md`
