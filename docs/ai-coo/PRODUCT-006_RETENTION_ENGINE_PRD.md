# PRODUCT-006 Retention Engine PRD

Version: V8

Status: Implemented

Owner: Product Success Team

Depends on:

- PRODUCT-004 Activation Engine
- PRODUCT-005 User Success Engine
- EXEC-006 Multi-Mission Orchestration
- PRODUCT-002 Personalization Engine
- PRODUCT-003 Localization System

## Mission

Ensure users continue achieving outcomes after their first success. Retention is not login frequency, session count, or time in app. Retention is outcome progression.

## Core Rule

One outcome is not retained. Two or more verified outcomes create a retention candidate. Consistent outcome progression makes the user retained.

## Retention State Contract

`RetentionProjection.outcomeRetention` contains:

- `currentStage`
- `retentionLevel`
- `retentionLevelLabel`
- `progressPercentage`
- `nextOutcome`
- `retained`

Supported retention levels:

- `NEW_SUCCESS`
- `ACTIVE_PROGRESS`
- `MOMENTUM`
- `AT_RISK`
- `STALLED`
- `RETAINED`
- `EXPANDING`

## Implementation

- Existing `RetentionProjection` remains backward compatible with legacy `retentionState`, `retentionRisk`, `reEngagement`, and retention KPIs.
- Outcome-based retention is added through `outcomeRetention`, `outcomeRecommendation`, `retentionRecovery`, and localization metadata.
- Retention score now prioritizes:
  - outcome completion count
  - outcome velocity
  - outcome recency
  - current outcome progress
  - mission completion velocity
  - asset utilization
  - agent usage
- Dashboard Momentum Card displays:
  - current retention level
  - recent wins
  - next outcome
  - momentum
- AI COO retention risk now uses outcome-based recovery messaging before generic inactivity messaging.

## Outcome Recommendation

The default next outcome sequence is:

- `FIRST_LEAD` -> `FIRST_CUSTOMER`
- `FIRST_CUSTOMER` -> `FIRST_REVENUE`
- `FIRST_REVENUE` -> `RETENTION_SYSTEM`
- `RETENTION_SYSTEM` -> `TEAM_SCALING`
- `TEAM_SCALING` -> `AUTHORITY_BUILDING`

The engine accepts the current outcome context so the sequence can be personalized by the upstream personalization/outcome pipeline.

## Risk Detection

- No outcome progress for 14 days: `AT_RISK`
- No outcome progress for 30 days: `STALLED`
- No mission activity for 14 days also raises retention risk, but retained status is still outcome-based.

## Recovery

Recovery actions include:

- recommend next outcome
- generate recovery mission
- activate agent assistance
- send progress reminder

## Localization

All retention messaging uses Localization Engine through `retention.*` keys in `en`, `zh`, and `ms`. Dashboard labels use `src/messages` keys.

## Audit Logging

Retention audit actions:

- `retention.progressed`
- `retention.at_risk`
- `retention.stalled`
- `retention.recovered`
- `retention.expanding`

Audit metadata stores retention level, outcome count, progress, next outcome, retained state, locale, translation source, fallback flag, message keys, and timestamp.

## Verification

- `pnpm type-check`
- `pnpm vitest run src/__tests__/services/retention-engine.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts src/__tests__/services/expansion-engine.test.ts src/__tests__/services/referral-engine.test.ts src/__tests__/services/user-success-engine.test.ts`
- `pnpm build`

## Acceptance Criteria

- Retention state exists: done.
- Retention levels tracked: done.
- Momentum engine exists: done.
- Retention risk detection exists: done.
- Outcome recommendation engine exists: done.
- Localization supported: done.
- Personalization supported through upstream outcome/current-stage context: done.
- Type-check passes: done.
- Build passes: done.
