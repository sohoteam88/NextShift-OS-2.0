# PRODUCT-005 User Success Engine PRD

Version: V8

Status: Implemented

Owner: Product Success Team

Depends on:

- PRODUCT-004 Activation Engine
- PRODUCT-001 First User Experience
- COO-005 Mission Generator V2
- EXEC-006 Multi-Mission Orchestration
- PRODUCT-002 Personalization Engine

## Mission

Ensure activated users achieve real business outcomes. Activation proves the user can experience value; User Success proves the user can achieve outcomes.

## Core Rule

Mission completion contributes to success progress, but mission completion does not equal success.

An outcome is successful only when its required business signal is verified, such as:

- `FIRST_LEAD`: `leadCount > 0`
- `FIRST_CUSTOMER`: `customerCount > 0`
- `FIRST_REVENUE`: `revenue > 0`
- `RETENTION_SYSTEM`: `retentionRate >= target`
- `TEAM_SCALING`: `sopCount > 0`
- `AUTHORITY_BUILDING`: `publishedContentCount >= target`

## Success State Contract

`UserSuccessProjection.successState` contains:

- `currentOutcome`
- `successLevel`
- `progressPercentage`
- `blockedReason`
- `successful`

Supported success levels:

- `NOT_STARTED`
- `WORKING`
- `PROGRESSING`
- `AT_RISK`
- `BLOCKED`
- `SUCCESSFUL`

## Implementation

- `UserSuccessEngine` builds a user-level success projection from:
  - `OutcomeOrchestrator`
  - `ValueRealizationEngine`
  - `RetentionEngine`
  - Mission Authority current mission type
- `buildUserSuccessProjection` computes:
  - success state
  - outcome progress
  - current result
  - next milestone
  - blockers
  - recovery actions
  - celebrations
  - KPI fields
  - localization metadata
- AI COO risk detection consumes blocked or at-risk user success states as `success_*` risks.
- Dashboard projection exposes `userSuccess`.
- Dashboard command card displays current outcome, progress, current result, and next milestone.

## Blocker Detection

- Lead asset exists but no leads: traffic blocker.
- Leads exist but no customers: conversion blocker.
- Customers exist but no revenue: revenue blocker.
- Customers exist but retention below target: retention blocker.
- Team scaling without SOP/agent support: team system blocker.
- Authority building without enough published content: authority blocker.

## Recovery Engine

Recovery actions are generated from the blocker:

- Traffic blocker: activate traffic source.
- Conversion blocker: improve offer.
- Revenue blocker: close first sale.
- Retention blocker: build retention follow-up.
- Team system blocker: create operating SOP.
- Authority blocker: publish authority content.

## Celebrations

Success celebrations are emitted for:

- First lead
- First customer
- First revenue
- First retained customer

Each celebration includes the achievement title, progress gained, and next outcome.

## Localization

All user-facing success copy originates from Localization Engine through `success.*` keys in `en`, `zh`, and `ms`. Unsupported locales fall back to English and do not render raw keys.

## Audit Logging

User Success audit actions:

- `success.progressed`
- `success.blocked`
- `success.recovered`
- `success.completed`

Audit metadata stores outcome, progress, success level, user, timestamp, locale, translation source, fallback flag, and message keys.

## Verification

- `pnpm type-check`
- `pnpm vitest run src/__tests__/services/user-success-engine.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts src/__tests__/services/outcome-orchestrator.test.ts`
- `pnpm build`

## Acceptance Criteria

- Success state exists: done.
- Outcome progress tracked: done.
- Mission completion does not equal success: done.
- Success blockers detected: done.
- Recovery engine exists: done.
- Success celebrations exist: done.
- Localization supported: done.
- Personalization/value signals supported through existing Value and Personalization projections: done.
- Build passes: done.
