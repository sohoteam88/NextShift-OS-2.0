# D2 Agent Runtime Telemetry Report

Date: 2026-06-19
Status: READY FOR D3

## Scope

D2 implemented the Agent Runtime telemetry foundation without changing runtime execution behavior.

Allowed scope completed:

- Shared logging envelope.
- Event constants.
- Redaction utility.
- Server-safe telemetry service.
- Agent Runtime telemetry emitters.
- Tests for redaction, event shape, runtime telemetry redaction, logging sink failure, and C3 runtime smoke paths.

Out of scope preserved:

- No external observability vendor added.
- No secrets added.
- No full prompt logging.
- No full conversation logging.
- No agent manager behavior changes.
- No workforce orchestrator behavior changes.
- No dashboard changes.
- No VPS deployment.

## Files Added

- `src/lib/observability/event-envelope.ts`
- `src/lib/observability/event-catalog.ts`
- `src/lib/observability/redact.ts`
- `src/lib/observability/server-telemetry.ts`
- `src/modules/agent-runtime/telemetry/runtime-telemetry.ts`
- `src/lib/observability/__tests__/redact.test.ts`
- `src/lib/observability/__tests__/event-envelope.test.ts`
- `src/modules/agent-runtime/telemetry/__tests__/runtime-telemetry.test.ts`
- `src/__tests__/api/ai-workforce-execute.test.ts`

## Files Updated

- `src/app/api/v1/ai-workforce/execute/route.ts`
- `vitest.config.ts`

## Implemented Events

| Event | Status | Notes |
| --- | --- | --- |
| `runtime.assignment_received` | Implemented | Emitted when a runtime assignment branch is selected. |
| `runtime.execution_started` | Implemented | Emitted immediately before execution call. |
| `runtime.execution_completed` | Implemented | Emitted after successful execution and memory persistence. |
| `runtime.execution_failed` | Implemented | Emitted on caught runtime failure before rethrow. |
| `error.external_service_failed` | Implemented | Emitted with provider, operation, and failure code. |

## Wiring

Only this route was wired:

- `src/app/api/v1/ai-workforce/execute/route.ts`

Telemetry was added around the existing branches:

- Goal + multi orchestration branch.
- Direct `agentId` branch.
- Default recommended-agent branch.

The existing execution calls and response shapes are preserved:

- `orchestrateForGoal(...)`
- `agentManager.executeAgent(...)`
- `agentManager.executeMultiAgent(...)`
- `agentMemoryService.remember(...)`
- `NextResponse.json({ data: ... })`

## Redaction Coverage

Telemetry properties pass through `redactLogProperties()` before logging.

Sensitive key patterns covered:

- `password`
- `token`
- `secret`
- `apiKey`
- `api_key`
- `authorization`
- `cookie`
- `session`
- `refresh`
- `access`
- `service_role`
- `database_url`
- `direct_url`
- `prompt`
- `conversation`
- `transcript`
- `privateNote`
- `card`
- `payment`

Nested objects and arrays are redacted before serialization. Long strings are truncated.

## Verification

Command:

```bash
pnpm vitest run src/__tests__/api/ai-workforce-execute.test.ts src/lib/observability/__tests__/redact.test.ts src/lib/observability/__tests__/event-envelope.test.ts src/modules/agent-runtime/telemetry/__tests__/runtime-telemetry.test.ts
```

Result:

```text
Test Files  4 passed (4)
Tests       9 passed (9)
```

Command:

```bash
pnpm type-check
```

Result:

```text
tsc --noEmit passed
```

Sensitive-field grep was reviewed. Matches are limited to redaction patterns and tests that prove redaction; no unsafe raw sensitive logging was added to the runtime route or telemetry emitters.

## C3 Runtime Checks

| Check | Status | Coverage |
| --- | --- | --- |
| C3-RUNTIME-007 | Passed | `src/__tests__/api/ai-workforce-execute.test.ts` verifies direct agent execution response and memory persistence. |
| C3-RUNTIME-008 | Passed | `src/__tests__/api/ai-workforce-execute.test.ts` verifies multi-agent orchestration response and memory persistence. |

## Final Decision

READY FOR D3

Next gate: `D3_ERROR_TRACKING.md`
