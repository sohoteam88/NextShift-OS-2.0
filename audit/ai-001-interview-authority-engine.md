# AI-001 Interview Authority Engine

## Objective

Transform Brand Interview from answer storage into the root Business Authority Engine.

Interview Authority now produces a normalized projection for:

- Business Identity
- User Classification
- Journey Selection
- Mission Selection
- AI COO Context

## New Authority Chain

```text
Interview Authority
Business State
Journey Engine
Mission Engine
AI COO
Dashboard Projection
```

## New Services

Created:

- `src/modules/interview-authority/services/interview-authority-service.ts`
- `src/modules/interview-authority/services/interview-classifier.ts`
- `src/modules/interview-authority/services/business-readiness-engine.ts`
- `src/modules/interview-authority/services/authority-score-engine.ts`
- `src/modules/interview-authority/services/interview-projection.ts`

Created contract:

- `src/modules/interview-authority/contracts/InterviewAuthorityProjection.ts`

## Projection Outputs

The projection exposes:

- `businessMode`
- `experienceLevel`
- `offerStatus`
- `audienceStatus`
- `contentReadiness`
- `trafficReadiness`
- `revenueStatus`
- `primaryOffer`
- `revenueModel`
- `primaryGrowthChannel`
- `brandArchetype`
- `personalStoryVector`
- `authorityScore`
- `readinessScore`
- `recommendedJourney`
- `recommendedMission`

## API

Added:

`GET /api/v1/interview/authority`

Returns:

- `businessMode`
- `experienceLevel`
- `authorityScore`
- `readinessScore`
- `recommendedJourney`
- `recommendedMission`
- readiness and context fields

## Consumer Changes

### Business State

`BusinessStateAssembler` now consumes Interview Authority Projection instead of raw interview authority.

### Journey Engine

`journey-engine-service.ts` now consumes only `InterviewAuthorityProjection`.

Journey Engine does not read raw interview answers, brand interviews, or brand profiles.

### AI COO

`COOPlanAssembler` receives Interview Authority Projection as read-only context and adds it to reasoning/supporting signals.

AI COO does not modify Interview Authority.

## Verification

Commands:

```bash
pnpm exec vitest run src/__tests__/services/interview-authority-engine.test.ts src/__tests__/services/journey-engine-tests.ts src/__tests__/services/mission-engine-authority.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/lib/observability/__tests__/event-envelope.test.ts
pnpm type-check
git diff --check
```

Boundary checks:

```bash
grep -RIn "getInterviewAuthority(" src/modules/journey-engine src/modules/mission-engine src/modules/dashboard src/modules/ai-coo
grep -RIn "\.answers\|extractedProfile\|extracted_profile\|brandInterview\|brandProfile" src/modules/journey-engine src/modules/mission-engine/services/MissionEngineAuthorityService.ts src/modules/dashboard src/modules/ai-coo/adapters/COOPlanAssembler.ts
```

Expected result: no output.
