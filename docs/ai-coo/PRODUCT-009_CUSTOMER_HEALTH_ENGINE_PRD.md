# PRODUCT-009 Customer Health Engine PRD

Version: V8

Status: Implemented

Owner: Product Success Team

Depends on:

- PRODUCT-004 Activation Engine
- PRODUCT-005 User Success Engine
- PRODUCT-006 Retention Engine
- PRODUCT-007 Expansion Engine
- PRODUCT-008 Referral Engine

## Mission

Predict which users need help before they fail. Customer Health answers who is succeeding, who is stalled, who is at risk, and who needs intervention.

## Core Rule

Customer Health measures likelihood of continued success. It is not activity, logins, sessions, or time in app.

## Health Contract

`CustomerHealthProjection.customerHealth` contains:

- `healthLevel`
- `healthLevelLabel`
- `healthScore`
- `healthDrivers`
- `riskFactors`
- `interventionRequired`

Supported health levels:

- `CRITICAL`
- `AT_RISK`
- `STABLE`
- `HEALTHY`
- `THRIVING`

## Health Scoring

The engine calculates a weighted health score:

- Activation: 15%
- Success: 25%
- Retention: 25%
- Expansion: 20%
- Referral: 15%

Health is derived from outcome and lifecycle projections, not login/session activity.

## Health Drivers

Drivers include:

- outcome velocity
- mission completion consistency
- retention progress
- expansion progress
- referral success

## Risk Factors

Risk factors include:

- no outcome progress
- success dropping
- retention declining
- expansion plateau
- no mission activity
- low asset utilization
- referral blocked

## Health Trend

Health trend tracks 30 day trajectory:

- `UP`
- `DOWN`
- `STABLE`

When previous health score is unavailable, the trend defaults to `STABLE`.

## Intervention Engine

Intervention rules:

- `HEALTHY` and `THRIVING`: no intervention.
- `AT_RISK`: recovery recommendation or recovery mission.
- `CRITICAL`: recovery mission, priority escalation, and AI COO attention.

Supported recommended actions:

- `none`
- `recovery_recommendation`
- `outcome_recovery_mission`
- `expansion_recovery_mission`
- `retention_recovery_mission`
- `referral_recovery_mission`
- `priority_escalation`
- `ai_coo_attention`

## Dashboard

Dashboard Momentum Card displays:

- health level
- health trend
- top drivers
- top risks
- recommended action

## API

Authenticated projection endpoint:

- `GET /api/v1/customer-health/projection`

## Localization

All health messaging uses Localization Engine through `health.*` keys in `en`, `zh`, and `ms`. Dashboard labels use `src/messages` keys.

## Audit Logging

Customer health audit actions:

- `health.level.changed`
- `health.risk.detected`
- `health.intervention.generated`
- `health.recovered`
- `health.thriving`

Audit metadata stores health level, score, intervention flag, trend, recommended action, risk factors, health drivers, locale, translation source, fallback flag, message keys, and timestamp.

## Metrics

- Healthy User Rate
- Thriving User Rate
- At-Risk Recovery Rate
- Churn Prevention Rate

## Verification

- `pnpm type-check`
- `pnpm vitest run src/__tests__/services/customer-health-engine.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts src/__tests__/services/referral-engine.test.ts src/__tests__/services/expansion-engine.test.ts`
- `pnpm build`

## Acceptance Criteria

- Health model exists: done.
- Health levels tracked: done.
- Health score calculated: done.
- Risk factors identified: done.
- Health drivers identified: done.
- Interventions generated: done.
- Localization supported: done.
- Personalization supported: done.
- Type-check passes: done.
- Build passes: done.
