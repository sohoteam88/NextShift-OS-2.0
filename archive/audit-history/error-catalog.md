# D3 Error Catalog

Date: 2026-06-19
Status: READY FOR D4
Scope: Canonical production error events for NextShift OS.

## Common Envelope

All error events use the D1/D2 `LogEventEnvelope` fields:

- `eventId`
- `eventName`
- `occurredAt`
- `severity`
- `module`
- `userId`
- `tenantId`
- `actorId`
- `correlationId`
- `source`
- `schemaVersion`
- `properties`

Error event properties must pass through redaction before logging.

## Category 1: External Service Failure

Event:

```text
error.external_service_failed
```

Severity: ERROR

Examples:

- OpenAI request failure.
- Anthropic request failure.
- MiniMax request failure.
- Supabase request failure.
- Resend request failure.
- Stripe request failure.

Required properties:

| Field | Required | Notes |
| --- | --- | --- |
| `provider` | Yes | `openai`, `anthropic`, `minimax`, `supabase`, `resend`, `stripe`, or internal provider label |
| `operation` | Yes | Stable operation name |
| `statusCode` | When available | Numeric status code only |
| `failureCode` | Yes | Stable failure code |
| `correlationId` | When available | Required for cross-module flow |

Never include provider response body or provider token.

## Category 2: Authority Chain Failure

Events:

```text
error.authority_conflict_detected
authority_chain_break
```

Severity: CRITICAL

Examples:

- Journey -> AI COO handoff broken.
- AI COO -> Runtime handoff broken.
- Downstream module ignores required canonical upstream state.
- Conflicting authority sources produce different stages or assignments.

Required properties:

| Field | Required | Notes |
| --- | --- | --- |
| `upstreamModule` | Yes | Module expected to provide canonical input |
| `downstreamModule` | Yes | Module consuming the input |
| `expectedInput` | Yes | Field or contract name, not full payload |
| `actualInput` | Yes | Safe summary or enum, not sensitive payload |
| `correlationId` | Yes | Required |
| `failureCode` | Yes | Stable authority failure code |

Immediate alert required.

## Category 3: Tenant Isolation Failure

Event:

```text
error.tenant_isolation_violation
```

Severity: CRITICAL

Example:

- Tenant A can read, write, export, or infer Tenant B data.

Required properties:

| Field | Required | Notes |
| --- | --- | --- |
| `tenantId` | When known | Request tenant |
| `affectedTenantId` | When known | Do not expose externally |
| `module` | Yes | Detecting module |
| `requestPath` | Yes | Route or server action path |
| `operation` | Yes | Read/write/export/action |
| `failureCode` | Yes | Stable security failure code |
| `correlationId` | When available | Required for cross-module flow |

Immediate alert required. Treat as security incident until disproven.

## Category 4: Authentication Failure

Events:

```text
error.authentication_failed
error.authorization_failed
```

Severity:

- WARN for expected denied access or invalid credentials.
- ERROR for repeated suspicious failures, broken auth dependency, or unexpected auth middleware failure.
- CRITICAL for auth bypass.

Required properties:

| Field | Required | Notes |
| --- | --- | --- |
| `requestPath` | Yes | Route path |
| `reasonCode` | Yes | Stable deny/failure code |
| `actorId` | When available | Authenticated actor for authorization failures |
| `tenantId` | When available | Tenant context |
| `correlationId` | When available | Flow context |

Do not log passwords, cookies, tokens, authorization headers, invite tokens, or reset tokens.

## Category 5: Runtime Failure

Event:

```text
runtime.execution_failed
```

Severity: ERROR

Required properties:

| Field | Required | Notes |
| --- | --- | --- |
| `assignmentId` | Yes | Runtime assignment ID |
| `agentId` | Yes | Agent or orchestrator label |
| `executionId` | When available | Runtime execution ID |
| `executionMode` | Yes | `multi_agent`, `direct_agent`, or `recommended_agents` |
| `durationMs` | When available | Runtime duration before failure |
| `failureCode` | Yes | Stable failure code |
| `correlationId` | When available | Required for flow |

Runtime failure events must not log prompt, conversation, transcript, or generated result body.

## Category 6: Unhandled Exception

Event:

```text
error.unhandled_exception
```

Severity:

- ERROR for isolated request or job failure.
- CRITICAL for repeated, multi-tenant, security, data integrity, or authority-chain failures.

Required properties:

| Field | Required | Notes |
| --- | --- | --- |
| `module` | Yes | Failing module |
| `errorCode` | Yes | Stable internal code |
| `requestPath` | When available | Route path |
| `operation` | When available | Operation name |
| `correlationId` | When available | Flow context |

Stack traces may go to an approved error tracking sink later, but must not be logged as analytics properties.

## Grouping Keys

External service:

```text
{module}:{provider}:{operation}:{failureCode}
```

Authority chain:

```text
authority:{upstreamModule}->{downstreamModule}:{failureCode}
```

Tenant isolation:

```text
security:tenant_isolation:{module}:{requestPath}:{failureCode}
```

Auth:

```text
auth:{eventName}:{requestPath}:{reasonCode}
```

Runtime:

```text
runtime:{agentId}:{executionMode}:{failureCode}
```

Unhandled:

```text
{module}:{requestPath}:{errorCode}
```

Never group by message text alone.

## Final Decision

READY FOR D4
