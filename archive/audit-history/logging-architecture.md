# D1 Logging Architecture

Date: 2026-06-19
Status: READY FOR D2
Scope: Production observability architecture for NextShift OS authority, runtime, audit, and error surfaces.

## Objective

NextShift OS must be able to answer these production questions without exposing secrets or sensitive user content:

- Who triggered a material state change.
- When the change happened.
- Why the system advanced, held, or failed.
- What module owned the decision.
- How often a path succeeds or fails.
- Where failures occur across the authority chain.

This document defines the logging layers, ownership boundaries, severity model, storage rules, and D2 implementation requirements.

## Observability Layers

| Layer | Purpose | Primary Consumers | Storage Class |
| --- | --- | --- | --- |
| Application logs | Operational health, request failures, module warnings | Engineering, support | Rotating structured logs |
| Authority chain events | Business-critical authority transitions | Engineering, product, support | Event store / analytics |
| Agent runtime telemetry | Assignment execution lifecycle, duration, result, failures | Engineering, product | Event store / metrics |
| Audit trail | Immutable user/admin/security actions | Admin, compliance, support | Immutable audit table |
| Error tracking | Exceptions, critical failures, regression alerts | Engineering | Error tracker plus structured logs |

The current codebase has a client analytics entrypoint at `src/lib/telemetry/tracker.ts` and a platform admin audit log page at `src/app/(auth)/platform-admin/audit-logs/page.tsx`. D2 should extend these rather than introduce unrelated tracking paths.

## Logging Principles

1. Log important state changes, not every render or derived UI calculation.
2. Log authority decisions at the module that owns the decision.
3. Log cross-module handoffs where a downstream module consumes an upstream canonical output.
4. Log runtime execution start, completion, failure, and duration.
5. Log errors with enough context to reproduce the failing module path.
6. Never log API keys, tokens, passwords, service-role keys, full prompts, full conversations, or sensitive user-provided body text.
7. Use stable event names and structured payloads; do not encode meaning only in free-form messages.
8. Use correlation IDs for flows that cross modules.

## Canonical Event Envelope

All structured events must share this envelope:

```ts
type LogEventEnvelope = {
  eventId: string;
  eventName: string;
  occurredAt: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  module: LoggingModule;
  userId?: string;
  tenantId?: string;
  actorId?: string;
  correlationId?: string;
  source: 'server' | 'client' | 'worker' | 'migration';
  schemaVersion: number;
  properties: Record<string, string | number | boolean | null>;
};
```

`message` is allowed for human-readable debugging, but the system must not depend on it for reporting or alerting.

## Module Ownership

| Owner | Owns Events For | Must Not Own |
| --- | --- | --- |
| Auth | signup, login, logout, tenant creation, role changes | Journey or runtime progression |
| Interview Authority | interview lifecycle, brand discovery completion, brand profile updates | Business readiness decisions |
| Business State | business stage, readiness, bottlenecks, opportunities | Journey stage selection |
| Journey | journey stage changes, milestone completion, next action changes | COO recommendations |
| AI COO | plan generation, recommendation creation, assignment creation | Runtime execution status |
| Agent Runtime | assignment receipt, execution start/completion/failure/result | Growth scoring |
| Growth Loop | growth signals, growth score changes | Authority stage decisions |
| Platform Admin | admin actions, tenant changes, permission changes | Product analytics |

Ownership rule: the authority that writes the canonical decision emits the event. Consumers may emit `consumed` or `applied` telemetry, but must not duplicate upstream decision events as if they made the decision.

## Authority Chain Telemetry

The authority chain is:

```text
Interview Authority
-> Business State
-> Journey
-> AI COO
-> Agent Runtime
-> Growth Loop
```

Required handoff telemetry:

| Handoff | Required Event | Purpose |
| --- | --- | --- |
| Interview -> Business State | `business_state.generated` | Confirms brand/interview authority was consumed |
| Business State -> Journey | `journey.stage_changed` | Confirms stage was derived from business state and progress |
| Journey -> AI COO | `coo.plan_generated` | Confirms COO plan used Journey state |
| AI COO -> Runtime | `runtime.assignment_received` | Confirms runtime received COO assignment |
| Runtime -> Growth Loop | `growth_signal.generated` | Confirms execution/result influenced growth loop |

Each handoff event must include `correlationId`, upstream source identifier where available, and the receiving module.

## Error Severity Model

| Severity | Meaning | Examples | Response |
| --- | --- | --- | --- |
| INFO | Expected lifecycle event | user logged in, journey milestone completed | Store as event |
| WARN | Recoverable or fallback behavior | fallback projection used, missing optional source | Store and aggregate |
| ERROR | Request or job failed but system remains available | generation failed, adapter exception | Track error and log event |
| CRITICAL | Security, data integrity, or production outage risk | auth bypass, tenant isolation failure, runtime queue outage | Alert immediately |

Required error fields:

- `eventId`
- `userId` when known
- `tenantId` when known
- `module`
- `severity`
- `message`
- `errorCode`
- `correlationId`
- `requestPath` for server/API failures

Stack traces may be sent to error tracking only. They must not be exposed to users or stored in analytics properties.

## Audit Trail

Audit trail is separate from analytics telemetry. It must be immutable, timestamped, user-attributed, tenant-attributed when applicable, and queryable by platform admins.

Audit trail must track:

- Admin actions.
- Role changes.
- Tenant creation, suspension, deletion, and settings changes.
- Permission changes.
- Billing/security-sensitive manual overrides.
- Data export or destructive operations.

Audit records must include:

- `auditId`
- `occurredAt`
- `actorId`
- `actorEmail` when available
- `tenantId` when applicable
- `action`
- `targetType`
- `targetId`
- `metadata` with redacted structured context

Audit records must not be deleted by product flows. If legal retention rules require expiry, expiry must be implemented as a controlled retention process, not ad hoc deletion.

## Agent Runtime Telemetry

Agent Runtime must track:

- Assignment received.
- Execution started.
- Execution completed.
- Execution failed.
- Result produced.

Runtime telemetry must include:

- `assignmentId`
- `agentId`
- `executionId` when available
- `executionMode`
- `durationMs` on completion/failure
- `resultStatus`
- `failureCode` for failures
- `correlationId`

Runtime telemetry must not include full prompts, full conversations, API secrets, provider tokens, or unredacted generated content.

## Retention

| Data Type | Suggested Retention | Notes |
| --- | --- | --- |
| Application logs | 30-90 days | Rotate aggressively; no PII-heavy payloads |
| Analytics / authority events | 12-24 months | Structured product telemetry |
| Runtime telemetry | 6-12 months | Keep aggregate metrics longer if needed |
| Audit trail | 24+ months | Controlled retention only |
| Error events | 90-180 days | Keep grouped fingerprints and release metadata |

## D2 Implementation Boundary

D2 should implement the runtime telemetry foundation first:

1. Add a shared event envelope and event-name constants.
2. Add a server-safe logging service with redaction.
3. Add Agent Runtime lifecycle emitters.
4. Add tests for redaction and event shape.
5. Avoid wiring every module until the runtime telemetry contract is proven.

## Success Criteria

- Event taxonomy defined: complete.
- Ownership defined: complete.
- Telemetry defined: complete.
- Error tracking defined: complete.
- Audit trail defined: complete.
- Redaction policy defined: see `audit/logging-redaction-policy.md`.

## Final Decision

READY FOR D2

Next gate: `D2_AGENT_RUNTIME_TELEMETRY.md`
