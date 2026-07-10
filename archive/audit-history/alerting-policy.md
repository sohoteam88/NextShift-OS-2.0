# D3 Alerting Policy

Date: 2026-06-19
Status: READY FOR D4
Scope: Alerting rules for NextShift OS production error tracking.

## Alert Goals

Alerting must identify:

- Security and tenant isolation risk immediately.
- Authority chain breaks before they corrupt downstream decisions.
- User-visible runtime and external service failures during daily review.
- Recoverable warnings during weekly review.

Alerting must not expose secrets, raw prompts, conversations, or sensitive user data.

## Severity Actions

| Severity | Action | Response Window |
| --- | --- | --- |
| INFO | No alert | N/A |
| WARN | Weekly summary | Weekly review |
| ERROR | Daily engineering summary | Next business day or sooner if volume spikes |
| CRITICAL | Immediate alert | Same day / incident response |

## Immediate Alerts

Immediate alert is required for:

- `error.tenant_isolation_violation`
- `authority_chain_break`
- `error.authority_conflict_detected`
- Database corruption indicators.
- Auth bypass indicators.
- Any ERROR affecting multiple tenants with data integrity risk.

Immediate alerts must include:

- `eventName`
- `severity`
- `module`
- `correlationId`
- `tenantId` when known
- `requestPath` when available
- Stable `errorCode` or `failureCode`
- Grouping key

They must not include raw request bodies, tokens, cookies, prompts, conversations, provider responses, or stack traces in the human-facing alert text.

## Daily Summary

Daily summary includes:

- `runtime.execution_failed`
- `error.external_service_failed`
- Repeated `error.authentication_failed`
- Repeated `error.authorization_failed`
- Unhandled exceptions not escalated to CRITICAL

Daily summary should aggregate by:

- `eventName`
- `module`
- `provider`
- `operation`
- `requestPath`
- `failureCode`
- `tenantId` count, not full tenant list unless needed by support

## Weekly Summary

Weekly summary includes:

- WARN-level events.
- Recoverable fallbacks.
- Low-volume auth denies.
- Non-critical provider warnings.
- Any module with rising WARN trend.

## Alert Thresholds

| Condition | Alert Level |
| --- | --- |
| One tenant isolation violation | Immediate CRITICAL |
| One authority chain break | Immediate CRITICAL |
| One auth bypass indicator | Immediate CRITICAL |
| External service failure spike across tenants | CRITICAL if user-visible and multi-tenant |
| Runtime execution failures repeated for same `agentId` and `failureCode` | Daily ERROR summary |
| WARN repeated for same module over 7 days | Weekly WARN summary |

## Routing

| Error Area | Owner |
| --- | --- |
| Auth failures | Auth Team |
| Interview failures | Interview Authority |
| Business state failures | Business State |
| Journey failures | Journey |
| AI COO recommendation failures | AI COO |
| Runtime execution failures | Agent Runtime |
| Growth signal failures | Growth Loop |
| Tenant isolation, auth bypass, audit integrity | Platform |

If ownership is unclear, route to Platform first, then assign based on the failing module and grouping key.

## Triage Workflow

1. Confirm severity and affected scope.
2. Locate correlated events using `correlationId`.
3. Identify the owner from `module` and event category.
4. Verify whether sensitive data exposure is possible.
5. For CRITICAL incidents, preserve audit records and raw operational logs according to retention policy.
6. For ERROR incidents, group by stable error fields and prioritize by frequency and user impact.
7. For WARN incidents, review weekly trend and decide whether to convert into backlog work.

## Retention

| Alert Data | Retention |
| --- | --- |
| WARN summaries | 30 days |
| ERROR raw events | 90 days |
| CRITICAL raw events | 365 days |
| Audit/security records | 24+ months |
| Aggregated metrics | Product/ops decision |

## D4 Boundary

D4 should implement audit-trail architecture and must not treat every telemetry event as an audit event. Only security, admin, permission, tenant, and destructive actions should enter immutable audit storage.

## Final Decision

READY FOR D4

Next gate: `D4_AUDIT_TRAIL.md`
