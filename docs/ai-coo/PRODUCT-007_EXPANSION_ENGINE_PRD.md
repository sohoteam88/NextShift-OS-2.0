# PRODUCT-007 Expansion Engine PRD

Version: V8

Status: Implemented

Owner: Product Growth Team

Depends on:

- PRODUCT-005 User Success Engine
- PRODUCT-006 Retention Engine
- EXEC-006 Multi-Mission Orchestration
- PRODUCT-002 Personalization Engine

## Mission

Help successful and retained users grow beyond their current level. Retention keeps users progressing. Expansion helps users reach larger outcomes over time.

## Core Rule

A user is expanding when they consistently achieve larger outcomes. Expansion is not activity volume alone. It is measured through outcome progression, revenue growth, mission velocity, retention stability, team growth, and authority growth.

## Expansion State Contract

`ExpansionProjection.expansionState` contains:

- `currentExpansionStage`
- `expansionLevel`
- `expansionLevelLabel`
- `expansionProgress`
- `nextExpansionOpportunity`
- `nextExpansionOpportunityLabel`
- `expanding`

Supported expansion levels:

- `EMERGING`
- `GROWING`
- `SCALING`
- `OPTIMIZING`
- `LEADING`
- `AUTHORITY`

## Implementation

- Existing `ExpansionProjection` remains backward compatible with legacy `expansionScore`, `expansionStage`, `currentGrowthLever`, `scaleReadiness`, `expansionOpportunities`, `expansionRisks`, metrics, and KPI fields.
- PRODUCT-007 state is added through `expansionState`, `expansionOpportunity`, `expansionRecovery`, `expansionCelebrations`, localization metadata, and personalization metadata.
- Expansion score uses:
  - value realization
  - retention stability
  - growth rate across active metrics
  - repeatable growth signals
- Expansion levels are outcome-stage aware so early customer/revenue growth is not mislabeled as authority.

## Opportunity Engine

The default expansion path is:

- `FIRST_CUSTOMER` -> `FIRST_REVENUE`
- `FIRST_REVENUE` -> `RETENTION_SYSTEM`
- `RETENTION_SYSTEM` -> `TEAM_SCALING`
- `TEAM_SCALING` -> `AUTHORITY_BUILDING`
- `AUTHORITY_BUILDING` -> `MARKET_LEADERSHIP`

The opportunity engine recommends the highest-value next path using business mode, outcome history, retention state, value state, and growth metrics.

## Expansion Risks

Risk detection includes:

- No revenue growth for 30 days: `PLATEAU`
- No new verified outcome for 45 days: `STALLED_GROWTH`
- No team progress for 60 days: `SCALING_BLOCKED`
- Value not proven enough to scale: `VALUE_NOT_PROVEN`
- Missing or declining core lever signals: `LEVER_MISSING` or `LEVER_DECLINING`

## Recovery

Recovery actions include:

- `growth_mission`
- `optimization_mission`
- `expansion_outcome`
- `workforce_assistance`

AI COO risk detection uses expansion recovery copy and routes when expansion risk is present.

## Dashboard

Dashboard Momentum Card displays:

- current expansion level
- recent growth celebrations
- next expansion opportunity
- expansion progress

## Localization

All expansion messaging uses Localization Engine through `expansion.*` keys in `en`, `zh`, and `ms`. Dashboard labels use `src/messages` keys.

## Audit Logging

Expansion audit actions:

- `expansion.progressed`
- `expansion.opportunity.created`
- `expansion.plateau.detected`
- `expansion.recovered`
- `expansion.level.changed`

Audit metadata stores expansion level, opportunity, progress, risk code, recovery action, locale, translation source, fallback flag, message keys, and timestamp.

## Metrics

- Expansion Rate
- Revenue Growth Rate
- Outcome Progression Rate
- Expansion Opportunity Adoption

## Verification

- `pnpm type-check`
- `pnpm vitest run src/__tests__/services/expansion-engine.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts src/__tests__/services/referral-engine.test.ts`
- `pnpm build`

## Acceptance Criteria

- Expansion state exists: done.
- Expansion levels tracked: done.
- Opportunity engine exists: done.
- Expansion risks detected: done.
- Expansion recovery exists: done.
- Localization supported: done.
- Personalization supported: done.
- Type-check passes: done.
- Build passes: done.
