# D1 Event Catalog

Date: 2026-06-19
Status: READY FOR D2
Scope: Canonical production event taxonomy for NextShift OS.

## Naming Rules

- Use dot-separated event names: `domain.action`.
- Use past tense for completed actions: `interview.completed`.
- Use explicit lifecycle verbs: `started`, `completed`, `failed`, `changed`, `generated`, `created`, `received`.
- Do not create synonyms for the same action.
- Do not include user content, prompt text, or secrets in event names or properties.

## Common Required Fields

Every event must include:

| Field | Required | Notes |
| --- | --- | --- |
| `eventId` | Yes | Unique ID for the event |
| `eventName` | Yes | Must match this catalog |
| `occurredAt` | Yes | ISO timestamp |
| `module` | Yes | Owning module |
| `severity` | Yes | `INFO`, `WARN`, `ERROR`, or `CRITICAL` |
| `source` | Yes | `server`, `client`, `worker`, or `migration` |
| `schemaVersion` | Yes | Start at `1` |
| `userId` | When known | Internal ID only |
| `tenantId` | When known | Internal ID only |
| `correlationId` | For flows | Required for cross-module handoffs |
| `properties` | Yes | Redacted structured properties |

## Auth Events

Owner: Auth

| Event | Severity | Required Properties | Notes |
| --- | --- | --- | --- |
| `user.signup` | INFO | `userId`, `tenantId`, `locale`, `source` | Do not log password or invite token |
| `user.login` | INFO | `userId`, `tenantId`, `method` | Do not log session token |
| `user.logout` | INFO | `userId`, `tenantId` | Client or server source allowed |
| `tenant.created` | INFO | `tenantId`, `actorId` | Audit-worthy |
| `role.changed` | WARN | `actorId`, `targetUserId`, `fromRole`, `toRole` | Audit-worthy |

## Interview Authority Events

Owner: Interview Authority

| Event | Severity | Required Properties | Notes |
| --- | --- | --- | --- |
| `interview.started` | INFO | `userId`, `tenantId`, `interviewId`, `mode` | Mode may be text/voice |
| `interview.completed` | INFO | `userId`, `tenantId`, `interviewId`, `turnCount` | Do not log full transcript |
| `brand_discovery.completed` | INFO | `userId`, `tenantId`, `authority`, `completionSource` | Confirms authority gate |
| `brand_profile.updated` | INFO | `userId`, `tenantId`, `profileId`, `changedFields` | Field names only, not values when sensitive |

## Business State Events

Owner: Business State

| Event | Severity | Required Properties | Notes |
| --- | --- | --- | --- |
| `business_state.generated` | INFO | `userId`, `tenantId`, `businessStage`, `readiness` | Include `correlationId` when generated from interview |
| `business_state.changed` | INFO | `userId`, `tenantId`, `fromStage`, `toStage` | Emit only on material change |
| `readiness.changed` | INFO | `userId`, `tenantId`, `fromReadiness`, `toReadiness` | Numeric score or readiness band |
| `bottleneck.detected` | WARN | `userId`, `tenantId`, `bottleneckType`, `severity` | Do not log sensitive user notes |

## Journey Events

Owner: Journey

| Event | Severity | Required Properties | Notes |
| --- | --- | --- | --- |
| `journey.stage_changed` | INFO | `userId`, `tenantId`, `fromStage`, `toStage`, `authoritySource` | Required Business State -> Journey handoff |
| `journey.milestone_completed` | INFO | `userId`, `tenantId`, `stage`, `milestoneId` | Stable milestone ID |
| `journey.next_action_changed` | INFO | `userId`, `tenantId`, `stage`, `nextActionId` | Do not log large generated copy |

## AI COO Events

Owner: AI COO

| Event | Severity | Required Properties | Notes |
| --- | --- | --- | --- |
| `coo.plan_generated` | INFO | `userId`, `tenantId`, `planId`, `journeyStage`, `recommendationCount` | Required Journey -> COO handoff |
| `coo.recommendation_created` | INFO | `userId`, `tenantId`, `planId`, `recommendationId`, `recommendationType` | Summary metadata only |
| `coo.assignment_created` | INFO | `userId`, `tenantId`, `planId`, `assignmentId`, `agentId` | Required before runtime receipt |

## Agent Runtime Events

Owner: Agent Runtime

| Event | Severity | Required Properties | Notes |
| --- | --- | --- | --- |
| `runtime.assignment_received` | INFO | `userId`, `tenantId`, `assignmentId`, `agentId`, `executionMode` | Required COO -> Runtime handoff |
| `runtime.execution_started` | INFO | `userId`, `tenantId`, `assignmentId`, `agentId`, `executionId` | Start timer here |
| `runtime.execution_completed` | INFO | `userId`, `tenantId`, `assignmentId`, `agentId`, `executionId`, `durationMs` | Include result status, not full output |
| `runtime.execution_failed` | ERROR | `userId`, `tenantId`, `assignmentId`, `agentId`, `executionId`, `durationMs`, `failureCode` | Track via error service |

## Growth Loop Events

Owner: Growth Loop

| Event | Severity | Required Properties | Notes |
| --- | --- | --- | --- |
| `growth_signal.generated` | INFO | `userId`, `tenantId`, `signalType`, `sourceModule` | Required Runtime -> Growth handoff |
| `growth_score_changed` | INFO | `userId`, `tenantId`, `fromScore`, `toScore`, `reasonCode` | Emit on material score changes |

## Audit Events

Owner: Platform Admin / Security-sensitive module owner

| Event | Severity | Required Properties | Notes |
| --- | --- | --- | --- |
| `audit.admin_action_recorded` | INFO | `actorId`, `action`, `targetType`, `targetId` | Stored in audit trail |
| `audit.permission_changed` | WARN | `actorId`, `targetUserId`, `permission`, `changeType` | Immutable |
| `audit.tenant_changed` | WARN | `actorId`, `tenantId`, `changeType` | Immutable |
| `audit.manual_override_applied` | WARN | `actorId`, `targetType`, `targetId`, `reasonCode` | Reason code only, not full notes |

## Error Events

Owner: Failing module

| Event | Severity | Required Properties | Notes |
| --- | --- | --- | --- |
| `error.unhandled_exception` | ERROR | `module`, `errorCode`, `requestPath` | Send stack to error tracker only |
| `error.external_service_failed` | ERROR | `module`, `provider`, `operation`, `statusCode` | Do not log provider token |
| `error.authority_conflict_detected` | CRITICAL | `module`, `upstreamModule`, `conflictType` | Requires immediate engineering review |
| `error.tenant_isolation_violation` | CRITICAL | `module`, `tenantId`, `requestPath` | Security alert |

## Deprecated Event Names

The existing `src/lib/telemetry/tracker.ts` uses underscore event names such as `user_signed_up`, `funnel_created`, `ai_content_generated`, and `content_published`. These should remain backward-compatible until D2/D3 migration, but new production authority events must use this catalog.

## D2 Priority Events

D2 should implement these first:

1. `runtime.assignment_received`
2. `runtime.execution_started`
3. `runtime.execution_completed`
4. `runtime.execution_failed`
5. `error.external_service_failed`

## Final Decision

READY FOR D2
