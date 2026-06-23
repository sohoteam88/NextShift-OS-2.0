# HOTFIX-001 Healthy Business State

## Problem

The Bottleneck Engine previously treated an empty candidate set as `NO_SYSTEM`. That made healthy businesses look like system failures.

No active bottleneck candidates means the business is healthy when the required signals are available. It only means `NO_SYSTEM` when signals cannot be trusted.

## Decision

Add `BUSINESS_HEALTHY` as a first-class `MissionBottleneck`.

The engine must distinguish these cases:

- Candidate count is `0` and signals are available: return `BUSINESS_HEALTHY`.
- Candidate count is `0` and signals are unavailable: return `NO_SYSTEM`.
- Validation failure, signal source failure, metrics missing, business state missing, or engine exception: return `NO_SYSTEM`.

## Healthy Output

```ts
{
  bottleneck: 'BUSINESS_HEALTHY',
  severity: 'None',
  confidence: 90,
  evidence: ['No active bottleneck candidates found.'],
  explainability: 'Your business signals are healthy. No active bottleneck is currently blocking progress.'
}
```

## Dashboard Behavior

Dashboard projection may show a success state such as:

- Business Healthy
- No active bottleneck
- Current systems are functioning as expected

Dashboard must not show signal failure copy for `BUSINESS_HEALTHY`.

Dashboard must not expose internal confidence or evidence.

## Mission Engine Behavior

`BUSINESS_HEALTHY` must not generate repair, fix, or recovery missions.

It should route to an optimization action that helps the user continue reviewing, scaling, or improving the business system.

## Explainability Rules

`NO_SYSTEM` copy:

- Business signals unavailable.
- System recovery required.

`BUSINESS_HEALTHY` copy:

- No active bottleneck detected.
- Business systems operating normally.
- Continue optimizing and scaling.

These two states must never share copy.

## Acceptance Criteria

- No candidate does not mean system failure.
- `BUSINESS_HEALTHY` is supported by mission contracts, registry, explainability, and dashboard projection.
- Healthy businesses return confidence `90` with severity `None`.
- `NO_SYSTEM` is reserved for real signal failure.
- Tests cover healthy output and signal failure output separately.
- `pnpm type-check` passes.
